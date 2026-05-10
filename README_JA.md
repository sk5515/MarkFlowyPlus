# MarkFlowyPlus

MarkFlowyPlus は [MarkFlowy](https://github.com/drl990114/MarkFlowy) を fork して、個人用途向けに変更を加えたバージョンです。元プロジェクトのローカルファーストな Markdown エディタの基盤を保ちながら、UI、操作性、パッケージング、パフォーマンスを調整しています。

このリポジトリは upstream の公式 MarkFlowy ではありません。元プロジェクト、リリース、履歴については [drl990114/MarkFlowy](https://github.com/drl990114/MarkFlowy) を参照してください。

## 主な変更

- AI/Copilot 関連のコードと依存関係を削除。
- エディターツールバー、タブ、コンテキストメニュー、ダイアログ、通知、テーマ切り替えを調整。
- 表挿入 UI、検索ボタン、find/replace、macOS メニュー表示を改善。
- 起動とパッケージサイズを最適化。エクスポート処理の遅延読み込み、フォント削減、未使用依存の削除を実施。
- ローカルファイルとローカルワークスペース中心の Markdown 編集体験を維持。

## Features

- WYSIWYG、ソースコード、プレビューの 3 モード。
- Markdown、JSON、TXT、画像プレビューをサポート。
- ファイルツリー、タブ、ブックマーク、目次、グローバル検索。
- ライト/ダークテーマとカスタムテーマ。
- カスタムキーボードショートカット。
- 画像貼り付け/アップロード時のローカル相対パス保存。
- Tauri による macOS デスクトップアプリのパッケージング。

## Development

```bash
yarn install
yarn workspace @markflowy/desktop tauri:dev
```

Build desktop frontend:

```bash
yarn workspace @markflowy/desktop build
```

Build macOS DMG:

```bash
scripts/package-dmg.sh
```

## Notes

このプロジェクトは主に個人のデスクトップ利用向けです。今後 upstream MarkFlowy とさらに差分が増える可能性があります。一部の upstream 機能は意図的に削除されています。

## Credits

This project is forked from [MarkFlowy](https://github.com/drl990114/MarkFlowy). Thanks to the original author and contributors.

## License

This project follows the upstream license. See [LICENSE](./LICENSE).

## Preview

![MarkFlowyPlus PC preview](./preview_pc.jpg)

![MarkFlowyPlus macOS preview](./preview_mac.png)
