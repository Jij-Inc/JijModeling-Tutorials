import argparse
import sys
from pathlib import Path

from jupyter_book.config import get_default_sphinx_config
from ruamel.yaml import YAML


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Allow unresolved links in a Jupyter Book configuration."
    )
    parser.add_argument("config", type=Path, help="Path to the book's _config.yml.")
    args = parser.parse_args(argv)

    yaml = YAML()
    config = yaml.load(args.config)
    warnings = config["sphinx"]["config"].setdefault(
        "suppress_warnings", get_default_sphinx_config()["suppress_warnings"]
    )
    warnings.extend(["ref", "myst.xref_missing", "myst.iref_missing"])
    yaml.dump(config, args.config)
    return 0


if __name__ == "__main__":
    sys.exit(main())
