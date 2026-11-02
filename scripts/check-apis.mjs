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
