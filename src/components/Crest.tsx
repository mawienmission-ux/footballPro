import { initials } from "@/lib/data";

export function Crest({ src, label, size = "md" }: { src?: string | null | undefined; label: string; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-6 w-6 text-[0.55rem]" : size === "lg" ? "h-10 w-10 text-xs" : "h-8 w-8 text-[0.6rem]";
  if (src) return <img src={src} alt={`${label} crest`} className={`${dim} shrink-0 object-contain`} loading="lazy" decoding="async" />;
  return <span aria-label={`${label} crest`} className={`${dim} grid shrink-0 place-items-center rounded-full bg-accent font-bold text-primary`}>{(label.length <= 4 ? label : initials(label).slice(0, 3)) || "?"}</span>;
}
