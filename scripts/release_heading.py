import argparse
import re
import sys
from pathlib import Path


def replace_heading_version(markdown: str, version: str) -> str:
    return re.sub(
        r"^#[ \t]+[^\r\n]*",
        lambda match: match.group().replace("X.XX.X", version, 1),
        markdown,
        count=1,
        flags=re.MULTILINE,
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Set the release version in Markdown headings."
    )
    parser.add_argument("version")
    parser.add_argument("markdowns", nargs="+", type=Path)
    args = parser.parse_args(argv)
    updates = []
    try:
        for path in args.markdowns:
            original = path.read_bytes()
            rendered = replace_heading_version(
                original.decode("utf-8"), args.version
            ).encode("utf-8")
            if rendered != original:
                updates.append((path, rendered))
        for path, rendered in updates:
            path.write_bytes(rendered)
    except (OSError, UnicodeError) as error:
        print(f"[ERROR] {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
