import * as assert from 'assert';
import { ansiToHtml } from '../src/ansiHtml';

assert.strictEqual(
  ansiToHtml('plain'),
  'plain'
);

assert.strictEqual(
  ansiToHtml('\x1b[31mred\x1b[0m normal'),
  '<span style="color: #cd3131">red</span> normal'
);

assert.strictEqual(
  ansiToHtml('\x1b[1;4;92mbold green\x1b[22m still green\x1b[0m'),
  '<span style="color: #23d18b; font-weight: 700; text-decoration: underline">bold green</span><span style="color: #23d18b; text-decoration: underline"> still green</span>'
);

assert.strictEqual(
  ansiToHtml('\x1b[38;2;12;34;56mtruecolor\x1b[39m'),
  '<span style="color: #0c2238">truecolor</span>'
);

assert.strictEqual(
  ansiToHtml('\x1b[48;5;196mhot\x1b[49m'),
  '<span style="background-color: #ff0000">hot</span>'
);

assert.strictEqual(
  ansiToHtml('<tag>&"\x1b[31mred'),
  '&lt;tag&gt;&amp;&quot;<span style="color: #cd3131">red</span>'
);

assert.strictEqual(
  ansiToHtml('hide\x1b[2K line'),
  'hide line'
);

console.log('ansiHtml tests passed');
