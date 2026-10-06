import argparse
import os
import re
import stat
import sys
import tempfile
from collections.abc import Mapping
from dataclasses import dataclass
from io import StringIO
from pathlib import Path

from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedMap, CommentedSeq
from ruamel.yaml.error import CommentMark, YAMLError
from ruamel.yaml.tokens import CommentToken


UNRELEASED = "releases/unreleased"
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TOCS = [ROOT / "docs" / language / "_toc.yml" for language in ("en", "ja")]


@dataclass
class Toc:
    path: Path
    original: bytes
    yaml: YAML
    document: CommentedMap
    chapters: CommentedSeq


def load_toc(path: Path) -> Toc:
    original = path.read_bytes()
    text = original.decode("utf-8")
    yaml = YAML(typ="rt", pure=True)
    yaml.preserve_quotes = True
    yaml.indent(mapping=2, sequence=4, offset=2)
    yaml.width = 4096
    yaml.line_break = "\r\n" if "\r\n" in text else "\n"
    document = yaml.load(text.replace("\r\n", "\n"))
    if not isinstance(document, CommentedMap):
        raise ValueError("expected a TOC mapping")
    parts = document.get("parts")
    if not isinstance(parts, CommentedSeq) or any(
        not isinstance(part, CommentedMap) for part in parts
    ):
        raise ValueError("expected 'parts' to be a sequence of mappings")
    releases = [part for part in parts if part.get("caption") == "Release Notes"]
    if len(releases) != 1:
        raise ValueError("expected exactly one 'Release Notes' section")
    chapters = releases[0].get("chapters")
    if not isinstance(chapters, CommentedSeq):
        raise ValueError("expected 'Release Notes.chapters' to be a sequence")
    files = set()
    for chapter in chapters:
        if not isinstance(chapter, CommentedMap):
            raise ValueError("expected each release chapter to be a mapping")
        if "file" in chapter:
            file = chapter["file"]
            if not isinstance(file, str):
                raise ValueError("expected each chapter's 'file' to be a string")
            if file in files:
                raise ValueError(f"duplicate release chapter: {file}")
            files.add(file)
    return Toc(path, original, yaml, document, chapters)


def contains_unreleased(document: object) -> bool:
    pending = [document]
    visited = set()
    while pending:
        node = pending.pop()
        if id(node) in visited:
            continue
        visited.add(id(node))
        if isinstance(node, Mapping):
            if node.get("file") == UNRELEASED:
                return True
            pending.extend(node.values())
        elif isinstance(node, list):
            pending.extend(node)
    return False


def move_first(chapters: CommentedSeq, index: int) -> None:
    if index:
        comments = chapters.ca.items.get(index)
        chapter = chapters.pop(index)
        chapters.insert(0, chapter)
        if comments is not None:
            chapters.ca.items[0] = comments


def attach_leading_comments(toc: Toc) -> None:
    lines = toc.original.decode("utf-8").replace("\r\n", "\n").splitlines(keepends=True)
    blocks = []
    detached_lines = set()
    for sequence in (toc.document["parts"], toc.chapters):
        for index in range(len(sequence)):
            line, _ = sequence.lc.item(index)
            column = len(lines[line]) - len(lines[line].lstrip())
            start = line
            while start:
                previous = lines[start - 1]
                if previous.strip() and not previous.startswith(" " * column + "#"):
                    break
                start -= 1
            if any(text.lstrip().startswith("#") for text in lines[start:line]):
                blocks.append((sequence, index, "".join(lines[start:line])))
                detached_lines.update(range(start, line))
    if not blocks:
        return

    # ruamel attaches leading comments to the preceding scalar or collection.
    detached_tokens = {}

    def detach(token: CommentToken) -> CommentToken | None:
        if id(token) not in detached_tokens:
            value = token.value
            prefix = value[: len(value) - len(value.lstrip("\r\n"))]
            start = token.start_mark.line - prefix.count("\n")
            token.value = "".join(
                text
                for offset, text in enumerate(value.splitlines(keepends=True))
                if start + offset not in detached_lines
            )
            detached_tokens[id(token)] = token if token.value else None
        return detached_tokens[id(token)]

    pending = [toc.document]
    visited = set()
    while pending:
        node = pending.pop()
        if id(node) in visited or not isinstance(node, (CommentedMap, CommentedSeq)):
            continue
        visited.add(id(node))
        for slots in [node.ca.comment, *node.ca.items.values()]:
            if slots is None:
                continue
            for index, value in enumerate(slots):
                if isinstance(value, CommentToken):
                    slots[index] = detach(value)
                elif isinstance(value, list):
                    value[:] = [
                        item for token in value if (item := detach(token)) is not None
                    ]
                    if not value:
                        slots[index] = None
        if node.ca.comment is not None and not any(node.ca.comment):
            node.ca.comment = None
        node.ca.end[:] = [
            item for token in node.ca.end if (item := detach(token)) is not None
        ]
        pending.extend(node.values() if isinstance(node, Mapping) else node)
    for sequence, index, block in blocks:
        slots = sequence.ca.items.setdefault(index, [None, None, None, None])
        slots[1] = [CommentToken(block, CommentMark(0)), *(slots[1] or [])]


