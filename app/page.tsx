// inside useMemo(...) where you build `visible` from `protocols`
const scored: { s: number; r: Protocol }[] = [];
for (const r of rows) {
  const s = scoreDoc(terms, r);
  if (s > 0) {
    // ✅ arrays use push(), not append()
    scored.push({ s, r });
  }
}
scored.sort((a, b) => b.s - a.s || a.r.start_page - b.r.start_page);
return scored.slice(0, 50).map((x) => x.r);
