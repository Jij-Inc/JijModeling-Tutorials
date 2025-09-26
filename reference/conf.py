import os
from datetime import date

# JijModelingのパスを動的に取得
import jijmodeling

# 相対パスに変換（Sphinx向け）
jijmodeling_path = os.path.relpath(
    os.path.dirname(jijmodeling.__file__), start=os.path.dirname(__file__)
)
jijmodeling_version = jijmodeling.__version__  # type: ignore
print(
    f"JijModeling {jijmodeling_version} found at: {jijmodeling_path}, Version: {jijmodeling_version}"
)

# --- 基本 ---
project = "JijModeling API"
author = "Jij Inc."
copyright = f"{date.today().year}, {author}"
version = jijmodeling_version  # 上で取得済み
release = version
language = "en"

# --- テーマ ---
html_theme = "sphinx_rtd_theme"

# --- 拡張 ---
extensions = [
    "sphinx.ext.intersphinx",  # 外部ドキュメントへのリンク
    "autodoc2",  # 自動ドキュメント生成
    "sphinxcontrib.katex",  # 数式サポート
    "myst_parser",  # Markdownサポート
]
katex_prerender = True

# sphinx-autodoc2のパッケージ設定（.pyiファイル優先）
autodoc2_packages = [
    {
        "path": jijmodeling_path,  # pythonディレクトリのパス
        "module": "jijmodeling",  # モジュール名
        "exclude_files": ["*.py"],  # .pyファイルを除外して.pyiを優先
    }
]

autodoc2_render_plugin = "myst"  # Markdownレンダリングプラグインを指定

myst_enable_extensions = [
    "smartquotes",  # スマートクォート
    "amsmath",  # 数式サポート
    "dollarmath",  # $記法での数式
]
myst_dmath_double_inline = True

# インタースフィンクス（Python 標準ライブラリなどへリンク）
intersphinx_mapping = {
    "python": ("https://docs.python.org/3", None),
    "typing_extensions": ("https://typing-extensions.readthedocs.io/en/latest", None),
    "numpy": ("https://numpy.org/doc/stable", None),
}
