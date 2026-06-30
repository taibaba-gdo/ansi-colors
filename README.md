# ANSI Colors

VS Code extension that previews ANSI SGR colors and styles without displaying raw escape sequences.

## Usage

1. Open a text file that contains ANSI escape sequences.
2. Run `ANSI Colors: Open Preview` from the Command Palette, editor title menu, or editor context menu.
3. The preview opens beside the active editor and updates as the document changes.

Supported sequences include reset, bold, faint, italic, underline, inverse, strike-through, standard 8/16 colors, 256-color mode, and truecolor RGB SGR colors.

## Development

```sh
npm install
npm test
```

Press `F5` in VS Code to launch an Extension Development Host, then run `ANSI Colors: Open Preview`.
