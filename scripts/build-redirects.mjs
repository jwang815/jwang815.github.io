import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
export function redirectHtml(target){
  const url=new URL(target);
  if(url.origin!=='https://wpjourneys.com'||url.username||url.password)throw Error('Unexpected redirect destination');
  const safe=target.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Waypoint Journeys has moved</title><link rel="canonical" href="${safe}"><meta http-equiv="refresh" content="0; url=${safe}"><script>const target = new URL(${JSON.stringify(target)}); target.search = location.search; target.hash = location.hash || target.hash; location.replace(target.href);</script></head><body><h1>Waypoint Journeys has moved</h1><p>This page is now at <a href="${safe}">${safe}</a>.</p></body></html>\n`;
}
export function build(dir=root){
  const routes=JSON.parse(fs.readFileSync(path.join(dir,'scripts/redirect-routes.json'),'utf8'));
  const out=path.join(dir,'_site');
  // Only generated output is removed; historical source remains untouched.
  fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
  for(const [file,target] of Object.entries(routes)){
    if(!/^(?:[a-z0-9-]+\/)*index\.html$/.test(file))throw Error('Invalid page path: '+file);
    if(!fs.existsSync(path.join(dir,file)))throw Error('Unknown old page: '+file);
    const dest=path.join(out,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,redirectHtml(target));
  }
  fs.writeFileSync(path.join(out,'404.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page not found | Waypoint Journeys</title></head><body><h1>This old page could not be found</h1><p>Waypoint Journeys is now at <a href="https://wpjourneys.com/">wpjourneys.com</a>. Browse its destinations or <a href="https://wpjourneys.com/inquire/">ask us about your trip</a>.</p></body></html>\n');
  fs.writeFileSync(path.join(out,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: https://wpjourneys.com/sitemap.xml\n');
  fs.writeFileSync(path.join(out,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+[...new Set(Object.values(routes))].filter(u=>!u.includes('/dashboard/')).map(u=>'  <url><loc>'+u.replace(/&/g,'&amp;')+'</loc></url>').join('\n')+'\n</urlset>\n');
  fs.writeFileSync(path.join(out,'.nojekyll'),'');
  return routes;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)console.log('Built '+Object.keys(build()).length+' URL-specific HTML redirects; original source is unchanged.');
