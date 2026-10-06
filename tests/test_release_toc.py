import contextlib
import io
from itertools import product
import os
from pathlib import Path
import stat
import tempfile
import unittest

from scripts import release_toc


RELEASE_HEADER = "  - caption: Release Notes\n    chapters:\n"
UNRELEASED = "      - file: releases/unreleased\n"
VERSION = "999.0.0"
FINALIZED = f"      - file: releases/jijmodeling-{VERSION}\n"
TOC = """# Table of contents
format: jb-book
root: introduction
parts:
  - caption: Release Notes
    chapters:
      - file: releases/jijmodeling-2.9.1
  - caption: Resources
    chapters:
      - url: https://example.com/ja/
        title: 日本語
"""


class ReleaseTocTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        self.directory = Path(self.temp_dir.name)

    def write_toc(self, content=TOC, name="_toc.yml"):
        path = self.directory / name
        path.write_bytes(content.encode("utf-8") if isinstance(content, str) else content)
        return path

    def run_command(self, paths, *command, dry_run=False):
        args = [arg for path in paths for arg in ("--toc", str(path))]
        if dry_run:
            args.append("--dry-run")
        error = io.StringIO()
        with contextlib.redirect_stderr(error), contextlib.redirect_stdout(io.StringIO()):
            result = release_toc.main([*args, *command])
        return result, error.getvalue()

    def assert_success(self, paths, *command, dry_run=False):
        result, error = self.run_command(paths, *command, dry_run=dry_run)
        self.assertEqual(result, 0, error)

    def assert_failure(self, paths, *command, dry_run=False):
        result, error = self.run_command(paths, *command, dry_run=dry_run)
        self.assertNotEqual(result, 0)
        self.assertTrue(error.strip())
        return error

    def test_repository_tocs_have_only_the_requested_line_changed(self):
        paths = []
        expected_unreleased = []
        expected_finalized = []
        for language in ("en", "ja"):
            content = Path(f"docs/{language}/_toc.yml").read_bytes()
            paths.append(self.write_toc(content, f"{language}.yml"))
            newline = b"\r\n" if b"\r\n" in content else b"\n"
            header = RELEASE_HEADER.encode().replace(b"\n", newline)
            self.assertEqual(content.count(header), 1)
            expected_unreleased.append(
                content.replace(header, header + UNRELEASED.encode().replace(b"\n", newline), 1)
            )
            expected_finalized.append(
                content.replace(header, header + FINALIZED.encode().replace(b"\n", newline), 1)
            )

        self.assert_success(paths, "ensure-unreleased")
        for path, expected in zip(paths, expected_unreleased):
            self.assertEqual(path.read_bytes(), expected)

        self.assert_success(paths, "ensure-unreleased")
        self.assert_success(paths, "finalize", VERSION)
        for path, expected in zip(paths, expected_finalized):
            self.assertEqual(path.read_bytes(), expected)

        self.assert_success(paths, "finalize", VERSION)
        self.assert_success(paths, "check-no-unreleased")
        for path, expected in zip(paths, expected_finalized):
            self.assertEqual(path.read_bytes(), expected)

    def test_finalize_without_unreleased_inserts_one_line(self):
        path = self.write_toc()
        self.assert_success([path], "finalize", VERSION)
        self.assertEqual(
            path.read_bytes(), TOC.replace(RELEASE_HEADER, RELEASE_HEADER + FINALIZED).encode()
        )

    def test_finalize_moves_entry_and_preserves_quoted_metadata(self):
        old_entry = "      - file: releases/jijmodeling-2.9.1\n"
        unreleased_entry = """      - file: 'releases/unreleased' # Pending release
        title: "次のリリース"
        sections:
          - url: 'https://example.com/notes?a=1&b=2'
            title: "More details"
"""
        source = TOC.replace(old_entry, old_entry + unreleased_entry)
        expected = TOC.replace(
            old_entry,
            unreleased_entry.replace("releases/unreleased", f"releases/jijmodeling-{VERSION}")
            + old_entry,
        )
        path = self.write_toc(source)
        self.assert_success([path], "finalize", VERSION)
        self.assertEqual(path.read_bytes(), expected.encode())

    def test_existing_entry_is_moved_to_front_without_duplication(self):
        old_entry = "      - file: releases/jijmodeling-2.9.1\n"
        for entry, command in (
            (UNRELEASED, ("ensure-unreleased",)),
            (FINALIZED, ("finalize", VERSION)),
        ):
            with self.subTest(command=command):
                path = self.write_toc(TOC.replace(old_entry, old_entry + entry))
                self.assert_success([path], *command)
                self.assertEqual(path.read_bytes(), TOC.replace(old_entry, entry + old_entry).encode())
                self.assert_success([path], *command)
                self.assertEqual(path.read_bytes(), TOC.replace(old_entry, entry + old_entry).encode())

    def test_sequence_comment_moves_with_its_chapter(self):
        old_entry = "      - file: releases/jijmodeling-2.9.1\n"
        source = TOC.replace(
            old_entry,
            old_entry + "      - # Pending release\n        file: releases/unreleased\n",
        )
        path = self.write_toc(source)
        self.assert_success([path], "finalize", VERSION)
        expected = TOC.replace(old_entry, "        # Pending release\n" + FINALIZED + old_entry)
        self.assertEqual(path.read_bytes(), expected.encode())

    def test_prepend_keeps_standalone_comment_with_existing_first_chapter(self):
        old_entry = "      - file: releases/jijmodeling-2.9.1\n"
        annotated_entry = "      # Published release\n" + old_entry
        for section_comment, newline in product(("", " # Release history"), ("\n", "\r\n")):
            source = TOC.replace("    chapters:\n", f"    chapters:{section_comment}\n", 1)
            source = source.replace(old_entry, annotated_entry)
            for entry, command in (
                (UNRELEASED, ("ensure-unreleased",)),
                (FINALIZED, ("finalize", VERSION)),
            ):
                with self.subTest(section_comment=section_comment, newline=newline, command=command):
                    path = self.write_toc(source.replace("\n", newline))
                    self.assert_success([path], *command)
                    expected = source.replace(annotated_entry, entry + annotated_entry)
                    self.assertEqual(path.read_bytes(), expected.replace("\n", newline).encode())

    def test_move_keeps_standalone_comments_with_their_following_chapters(self):
        old_entry = "      - file: releases/jijmodeling-2.9.1\n"
        published = (
            "      # Published release\n"
            "      - file: releases/jijmodeling-2.9.1 # Stable\n"
        )
        pending_comment = "      # Pending release\n"
        for section_comment, newline in product(("", " # Release history"), ("\n", "\r\n")):
            source = TOC.replace("    chapters:\n", f"    chapters:{section_comment}\n", 1)
            source = source.replace(old_entry, published + pending_comment + UNRELEASED)
            for entry, command in (
                (UNRELEASED, ("ensure-unreleased",)),
                (FINALIZED, ("finalize", VERSION)),
            ):
                with self.subTest(section_comment=section_comment, newline=newline, command=command):
                    path = self.write_toc(source.replace("\n", newline))
                    self.assert_success([path], *command)
                    expected = source.replace(
                        published + pending_comment + UNRELEASED,
                        pending_comment + entry + published,
                    )
                    self.assertEqual(path.read_bytes(), expected.replace("\n", newline).encode())

    def test_comment_for_following_section_stays_with_that_section(self):
        old_entry = "      - file: releases/jijmodeling-2.9.1\n"
        source = TOC.replace(old_entry, old_entry + UNRELEASED)
        source = source.replace(
            "  - caption: Resources\n", "  # Resources comment\n  - caption: Resources\n"
        )
        for entry, command in (
            (UNRELEASED, ("ensure-unreleased",)),
            (FINALIZED, ("finalize", VERSION)),
        ):
            with self.subTest(command=command):
                path = self.write_toc(source)
                self.assert_success([path], *command)
                expected = source.replace(old_entry + UNRELEASED, entry + old_entry)
                self.assertEqual(path.read_bytes(), expected.encode())

    def test_release_section_can_be_first_middle_or_last(self):
        preamble = "format: jb-book\nroot: introduction\nparts:\n"
        release = RELEASE_HEADER + "      - file: releases/jijmodeling-2.9.1\n"
        other = "  - caption: Basics\n    chapters:\n      - file: basics/overview\n"
        resource = "  - caption: Links\n    chapters:\n      - url: https://example.com/\n"
        for sections in ((release, other, resource), (other, release, resource), (other, resource, release)):
            with self.subTest(sections=sections):
                source = preamble + "".join(sections)
                path = self.write_toc(source)
                self.assert_success([path], "ensure-unreleased")
                self.assertEqual(
                    path.read_bytes(), source.replace(RELEASE_HEADER, RELEASE_HEADER + UNRELEASED).encode()
                )

    def test_invalid_documents_fail_without_writes(self):
        invalid_documents = {
            "malformed_yaml": "parts: [\n",
            "duplicate_yaml_key": "parts: []\nparts: []\n",
            "non_mapping_document": "- item\n",
            "missing_parts": "format: jb-book\n",
            "non_sequence_parts": "parts: {}\n",
            "non_mapping_part": "parts:\n  - text\n",
            "missing_release_section": TOC.replace("caption: Release Notes", "caption: News"),
            "ambiguous_release_section": TOC + RELEASE_HEADER + UNRELEASED,
            "missing_chapters": "parts:\n  - caption: Release Notes\n",
            "null_chapters": "parts:\n  - caption: Release Notes\n    chapters: null\n",
            "non_mapping_chapter": TOC.replace("- file: releases/jijmodeling-2.9.1", "- text"),
            "non_string_file": TOC.replace("file: releases/jijmodeling-2.9.1", "file: 123"),
        }
        for name, source in invalid_documents.items():
            for command in (("ensure-unreleased",), ("finalize", VERSION), ("check-no-unreleased",)):
                with self.subTest(document=name, command=command):
                    path = self.write_toc(source)
                    self.assert_failure([path], *command)
                    self.assertEqual(path.read_bytes(), source.encode())

    def test_duplicate_release_entries_are_rejected(self):
        for entry in (UNRELEASED, FINALIZED):
            source = TOC.replace(RELEASE_HEADER, RELEASE_HEADER + entry + entry)
            for command in (("ensure-unreleased",), ("finalize", VERSION), ("check-no-unreleased",)):
                with self.subTest(entry=entry, command=command):
                    path = self.write_toc(source)
                    self.assert_failure([path], *command)
                    self.assertEqual(path.read_bytes(), source.encode())

    def test_finalize_rejects_conflicting_existing_target(self):
        source = TOC.replace(RELEASE_HEADER, RELEASE_HEADER + UNRELEASED + FINALIZED)
        path = self.write_toc(source)
        self.assert_failure([path], "finalize", VERSION)
        self.assertEqual(path.read_bytes(), source.encode())

    def test_invalid_second_toc_leaves_both_files_untouched(self):
        for command in (("ensure-unreleased",), ("finalize", VERSION)):
            with self.subTest(command=command):
                first = self.write_toc(name="en.yml")
                second = self.write_toc("parts: [\n", "ja.yml")
                before = [(path.read_bytes(), path.stat().st_mtime_ns) for path in (first, second)]
                error = self.assert_failure([first, second], *command)
                self.assertIn("ja.yml", error)
                self.assertEqual(
                    [(path.read_bytes(), path.stat().st_mtime_ns) for path in (first, second)], before
                )

    def test_guard_rejects_nested_or_misplaced_unreleased_references(self):
        sources = (
            TOC.replace("file: releases/jijmodeling-2.9.1", "file: releases/unreleased"),
            TOC.replace(
                "      - file: releases/jijmodeling-2.9.1\n",
                "      - file: releases/jijmodeling-2.9.1\n"
                "        sections:\n          - file: releases/unreleased\n",
            ),
            TOC.replace("url: https://example.com/ja/", "file: releases/unreleased"),
        )
        for source in sources:
            with self.subTest(source=source):
                path = self.write_toc(source)
                self.assert_failure([path], "check-no-unreleased")
                self.assertEqual(path.read_bytes(), source.encode())

    def test_newline_convention_and_final_newline_are_preserved(self):
        old_file = "      - file: releases/jijmodeling-2.9.1"
        commented_toc = TOC.replace("    chapters:\n", "    chapters: # Release history\n", 1)
        commented_toc = commented_toc.replace(old_file, old_file + " # Published release")
        for original, newline in product((TOC, commented_toc), ("\n", "\r\n")):
            for final_newline in (False, True):
                with self.subTest(comments=original != TOC, newline=newline, final_newline=final_newline):
                    source = original if final_newline else original.rstrip("\n")
                    expected = source.replace(old_file, UNRELEASED + old_file, 1)
                    path = self.write_toc(source.replace("\n", newline))
                    self.assert_success([path], "ensure-unreleased")
                    self.assertEqual(path.read_bytes(), expected.replace("\n", newline).encode())

    def test_noop_preserves_file_mtime(self):
        for entry, command in (
            (UNRELEASED, ("ensure-unreleased",)),
            (FINALIZED, ("finalize", VERSION)),
            ("", ("check-no-unreleased",)),
        ):
            with self.subTest(command=command):
                path = self.write_toc(TOC.replace(RELEASE_HEADER, RELEASE_HEADER + entry))
                os.utime(path, ns=(1_600_000_000_000_000_000, 1_600_000_000_000_000_000))
                before = path.stat().st_mtime_ns
                self.assert_success([path], *command)
                self.assertEqual(path.stat().st_mtime_ns, before)

    def test_dry_run_validates_without_writing(self):
        for command in (("ensure-unreleased",), ("finalize", VERSION)):
            with self.subTest(command=command):
                path = self.write_toc()
                before = path.stat().st_mtime_ns
                self.assert_success([path], *command, dry_run=True)
                self.assertEqual(path.read_bytes(), TOC.encode())
                self.assertEqual(path.stat().st_mtime_ns, before)
                path.write_bytes(b"parts: [\n")
                self.assert_failure([path], *command, dry_run=True)
                self.assertEqual(path.read_bytes(), b"parts: [\n")

    def test_invalid_versions_fail_without_writes(self):
        for version in ("", "2.10", "2.10.0/other", "2.10.0 next", "2.10.0\n"):
            with self.subTest(version=version):
                path = self.write_toc()
                self.assert_failure([path], "finalize", version)
                self.assertEqual(path.read_bytes(), TOC.encode())

    @unittest.skipIf(os.name == "nt", "POSIX file modes are unavailable on Windows")
    def test_file_permissions_are_preserved(self):
        path = self.write_toc()
        path.chmod(0o640)
        self.assert_success([path], "ensure-unreleased")
        self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o640)


if __name__ == "__main__":
    unittest.main()
