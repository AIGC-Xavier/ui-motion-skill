import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handleDemoRequest } from '../scripts/serve-demo.mjs';

async function request(url) {
  let response;
  await handleDemoRequest({ url }, {
    writeHead(status, headers = {}) { response = { status, headers }; },
    end(body = '') { response.body = String(body); },
  });
  return response;
}

test('root redirects to the demo directory and its relative assets remain reachable', async () => {
  const root = await request('/');
  assert.equal(root.status, 302);
  assert.equal(root.headers.location, '/demo/index.html');

  const html = await request(root.headers.location);
  assert.equal(html.status, 200);
  assert.match(html.headers['content-type'], /^text\/html/);
  const stylesheetPath = html.body.match(/<link rel="stylesheet" href="([^"]+)"/)?.[1];
  const modulePath = html.body.match(/<script type="module" src="([^"]+)"/)?.[1];
  assert.ok(stylesheetPath);
  assert.ok(modulePath);

  const stylesheetUrl = new URL(stylesheetPath, `http://demo.local${root.headers.location}`);
  const moduleUrl = new URL(modulePath, `http://demo.local${root.headers.location}`);
  const stylesheet = await request(stylesheetUrl.pathname);
  assert.equal(stylesheet.status, 200);
  assert.match(stylesheet.headers['content-type'], /^text\/css/);

  const module = await request(moduleUrl.pathname);
  assert.equal(module.status, 200);
  assert.match(module.headers['content-type'], /^text\/javascript/);
});
