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
project_copyright = copyright
version = jijmodeling_version  # 上で取得済み
release = version
language = "en"

needs_sphinx = "8.2.3"  # Sphinxの最低バージョン
html_last_updated_use_utc = True  # 最終更新日時をUTCで表示

# --- テーマ ---
html_theme = "sphinx_rtd_theme"
html_theme_options = {
    "collapse_navigation": False,  # ナビゲーションの折りたたみ
    "navigation_depth": -1,  # ナビゲーションの深さ（-1で無制限）
}

# --- 拡張 ---
extensions = [
    "sphinx.ext.intersphinx",  # 外部ドキュメントへのリンク
    "sphinx.ext.napoleon",  # Google, Numpyスタイルのdocstringサポート
    "sphinx_rtd_theme",  # Read the Docsテーマ
    "autodoc2",  # 自動ドキュメント生成
    "myst_parser",  # Markdownサポート
    "sphinxcontrib.katex",  # 数式サポート
]
needs_extensions = {
    "autodoc2": "0.5.0",  # autodoc2の最低バージョン
    "myst_parser": "4.0.1",  # myst_parserの最低バージョン
    "sphinxcontrib.katex": "0.9.11",  # sphinxcontrib.katexの最低バージョン
}

# sphinxcontrib-katexの設定
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
    "amsmath",
    "attrs_inline",
    "colon_fence",
    "deflist",
    "dollarmath",
    "fieldlist",
    "html_admonition",
    "html_image",
    "linkify",
    "replacements",
    "smartquotes",
    "strikethrough",
    "substitution",
    "tasklist",
]
myst_dmath_double_inline = True

# インタースフィンクス（Python 標準ライブラリなどへリンク）
intersphinx_mapping = {
    "python": ("https://docs.python.org/3", None),
    "typing_extensions": ("https://typing-extensions.readthedocs.io/en/latest", None),
    "numpy": ("https://numpy.org/doc/stable", None),
}
