"use client";

import { useEffect, useMemo, useState } from "react";

type Protocol = {
  title: string;
  number: string;
  category: string;
  category_code?: string;
  start_page: number;
  end_page: number;
  excerpt: string;
};

type IndexData = {
  source_pdf: string;
  num_pages: number;
  protocols: Protocol[];
};

const STOPWORDS = new Set(["a","an","and","are","as","at","be","but","by","for","from","has","have","if","in","into","is","it","its","of","on","or","that","the","their","them","there","they","this","to","was","were","will","with","your"]);

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9']{2,}/g) || []).filter(t => !STOPWORDS.has(t));
}

function scoreDoc(queryTerms: string[], doc: Protocol) {
  const titleTokens = tokenize(doc.title);
  const excerptTokens = tokenize(doc.excerpt);
  let score = 0;
  for (const t of queryTerms) {
    score += excerptTokens.filter(x => x === t).length;
    score += 3 * titleTokens.filter(x => x === t).length; // title weight
  }
  return score;
}

const categories = ["General","Medical","Cardiac","Trauma","Pediatric","Procedures"] as const;

export default function Page() {
  const [data, setData] = useState<IndexData | null>(null);
  const [q, setQ] = useState("");
  const [activeCats, setActiveCats] = useState<string[]>([]);

  useEffect(() => {
    fetch("/act_protocol_index.json")
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const protocols = data?.protocols || [];

  const visible = useMemo(() => {
    const terms = tokenize(q);
    let rows = protocols;
    if (activeCats.length > 0) {
      rows = rows.filter(r => activeCats.includes(r.category));
    }
    if (terms.length === 0) {
      return rows.slice().sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.start_page - b.start_page;
      }).slice(0, 50);
    }
    const scored: { s: number; r: Protocol }[] = [];
    for (const r of rows) {
      const s = scoreDoc(terms, r);
      if (s > 0) scored.append?.({ s, r }) || scored.push({ s, r });
    }
    scored.sort((a,b) => b.s - a.s || a.r.start_page - b.r.start_page);
    return scored.slice(0, 50).map(x => x.r);
  }, [q, protocols, activeCats]);

  function toggleCat(cat: string) {
    setActiveCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">ACT Protocols</h1>
          <p className="text-sm text-slate-300/70 mt-1">Search titles and excerpts. Filter by category. Deployed on Vercel.</p>
        </header>

        <section className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search terms (e.g. 'sepsis', 'RSI', 'SVT', 'anaphylaxis')"
            className="w-full rounded-xl py-3 px-4 outline-none ring-2 ring-slate-700 focus:ring-slate-500 bg-white text-black"
          />
          <div className="flex flex-wrap gap-2 md:justify-end">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => toggleCat(c)}
                className={"px-3 py-2 rounded-full border " + (activeCats.includes(c) ? "bg-emerald-400 text-black border-emerald-400" : "border-slate-600 text-slate-200")}
                title={"Filter: " + c}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          {visible.map((p, i) => (
            <article key={i} className="rounded-2xl bg-[var(--card)] border border-slate-800 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-400">{p.category} • pages {p.start_page}-{p.end_page}</div>
                  <h3 className="text-lg md:text-xl font-semibold mt-0.5">{p.title}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">{p.number}</div>
                </div>
                <div className="shrink-0">
                  <a
                    className="link text-sm"
                    href={`/protocols.pdf#page=${p.start_page}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open PDF at this section"
                  >
                    Open PDF ↗
                  </a>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-200/90 line-clamp-3">{p.excerpt}</p>
            </article>
          ))}
          {visible.length === 0 && (
            <div className="text-slate-300">No matches.</div>
          )}
        </section>

        <footer className="mt-10 text-xs text-slate-400">
          Source PDF: {data?.source_pdf ?? "—"} • Total pages: {data?.num_pages ?? "—"}
        </footer>
      </div>
    </main>
  );
}