def update_toc(toc: Toc, command: str, version: str | None) -> bool:
    if command == "check-no-unreleased":
        if contains_unreleased(toc.document):
            raise ValueError(f"'{UNRELEASED}' found in TOC")
        return False
    target = (
        UNRELEASED
        if command == "ensure-unreleased"
        else f"releases/jijmodeling-{version}"
    )
    chapters = toc.chapters
    target_index = next(
        (index for index, chapter in enumerate(chapters) if chapter.get("file") == target),
        None,
    )
    unreleased_index = next(
        (index for index, chapter in enumerate(chapters) if chapter.get("file") == UNRELEASED),
        None,
    )
    if command == "finalize" and unreleased_index is not None:
        if target_index is not None:
            raise ValueError(f"both '{UNRELEASED}' and '{target}' already exist")
        if unreleased_index:
            attach_leading_comments(toc)
        chapters[unreleased_index]["file"] = target
        move_first(chapters, unreleased_index)
        return True
    if target_index is None:
        attach_leading_comments(toc)
        chapters.insert(0, CommentedMap(file=target))
        return True
    if target_index:
        attach_leading_comments(toc)
    move_first(chapters, target_index)
    return target_index != 0


def render_toc(toc: Toc) -> bytes:
    stream = StringIO()
    toc.yaml.dump(toc.document, stream)
    rendered = (
        stream.getvalue()
        .replace("\r\n", "\n")
        .replace("\n", toc.yaml.line_break)
        .encode("utf-8")
    )
    if not toc.original.endswith(b"\n"):
        rendered = rendered.removesuffix(toc.yaml.line_break.encode("ascii"))
    return rendered


def write_tocs(updates: list[tuple[Toc, bytes]]) -> None:
    staged = []
    try:
        for toc, rendered in updates:
            with tempfile.NamedTemporaryFile(
                dir=toc.path.parent, prefix=f".{toc.path.name}.", delete=False
            ) as temporary:
                temporary_path = Path(temporary.name)
                staged.append((temporary_path, toc.path))
                temporary.write(rendered)
            temporary_path.chmod(stat.S_IMODE(toc.path.stat().st_mode))
        for temporary_path, destination in staged:
            os.replace(temporary_path, destination)
    finally:
        for temporary_path, _ in staged:
            temporary_path.unlink(missing_ok=True)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Update release TOCs while preserving YAML formatting."
    )
    parser.add_argument(
        "--toc",
        action="append",
        type=Path,
        help="TOC to process (repeatable; defaults to English and Japanese)",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Validate updates without writing files"
    )
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("ensure-unreleased", help="Prepend the unreleased entry if needed")
    finalize = commands.add_parser(
        "finalize", help="Replace unreleased with a versioned release"
    )
    finalize.add_argument("version")
    commands.add_parser(
        "check-no-unreleased", help="Reject unreleased references anywhere in the TOCs"
    )
    args = parser.parse_args(argv)
    version = getattr(args, "version", None)
    if version is not None and not re.fullmatch(
        r"[0-9]+\.[0-9]+\.[0-9]+[A-Za-z0-9.+-]*", version
    ):
        print("[ERROR] Expected a version such as 2.10.0 or 2.10.0rc1.", file=sys.stderr)
        return 1
    updates = []
    for path in args.toc or DEFAULT_TOCS:
        try:
            toc = load_toc(path)
            if update_toc(toc, args.command, version):
                rendered = render_toc(toc)
                if rendered != toc.original:
                    updates.append((toc, rendered))
        except (OSError, UnicodeError, ValueError, YAMLError) as error:
            print(f"[ERROR] {path}: {error}", file=sys.stderr)
            return 1
    if not args.dry_run:
        try:
            write_tocs(updates)
        except OSError as error:
            print(f"[ERROR] Could not write TOCs: {error}", file=sys.stderr)
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
