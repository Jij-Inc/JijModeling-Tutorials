from datetime import date

# --- 基本 ---
project = "JijModeling API"
author = "Jij Inc."
copyright = f"{date.today().year}, {author}"
language = "en"

# --- テーマ ---
html_theme = "sphinx_rtd_theme"

# --- 拡張 ---
extensions = [
    "sphinx.ext.autodoc",  # 自動API生成（標準）
    "sphinx.ext.intersphinx",  # 外部ドキュメントへのリンク
    "sphinx.ext.mathjax",  # 数式サポート
]

# --- Autodoc 設定 ---
autodoc_default_options = {
    "members": True,
    "undoc-members": True,
    "show-inheritance": True,
    "inherited-members": True,
    "special-members": "__init__",
}
autodoc_member_order = "bysource"
autodoc_docstring_signature = True

# インタースフィンクス（Python 標準ライブラリなどへリンク）
intersphinx_mapping = {
    "python": ("https://docs.python.org/3", None),
    "typing_extensions": ("https://typing-extensions.readthedocs.io/en/latest", None),
    "numpy": ("https://numpy.org/doc/stable", None),
}
