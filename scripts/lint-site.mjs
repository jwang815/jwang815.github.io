#!/usr/bin/env node
/**
 * Prototype site lint — answers "can static analysis catch the mistakes
 * agents keep shipping?" without a framework, npm install, or paid CI.
 *
 * Run: node scripts/lint-site.mjs
 * Exit 1 if any error-level finding is present.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warns = [];
const note = (arr, msg) => arr.push(msg);

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}
function walkHtml(dir = '') {
  const out = [];
  for (const e of fs.readdirSync(path.join(root, dir || '.'), {withFileTypes: true})) {
    if (['.git', '_site', 'node_modules', 'images'].includes(e.name)) continue;
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walkHtml(rel));
    else if (e.name.endsWith('.html')) out.push(rel);
  }
  return out;
}

const htmlFiles = walkHtml();
const expDirs = fs.readdirSync(root)
  .filter((n) => n.endsWith('-expedition') && fs.statSync(path.join(root, n)).isDirectory())
  .map((n) => n.replace(/-expedition$/, ''));
const advertised = [...expDirs.filter((id) => id !== 'socotra'), 'socotra'];

// 1. inquire-cta allowlist vs advertised expeditions (June 9 miss)
const cta = read('js/inquire-cta.js');
const dests = [...cta.matchAll(/'([a-z-]+)'/g)].map((m) => m[1])
  .filter((s, i, a) => a.indexOf(s) === i && s !== 'use strict' && !s.startsWith('wp-'));
const destBlock = (cta.match(/var DESTS = \[([\s\S]*?)\];/) || [])[1] || '';
const destList = [...destBlock.matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
const ctaPages = new Set(htmlFiles.filter((f) => read(f).includes('inquire-cta.js')));
const missingCta = [];
for (const id of advertised) {
  const page = id === 'socotra' ? 'socotra/index.html' : `${id}-expedition/index.html`;
  const inAllow = destList.includes(id);
  const loads = exists(page) && ctaPages.has(page);
  if (!inAllow || !loads) missingCta.push(`${id} (allowlist=${inAllow}, script=${loads})`);
}
if (missingCta.length) {
  note(errors, `${missingCta.length} advertised trips have no working inquire CTA: ${missingCta.join(', ')}`);
}

// 2. i18n keys used on a page must exist in the loaded lang file
function langKeys(src) {
  return new Set([...src.matchAll(/^\s*"([^"]+)":\s*\{/gm)].map((m) => m[1]));
}
const langFiles = Object.fromEntries(
  fs.readdirSync(path.join(root, 'lang'))
    .filter((n) => n.endsWith('.js') && n !== 'i18n.js')
    .map((n) => [n.replace(/\.js$/, ''), langKeys(read(`lang/${n}`))])
);
for (const file of htmlFiles) {
  const html = read(file);
  const used = [...html.matchAll(/data-i18n(?:-html|-placeholder)?="([^"]+)"/g)].map((m) => m[1]);
  const loaded = [...html.matchAll(/\/lang\/([a-z0-9-]+)\.js/g)].map((m) => m[1]).filter((s) => s !== 'i18n');
  if (!used.length || !loaded.length) continue;
  const defined = new Set(loaded.flatMap((s) => [...(langFiles[s] || [])]));
  const missing = [...new Set(used)].filter((k) => !defined.has(k));
  if (missing.length) {
    note(errors, `${file} uses ${missing.length} i18n key(s) missing from ${loaded.join(',')}: ${missing.slice(0, 8).join(', ')}`);
  }
}

// 3. Cache-bust versions must not fragment (two follow-up commits on 2026-06-10)
const versions = new Map();
for (const file of htmlFiles) {
  for (const v of read(file).matchAll(/(?:\/(?:js|lang|css)\/[^"?]+)\?v=([A-Za-z0-9._-]+)/g)) {
    if (!versions.has(v[1])) versions.set(v[1], []);
    versions.get(v[1]).push(file);
  }
}
if (versions.size > 2) {
  note(errors, `asset ?v= is fragmented across ${versions.size} tokens (${[...versions.keys()].join(', ')}); agents forget a page and ship a second cache-bust commit`);
}

// 4. Shared chrome drift — copied <nav> / <footer> hashes
function hashes(tag) {
  const c = new Map();
  const re = new RegExp(`<${tag}[\\s\\S]{80,12000}?</${tag}>`, 'i');
  for (const file of htmlFiles) {
    const m = read(file).match(re);
    if (!m) continue;
    const h = createHash('md5').update(m[0]).digest('hex').slice(0, 8);
    if (!c.has(h)) c.set(h, []);
    c.get(h).push(file);
  }
  return c;
}
const navs = hashes('nav');
const foots = hashes('footer');
if (navs.size > 3) note(warns, `${navs.size} distinct <nav> blobs — chrome is copy-pasted, not shared`);
if (foots.size > 3) note(warns, `${foots.size} distinct <footer> blobs — email/link edits cannot be one change`);

// 5. Two CSS architectures (June 9 batch vs older inlined pages)
const expPages = htmlFiles.filter((f) => /^[a-z0-9-]+-expedition\/index\.html$/.test(f) && f !== 'socotra-expedition/index.html');
const usesSheet = expPages.filter((f) => read(f).includes('/css/expedition.css'));
const inlineExp = expPages.filter((f) => !read(f).includes('/css/expedition.css'));
if (usesSheet.length && inlineExp.length) {
  note(warns, `two expedition templates: ${usesSheet.length} link expedition.css, ${inlineExp.length} still inline a full stylesheet`);
}

// 6. Image filename country vs page country (Kyoto-on-Mongolia class)
const unsplash = [];
for (const file of htmlFiles) {
  const hits = [...read(file).matchAll(/\/images\/expeditions\/(unsplash-[0-9]+)\.(?:jpg|webp)/g)].map((m) => m[1]);
  if (hits.length) unsplash.push(`${file} (${new Set(hits).size} unsplash-* files)`);
}
if (unsplash.length) {
  note(warns, `${unsplash.length} pages still reference unsplash-* filenames (no country in the name): e.g. ${unsplash[0]}`);
}

// 7. TouristTrip required on live expedition pages
for (const id of advertised) {
  const page = id === 'socotra' ? 'socotra/index.html' : `${id}-expedition/index.html`;
  if (!exists(page)) {
    note(errors, `advertised trip "${id}" has no ${page}`);
    continue;
  }
  if (id === 'socotra') continue;
  const html = read(page);
  if (page === 'socotra-expedition/index.html') continue;
  if (!html.includes('TouristTrip')) note(errors, `${page} missing TouristTrip JSON-LD`);
}

// 8. Lang file must exist and use one stem
const langAlias = {
  'central-asia': 'centralasia',
  'tunisia-algeria': 'maghreb',
  'maya-corridor': 'maya',
};
for (const id of advertised) {
  const stem = langAlias[id] || id;
  if (!exists(`lang/${stem}.js`)) note(errors, `no lang/${stem}.js for trip "${id}"`);
}
if (Object.keys(langAlias).length) {
  note(warns, `lang stems do not match slugs: ${JSON.stringify(langAlias)} — agents invent a second name`);
}

// 9. Catalog example must stay valid against the schema and real files
const example = JSON.parse(read('data/expeditions.example.json'));
const schema = JSON.parse(read('data/expeditions.schema.json'));
const required = schema.$defs.expedition.required;
for (const exp of example.expeditions) {
  for (const key of required) {
    if (exp[key] === undefined) note(errors, `example ${exp.id} missing ${key}`);
  }
  if (exp.heroImage && !exists(exp.heroImage.slice(1))) {
    note(errors, `example ${exp.id} heroImage does not exist: ${exp.heroImage}`);
  }
  if (exp.langFile && !exists(exp.langFile)) {
    note(errors, `example ${exp.id} langFile does not exist: ${exp.langFile}`);
  }
  if (exp.imageCountry && !exp.countries.includes(exp.imageCountry)) {
    note(errors, `example ${exp.id} imageCountry ${exp.imageCountry} not in countries`);
  }
}

console.log(`lint-site: ${htmlFiles.length} html, ${advertised.length} advertised trips, ${destList.length} CTA dests`);
for (const w of warns) console.log('WARN  ' + w);
for (const e of errors) console.log('ERROR ' + e);
console.log(`${errors.length} error(s), ${warns.length} warning(s)`);
if (errors.length) process.exit(1);
