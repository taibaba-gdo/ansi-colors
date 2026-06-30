import * as vscode from 'vscode';
import { ansiToHtml, CssStyle, parseAnsi } from './ansiHtml';

interface InlineState {
  readonly hiddenDecoration: vscode.TextEditorDecorationType;
  readonly styleDecorations: Map<string, vscode.TextEditorDecorationType>;
}

const inlineEditors = new Map<string, InlineState>();

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('ansiColors.openPreview', () => openPreview(context)),
    vscode.commands.registerCommand('ansiColors.toggleInlineColors', () => toggleInlineColors()),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        updateInlineDecorations(editor);
      }
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      for (const editor of vscode.window.visibleTextEditors) {
        if (editor.document === event.document) {
          updateInlineDecorations(editor);
        }
      }
    }),
    vscode.workspace.onDidCloseTextDocument((document) => clearInlineState(document.uri.toString())),
    vscode.window.registerCustomEditorProvider(
      'ansiColors.logPreview',
      new AnsiLogPreviewProvider(context),
      {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: true
      }
    )
  );
}

export function deactivate(): void {
  // Nothing to dispose. VS Code disposes registered subscriptions from activate().
}

class AnsiLogPreviewProvider implements vscode.CustomTextEditorProvider {
  public constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: false,
      localResourceRoots: [this.context.extensionUri]
    };

    const update = () => {
      webviewPanel.webview.html = renderWebview(document.getText(), document.fileName || document.languageId);
    };

    update();
    const subscription = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document === document) {
        update();
      }
    });
    webviewPanel.onDidDispose(() => subscription.dispose());
  }
}

async function openPreview(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showInformationMessage('Open a text editor before running ANSI Colors preview.');
    return;
  }

  const document = editor.document;
  const title = `ANSI Preview: ${document.fileName ? basename(document.fileName) : document.languageId}`;
  const panel = vscode.window.createWebviewPanel(
    'ansiColorsPreview',
    title,
    vscode.ViewColumn.Beside,
    {
      enableScripts: false,
      localResourceRoots: [context.extensionUri]
    }
  );

  const update = () => {
    panel.webview.html = renderWebview(document.getText(), document.fileName || document.languageId);
  };

  update();

  const changeSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document === document) {
      update();
    }
  });
  panel.onDidDispose(() => changeSubscription.dispose());
}

function toggleInlineColors(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showInformationMessage('Open a text editor before toggling ANSI Colors inline rendering.');
    return;
  }

  const key = editor.document.uri.toString();
  if (inlineEditors.has(key)) {
    clearInlineState(key);
    return;
  }

  inlineEditors.set(key, {
    hiddenDecoration: vscode.window.createTextEditorDecorationType({
      textDecoration: 'none; opacity: 0; font-size: 0; letter-spacing: -999px;'
    }),
    styleDecorations: new Map()
  });
  updateInlineDecorations(editor);
}

function updateInlineDecorations(editor: vscode.TextEditor): void {
  const key = editor.document.uri.toString();
  const state = inlineEditors.get(key);
  if (!state) {
    return;
  }

  const parsed = parseAnsi(editor.document.getText());
  const escapeRanges = parsed.escapeSpans.map((span) => new vscode.Range(
    editor.document.positionAt(span.start),
    editor.document.positionAt(span.end)
  ));
  const rangesByStyle = new Map<string, vscode.Range[]>();

  for (const span of parsed.styleSpans) {
    const styleKey = JSON.stringify(span.style);
    const ranges = rangesByStyle.get(styleKey) ?? [];
    ranges.push(new vscode.Range(
      editor.document.positionAt(span.start),
      editor.document.positionAt(span.end)
    ));
    rangesByStyle.set(styleKey, ranges);
  }

  editor.setDecorations(state.hiddenDecoration, escapeRanges);
  for (const [styleKey, ranges] of rangesByStyle) {
    let decoration = state.styleDecorations.get(styleKey);
    if (!decoration) {
      decoration = vscode.window.createTextEditorDecorationType(toDecorationOptions(JSON.parse(styleKey) as CssStyle));
      state.styleDecorations.set(styleKey, decoration);
    }
    editor.setDecorations(decoration, ranges);
  }
  for (const [styleKey, decoration] of state.styleDecorations) {
    if (!rangesByStyle.has(styleKey)) {
      editor.setDecorations(decoration, []);
    }
  }
}

function clearInlineState(key: string): void {
  const state = inlineEditors.get(key);
  if (!state) {
    return;
  }

  state.hiddenDecoration.dispose();
  for (const decoration of state.styleDecorations.values()) {
    decoration.dispose();
  }
  inlineEditors.delete(key);
}

function toDecorationOptions(style: CssStyle): vscode.DecorationRenderOptions {
  return {
    color: style.color,
    backgroundColor: style.backgroundColor,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    opacity: style.opacity,
    textDecoration: style.textDecoration
  };
}

function renderWebview(text: string, sourceName: string): string {
  const body = ansiToHtml(text, {
    foreground: 'var(--vscode-editor-foreground)',
    background: 'var(--vscode-editor-background)'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ANSI Colors Preview</title>
  <style>
    :root {
      color: var(--vscode-editor-foreground);
      background: var(--vscode-editor-background);
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
      font-weight: var(--vscode-editor-font-weight);
    }
    body {
      margin: 0;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }
    header {
      position: sticky;
      top: 0;
      z-index: 1;
      padding: 8px 12px;
      border-bottom: 1px solid var(--vscode-editorWidget-border);
      background: var(--vscode-editor-background);
      color: var(--vscode-descriptionForeground);
      font-family: var(--vscode-font-family);
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    pre {
      box-sizing: border-box;
      min-height: calc(100vh - 33px);
      margin: 0;
      padding: 12px;
      color: var(--vscode-editor-foreground);
      background: var(--vscode-editor-background);
      font: inherit;
      line-height: 1.45;
      overflow: auto;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      tab-size: 4;
    }
  </style>
</head>
<body>
  <header>${escapeHtml(sourceName)}</header>
  <pre>${body}</pre>
</body>
</html>`;
}

function basename(path: string): string {
  return path.replace(/^.*[\\/]/, '');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
