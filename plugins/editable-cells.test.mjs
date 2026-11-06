import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import plugin from './editable-cells.mjs';
import { enableEditGesture } from '../assets/cell-editor/editor.mjs';

test('identical code in separate cells edits the matching live cell', () => {
  const code = { type: 'code', value: 'x = 1' };
  const outputs = { type: 'outputs' };
  const cell = () => ({ kind: 'notebook-code', children: [code, outputs] });
  const first = cell();
  const second = { ...cell(), key: 'existing-key' };
  const prose = { kind: 'notebook-content', children: [code] };
  const tree = { children: [first, prose, second] };
  const file = { path: fileURLToPath(new URL('../docs/ja/quickstart/scip.ipynb', import.meta.url)) };
  const transform = plugin.transforms[0].plugin();
  transform(tree, file);
  transform(tree, file);

  assert.notEqual(first.key, second.key);
  assert.equal(second.key, 'existing-key');
  for (const block of [first, second]) {
    assert.deepEqual(block.children.slice(0, 2), [code, outputs]);
    assert.deepEqual(block.children.slice(2).map(node => node.model),
      ['edit', 'add'].map(action => ({ action, key: block.key, language: 'ja' })));
  }
  assert.deepEqual(prose.children, [code]);
});

test('touch editing requires a nearby second tap; scrolling cancels the first tap', () => {
  const source = new EventTarget();
  source.closest = () => null;
  const events = new AbortController();
  let edits = 0;
  enableEditGesture(source, () => ++edits, () => assert.fail('Unexpected execution'), events.signal);
  function tap(timeStamp, clientX) {
    const event = Object.assign(new Event('pointerup'), { pointerType: 'touch', isPrimary: true, clientX, clientY: 10 });
    Object.defineProperty(event, 'timeStamp', { value: timeStamp });
    source.dispatchEvent(event);
  }
  tap(100, 10);
  source.dispatchEvent(new Event('pointercancel'));
  tap(200, 10);
  tap(350, 100);
  tap(900, 100);
  assert.equal(edits, 0);
  tap(1050, 102);
  assert.equal(edits, 1);
  events.abort();
  tap(1500, 10);
  tap(1600, 10);
  assert.equal(edits, 1);
});
