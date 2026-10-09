import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {build,redirectHtml} from '../scripts/build-redirects.mjs';
const routes=build();
fs.writeFileSync('_site/stale-file.html','stale generated page');build();assert(!fs.existsSync('_site/stale-file.html'),'Rebuilding cannot retain stale generated output');assert(fs.existsSync('socotra/index.html'),'Historical source is preserved');
for(const [file,target] of Object.entries(routes)){
  const html=fs.readFileSync('_site/'+file,'utf8');
  assert(html.includes(`<link rel="canonical" href="${target}">`));
  assert(html.includes(`<meta http-equiv="refresh" content="0; url=${target}">`));
  let seen;
  vm.runInNewContext(html.match(/<script>(.*?)<\/script>/s)[1],{URL,location:{search:'?utm_source=legacy&x=1',hash:'#itinerary',replace:u=>seen=u}});
  const expected=new URL(target);expected.search='?utm_source=legacy&x=1';expected.hash='#itinerary';assert.equal(seen,expected.href);
  assert(!html.includes('7-day expedition'),'No archived itinerary copy remains in deployed redirect');
}
for(const file of ['index.html','socotra/index.html','about/index.html','blog/what-is-waypoint-journeys/index.html'])assert(routes[file]);
assert.equal(routes['socotra/index.html'],'https://wpjourneys.com/socotra/');assert.equal(routes['socotra-expedition/index.html'],routes['socotra/index.html']);
assert.equal(routes['contact/index.html'],'https://wpjourneys.com/inquire/');
assert.throws(()=>redirectHtml('https://evil.invalid/'));
assert(!fs.readFileSync('_site/404.html','utf8').includes('http-equiv="refresh"'),'Unmapped URLs are not redirected to the homepage');
const originals=[];function walk(d=''){for(const e of fs.readdirSync(d||'.',{withFileTypes:true})){if(['.git','_site','scripts','test'].includes(e.name))continue;const p=d?d+'/'+e.name:e.name;if(e.isDirectory())walk(p);else if(e.name.endsWith('.html')&&p!=='404.html')originals.push(p);}}walk();assert.deepEqual(originals.sort(),Object.keys(routes).sort(),'Every historical HTML page has an explicit mapping');
console.log('PASS '+Object.keys(routes).length+' mapped pages, query/hash preservation, aliases, safe targets and useful unmapped 404');
