export interface RenderOptions {
  readonly foreground?: string;
  readonly background?: string;
}

interface AnsiStyle {
  foreground?: string;
  background?: string;
  bold: boolean;
  faint: boolean;
  italic: boolean;
  underline: boolean;
  inverse: boolean;
  strike: boolean;
}

const defaultStyle: AnsiStyle = {
  bold: false,
  faint: false,
  italic: false,
  underline: false,
  inverse: false,
  strike: false
};

const normalColors = [
  '#000000',
  '#cd3131',
  '#0dbc79',
  '#e5e510',
  '#2472c8',
  '#bc3fbc',
  '#11a8cd',
  '#e5e5e5'
];

const brightColors = [
  '#666666',
  '#f14c4c',
  '#23d18b',
  '#f5f543',
  '#3b8eea',
  '#d670d6',
  '#29b8db',
  '#ffffff'
];

export function ansiToHtml(input: string, options: RenderOptions = {}): string {
  const state: AnsiStyle = { ...defaultStyle };
  const chunks: string[] = [];
  let activeCss = '';
  let cursor = 0;
  const sgrPattern = /\x1b\[([0-9;:]*)m/g;

  for (const match of input.matchAll(sgrPattern)) {
    const index = match.index ?? 0;
    appendText(input.slice(cursor, index));
    applySgr(state, parseSgr(match[1]));
    activeCss = syncSpan(chunks, activeCss, styleToCss(state, options));
    cursor = index + match[0].length;
  }

  appendText(input.slice(cursor));
  if (activeCss) {
    chunks.push('</span>');
  }

  return chunks.join('');

  function appendText(text: string): void {
    if (!text) {
      return;
    }
    const css = styleToCss(state, options);
    activeCss = syncSpan(chunks, activeCss, css);
    chunks.push(escapeHtml(stripUnsupportedAnsi(text)));
  }
}

function syncSpan(chunks: string[], activeCss: string, nextCss: string): string {
  if (activeCss === nextCss) {
    return activeCss;
  }

  if (activeCss) {
    chunks.push('</span>');
  }
  if (nextCss) {
    chunks.push(`<span style="${nextCss}">`);
  }
  return nextCss;
}

function parseSgr(raw: string): number[] {
  if (!raw) {
    return [0];
  }
  return raw
    .replace(/:/g, ';')
    .split(';')
    .map((part) => Number.parseInt(part, 10))
    .map((value) => Number.isNaN(value) ? 0 : value);
}

function applySgr(state: AnsiStyle, codes: number[]): void {
  for (let i = 0; i < codes.length; i += 1) {
    const code = codes[i];

    if (code === 0) {
      resetStyle(state);
    } else if (code === 1) {
      state.bold = true;
      state.faint = false;
    } else if (code === 2) {
      state.faint = true;
      state.bold = false;
    } else if (code === 3) {
      state.italic = true;
    } else if (code === 4) {
      state.underline = true;
    } else if (code === 7) {
      state.inverse = true;
    } else if (code === 9) {
      state.strike = true;
    } else if (code === 22) {
      state.bold = false;
      state.faint = false;
    } else if (code === 23) {
      state.italic = false;
    } else if (code === 24) {
      state.underline = false;
    } else if (code === 27) {
      state.inverse = false;
    } else if (code === 29) {
      state.strike = false;
    } else if (code >= 30 && code <= 37) {
      state.foreground = normalColors[code - 30];
    } else if (code === 39) {
      state.foreground = undefined;
    } else if (code >= 40 && code <= 47) {
      state.background = normalColors[code - 40];
    } else if (code === 49) {
      state.background = undefined;
    } else if (code >= 90 && code <= 97) {
      state.foreground = brightColors[code - 90];
    } else if (code >= 100 && code <= 107) {
      state.background = brightColors[code - 100];
    } else if ((code === 38 || code === 48) && codes[i + 1] === 5 && i + 2 < codes.length) {
      const color = xterm256ToHex(codes[i + 2]);
      if (code === 38) {
        state.foreground = color;
      } else {
        state.background = color;
      }
      i += 2;
    } else if ((code === 38 || code === 48) && codes[i + 1] === 2 && i + 4 < codes.length) {
      const color = rgbToHex(codes[i + 2], codes[i + 3], codes[i + 4]);
      if (code === 38) {
        state.foreground = color;
      } else {
        state.background = color;
      }
      i += 4;
    }
  }
}

function resetStyle(state: AnsiStyle): void {
  delete state.foreground;
  delete state.background;
  Object.assign(state, defaultStyle);
}

function styleToCss(style: AnsiStyle, options: RenderOptions): string {
  const declarations: string[] = [];
  const foreground = style.inverse ? style.background ?? options.background : style.foreground;
  const background = style.inverse ? style.foreground ?? options.foreground : style.background;
  const decorations: string[] = [];

  if (foreground) {
    declarations.push(`color: ${foreground}`);
  }
  if (background) {
    declarations.push(`background-color: ${background}`);
  }
  if (style.bold) {
    declarations.push('font-weight: 700');
  }
  if (style.faint) {
    declarations.push('opacity: 0.75');
  }
  if (style.italic) {
    declarations.push('font-style: italic');
  }
  if (style.underline) {
    decorations.push('underline');
  }
  if (style.strike) {
    decorations.push('line-through');
  }
  if (decorations.length > 0) {
    declarations.push(`text-decoration: ${decorations.join(' ')}`);
  }

  return declarations.join('; ');
}

function xterm256ToHex(value: number): string {
  const color = clamp(value, 0, 255);
  if (color < 8) {
    return normalColors[color];
  }
  if (color < 16) {
    return brightColors[color - 8];
  }
  if (color >= 232) {
    const level = 8 + (color - 232) * 10;
    return rgbToHex(level, level, level);
  }

  const adjusted = color - 16;
  const red = Math.floor(adjusted / 36);
  const green = Math.floor((adjusted % 36) / 6);
  const blue = adjusted % 6;
  return rgbToHex(cubeLevel(red), cubeLevel(green), cubeLevel(blue));
}

function cubeLevel(value: number): number {
  return value === 0 ? 0 : 55 + value * 40;
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue].map((value) => clamp(value, 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function stripUnsupportedAnsi(text: string): string {
  return text.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
