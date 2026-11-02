// Comprueba que las APIs de catálogo responden (se ejecuta en CI).
const src = await import('node:fs').then(f=>f.readFileSync(process.argv[2],'utf8'));
const FIELDS = src.match(/const FIELDS = `([\s\S]*?)`;/)[1];
const PAGE = src.match(/const PAGE = `([\s\S]*?)`;/)[1].replace('${FIELDS}', FIELDS);
const DET = `query ($id: Int) { Media(idMal: $id, type: ANIME) { ${FIELDS} } }`;
for (const [q,v] of [[PAGE,{page:1,sort:['POPULARITY_DESC'],status:'RELEASING'}],[PAGE,{page:1,sort:['SEARCH_MATCH'],search:'naruto'}],[DET,{id:1}]]) {
  const r = await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q,variables:v})});
  const j = await r.json(); console.log(r.status, j.errors?.[0]?.message ?? JSON.stringify(j.data).slice(0,200));
}
for (const u of ['https://api.jikan.moe/v4/seasons/now?sfw=true', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png']) {
  try { const r = await fetch(u, { signal: AbortSignal.timeout(15000) }); console.log(u, r.status); } catch (e) { console.log(u, 'ERROR', e.message); }
}
// Videos de demo
const demo = (await import('node:fs')).readFileSync('src/providers/demo.ts', 'utf8');
for (const [, u] of demo.matchAll(/url: '([^']+)'/g)) {
  try { const r = await fetch(u, { headers: { Range: 'bytes=0-1023' }, signal: AbortSignal.timeout(15000) }); console.log('DEMO', u, r.status); } catch (e) { console.log('DEMO', u, 'ERROR', e.message); }
}
// Enlaces oficiales y episodios
const EXTRA = src.match(/const EXTRA = `([\s\S]*?)`;/)[1];
for (const id of [34572, 52991, 21]) {
  const q = `query ($id: Int) { Media(idMal: $id, type: ANIME) { title { romaji } ${EXTRA} } }`;
  const r = await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, variables: { id } }) });
  const j = await r.json(); const m = j.data?.Media;
  console.log('OFICIAL', id, r.status, j.errors?.[0]?.message ?? `${m.title.romaji}: ${m.externalLinks.filter(l => l.type === 'STREAMING').map(l => l.site).join(', ')} | eps ${m.streamingEpisodes.length} ${JSON.stringify(m.streamingEpisodes[0] ?? {})}`);
}
