# ANSI Colors

ANSI SGR の色や装飾を、エスケープシーケンスをそのまま表示せずに VS Code 上で確認するための拡張機能です。

## インストール

### VSIX からインストール

```sh
npm install
npm run compile
npx @vscode/vsce package
code --install-extension ansi-colors-0.0.1.vsix
```

VS Code の画面から入れる場合は、Extensions view の `...` メニューから `Install from VSIX...` を選び、生成された `ansi-colors-0.0.1.vsix` を指定してください。

### 開発環境で試す

```sh
npm install
npm test
```

その後、VS Code でこのリポジトリを開き、`F5` を押して Extension Development Host を起動してください。

## 使い方

### ログファイルの自動プレビュー

`*.log` または `*.ansi` ファイルを開くと、既定では `ANSI Colors Log Preview` として開かれます。ANSI の色や装飾を反映した読み取り用プレビューで表示します。

生のテキストエディタとして開きたい場合は、VS Code の `Reopen Editor With...` から通常のテキストエディタに切り替えてください。

### 手動プレビュー

1. ANSI エスケープシーケンスを含むテキストファイルを開きます。
2. Command Palette、エディタタイトルメニュー、またはエディタのコンテキストメニューから `ANSI Colors: Open Preview` を実行します。
3. 現在のエディタの隣にプレビューが開き、ドキュメントの変更に追従して更新されます。

### エディタ内インライン表示

Command Palette、エディタタイトルメニュー、またはエディタのコンテキストメニューから `ANSI Colors: Toggle Inline Colors` を実行します。

インライン表示は VS Code の decoration を使って ANSI の範囲を色付けし、SGR エスケープシーケンスを視覚的に隠します。ファイル本文を書き換えたり、保存内容を変更したりはしません。

## 対応している ANSI シーケンス

reset、bold、faint、italic、underline、inverse、strike-through、標準 8/16 色、256 色、truecolor RGB の SGR 色指定に対応しています。

## 開発

```sh
npm install
npm test
```
