import * as vscode from 'vscode';
import { ansiToHtml } from './ansiHtml';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('ansiColors.openPreview', () => openPreview(context))
  );
}

export function deactivate(): void {
  // Nothing to dispose. VS Code disposes registered subscriptions from activate().
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
