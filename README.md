# ANSI Colors

VS Code extension that previews ANSI SGR colors and styles without displaying raw escape sequences.

## Usage

### Automatic log preview

Open a `*.log` or `*.ansi` file. VS Code opens it with `ANSI Colors Log Preview` by default, rendering ANSI colors in a read-only preview.

Use `Reopen Editor With...` if you need to switch between the ANSI preview and the raw text editor.

### Manual preview

1. Open a text file that contains ANSI escape sequences.
2. Run `ANSI Colors: Open Preview` from the Command Palette, editor title menu, or editor context menu.
3. The preview opens beside the active editor and updates as the document changes.

### Inline editor colors

Run `ANSI Colors: Toggle Inline Colors` from the Command Palette, editor title menu, or editor context menu.

Inline mode uses VS Code editor decorations to color ANSI ranges and visually hide SGR escape sequences. It does not rewrite or save modified file contents.

Supported sequences include reset, bold, faint, italic, underline, inverse, strike-through, standard 8/16 colors, 256-color mode, and truecolor RGB SGR colors.

## Development

```sh
npm install
npm test
```

Press `F5` in VS Code to launch an Extension Development Host, then run `ANSI Colors: Open Preview`.
