import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdownImage } from '../lib/image-frame.js';

test('renderMarkdownImage wraps images when framed is true', () => {
  const html = renderMarkdownImage({
    src: 'menu.png',
    alt: 'Menu',
    framed: true
  });
  assert.match(html, /class="prose-img-iso"/);
  assert.match(html, /class="prose-img-iso__frame"/);
  assert.doesNotMatch(html, /prose-img-iso__caption/);
});

test('renderMarkdownImage leaves images plain when framed is false', () => {
  const html = renderMarkdownImage({ src: 'x.png', alt: 'X', framed: false });
  assert.match(html, /^<img /);
  assert.doesNotMatch(html, /prose-img-iso/);
});

test('renderMarkdownImage shows caption from markdown title when framed', () => {
  const html = renderMarkdownImage({
    src: 'x.png',
    alt: 'X',
    title: 'Settings dropdown',
    framed: true
  });
  assert.match(html, /class="prose-img-iso__caption mono-label">Settings dropdown<\/span>/);
  assert.doesNotMatch(html, /title=/);
});

test('renderMarkdownImage uses title text as caption without iso keyword', () => {
  const html = renderMarkdownImage({
    src: 'x.png',
    alt: 'X',
    title: 'iso Settings dropdown',
    framed: true
  });
  assert.match(html, /class="prose-img-iso__caption mono-label">iso Settings dropdown<\/span>/);
});

test('renderMarkdownImage emits width and height when provided', () => {
  const html = renderMarkdownImage({
    src: 'x.png',
    alt: 'X',
    width: 1200,
    height: 800,
    framed: true
  });
  assert.match(html, /width="1200" height="800"/);
});
