import contextlib
import io
from pathlib import Path
import tempfile
import unittest

from scripts import release_heading


class ReleaseHeadingTests(unittest.TestCase):
    def test_replaces_version_in_each_language_title(self):
        for title in ("Release Notes", "リリースノート"):
            with self.subTest(title=title):
                source = f"# JijModeling X.XX.X {title}\n\nRelease details.\n"
                expected = f"# JijModeling 2.10.0 {title}\n\nRelease details.\n"
                self.assertEqual(release_heading.replace_heading_version(source, "2.10.0"), expected)

    def test_only_first_placeholder_in_heading_is_replaced(self):
        source = "# JijModeling X.XX.X Release Notes: X.XX.X\n\nSee X.XX.X for details.\n"
        expected = "# JijModeling 2.10.0 Release Notes: X.XX.X\n\nSee X.XX.X for details.\n"
        self.assertEqual(release_heading.replace_heading_version(source, "2.10.0"), expected)

    def test_earlier_metadata_body_and_lower_headings_are_unchanged(self):
        source = (
            "---\n"
            "title: X.XX.X\n"
            "---\n\n"
            "Notes for X.XX.X.\n\n"
            "## Details for X.XX.X\n\n"
            "# JijModeling X.XX.X Release Notes\n\n"
            "# Another X.XX.X heading\n"
        )
        expected = source.replace(
            "# JijModeling X.XX.X Release Notes", "# JijModeling 2.10.0 Release Notes"
        )
        self.assertEqual(release_heading.replace_heading_version(source, "2.10.0"), expected)

    def test_preserves_crlf_and_absent_final_newline(self):
        source = "# JijModeling X.XX.X リリースノート\r\n\r\nX.XX.X の変更点"
        expected = "# JijModeling 2.10.0 リリースノート\r\n\r\nX.XX.X の変更点"
        self.assertEqual(release_heading.replace_heading_version(source, "2.10.0"), expected)

    def test_already_versioned_heading_leaves_later_placeholders_unchanged(self):
        source = (
            "# JijModeling 2.10.0 Release Notes\n\n"
            "## X.XX.X examples\n\nX.XX.X\n\n# Another X.XX.X heading\n"
        )
        self.assertEqual(release_heading.replace_heading_version(source, "2.10.0"), source)

    def test_cli_updates_both_markdown_files_without_changing_newlines(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            paths = []
            expected = []
            for language, title, newline in (
                ("en", "Release Notes", "\n"),
                ("ja", "リリースノート", "\r\n"),
            ):
                path = directory / f"{language}.md"
                source = f"# JijModeling X.XX.X {title}{newline}{newline}X.XX.X"
                path.write_bytes(source.encode("utf-8"))
                paths.append(path)
                expected.append(source.replace("X.XX.X", "2.10.0", 1).encode("utf-8"))
            error = io.StringIO()
            with contextlib.redirect_stderr(error), contextlib.redirect_stdout(io.StringIO()):
                status = release_heading.main(["2.10.0", *map(str, paths)])
            self.assertEqual(status, 0, error.getvalue())
            for path, content in zip(paths, expected):
                self.assertEqual(path.read_bytes(), content)


if __name__ == "__main__":
    unittest.main()
