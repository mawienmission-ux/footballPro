import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { newsQuery, timeAgo } from "@/lib/data";

export function NewsFeed() {
  const news = useQuery(newsQuery).data ?? [];
  const cats = ["Latest", ...Array.from(new Set(news.map((n) => n.category)))];
  const [tab, setTab] = useState("Latest");
  const list = tab === "Latest" ? news : news.filter((n) => n.category === tab);
  const [top, ...rest] = list;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex gap-6 overflow-x-auto text-base font-semibold whitespace-nowrap">
        {cats.map((c) => <button key={c} onClick={() => setTab(c)} className={c === tab ? "text-foreground" : "text-muted-foreground"}>{c}</button>)}
      </div>
      <p className="mt-6 flex items-center gap-2 text-2xl font-bold normal-case"><Activity className="h-6 w-6 rounded-full bg-primary p-1 text-primary-foreground" /> Trending</p>
      {!top && <p className="mt-6 text-muted-foreground">No stories yet.</p>}
      {top && (
        <article className="mt-4">
          <Thumb src={top.image_url} alt={top.title || "Football news image"} className="aspect-[16/9] w-full" />
          <h3 className="mt-3 text-xl leading-snug font-semibold normal-case font-sans tracking-normal">{top.title}</h3>
          {top.body && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{top.body}</p>}
          <Meta source={top.source} at={top.published_at} />
        </article>
      )}
      <div className="mt-6 space-y-5">
        {rest.map((n) => (
          <article key={n.id} className="grid grid-cols-[9rem_1fr] gap-4 sm:grid-cols-[11rem_1fr]">
            <Thumb src={n.image_url} alt={n.title || "Football news image"} className="aspect-[3/2] w-full" />
            <div>
              <h3 className="leading-snug font-semibold normal-case font-sans tracking-normal">{n.title}</h3>
              <Meta source={n.source} at={n.published_at} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Thumb({ src, alt, className }: { src: string | null; alt: string; className: string }) {
  return src ? <img src={src} alt={alt} loading="lazy" decoding="async" className={`${className} rounded-xl object-cover`} /> : <div className={`${className} rounded-xl bg-muted`} aria-label={alt} />;
}
function Meta({ source, at }: { source: string; at: string }) {
  return <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-[0.5rem] font-bold text-primary-foreground">M</span>{source} - {timeAgo(at)}</p>;
}
