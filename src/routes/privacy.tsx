import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — M.MissionFootball" },
      { name: "description", content: "Read how M.MissionFootball handles privacy, cookies, analytics and your personal information." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link to="/" className="text-sm font-semibold text-primary">← Back to home</Link>
      <article className="mt-6 rounded-2xl border bg-card p-6 md:p-8">
        <p className="eyebrow">Privacy Policy</p>
        <h1 className="mt-2 text-4xl font-extrabold">Privacy Policy</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
          <p>We respect your privacy and are committed to protecting the personal information you share with us.</p>
          <p>We may collect information such as browser data, usage analytics, cookies, and account details needed to manage your access to administrative tools.</p>
          <p>We use this data to improve the platform, provide services, and monitor site performance. We do not sell personal data to third parties.</p>
          <p>Cookies may be used for essential functionality and optional analytics. You can control cookie preferences from the consent banner.</p>
          <p>We store data securely and apply access controls for administrative features. If you have questions about your data, contact the platform owner.</p>
          <p>This policy may be updated from time to time. Continued use of the platform means you accept the current version.</p>
        </div>
      </article>
    </main>
  );
}
