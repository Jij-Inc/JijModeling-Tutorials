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
    "sphinx.ext.autodoc",
    "sphinx.ext.autosummary",  # モジュール一覧を自動生成
    "sphinx.ext.napoleon",  # Google/Numpy 形式 docstring
    "sphinx.ext.intersphinx",  # 外部ドキュメントへのリンク
    "sphinx.ext.mathjax",  # 数式サポート
    "sphinx.ext.doctest",  # doctest サポート
    "sphinx.ext.viewcode",  # ソースコード参照リンク
    "sphinx_autodoc_typehints",  # 型ヒント表示
    "sphinx_copybutton",  # コードブロックにコピーボタン
    "sphinx_design",  # 現代的なデザイン要素
]

# --- autodoc 詳細設定 ---
autodoc_default_options = {
    "members": True,  # クラスや関数のメンバーを自動表示
    "undoc-members": True,  # docstringがないメンバーも表示
    "show-inheritance": True,  # 継承関係を表示
    "inherited-members": True,  # 継承されたメンバーも表示
}

# --- autodoc member の順序 ---
autodoc_member_order = "bysource"  # ソースコード順で表示

# --- autosummary 設定 ---
autosummary_generate = True  # ビルド時に個別ページを自動生成
autosummary_generate_overwrite = True  # 既存ファイルを上書き
autosummary_imported_members = True  # インポートされたメンバーも含める
autosummary_ignore_module_all = False  # __all__ を無視しない

# --- 型ヒント設定 ---
typehints_defaults = "comma"  # デフォルト値をカンマ区切りで表示
typehints_use_signature = True  # シグネチャに型ヒントを表示
typehints_use_signature_return = True  # 戻り値の型もシグネチャに表示

# --- HTML テーマ設定 ---
html_theme_options = {
    "navigation_depth": 5,  # ナビゲーションの深度
    "collapse_navigation": True,  # ナビゲーションを折りたたみ可能に
    "sticky_navigation": True,  # ナビゲーションを固定
    "includehidden": True,  # 隠れた目次も含める
    "titles_only": False,  # タイトルのみではなくサブヘッダーも表示
}

# インタースフィンクス（Python 標準ライブラリなどへリンク）
intersphinx_mapping = {
    "python": ("https://docs.python.org/3", None),
    "typing_extensions": ("https://typing-extensions.readthedocs.io/en/latest", None),
    "numpy": ("https://numpy.org/doc/stable", None),
}
