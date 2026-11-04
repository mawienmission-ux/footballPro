import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — M.MissionFootball" },
      { name: "description", content: "Read the terms and conditions for using M.MissionFootball services and content." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link to="/" className="text-sm font-semibold text-primary">← Back to home</Link>
      <article className="mt-6 rounded-2xl border bg-card p-6 md:p-8">
        <p className="eyebrow">Terms and Conditions</p>
        <h1 className="mt-2 text-4xl font-extrabold">Terms and Conditions</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
          <p>By using M.MissionFootball, you agree to use the platform lawfully, responsibly and in accordance with applicable rules and regulations.</p>
          <p>The content on this website is provided for informational and editorial purposes. We do not guarantee the accuracy, completeness or timeliness of every match, result or article.</p>
          <p>Users must not interfere with platform operations, attempt unauthorized access, or misuse administrative functionality.</p>
          <p>We may update, remove or amend content and services from time to time to improve performance, reliability or compliance.</p>
          <p>We are not responsible for losses resulting from reliance on match or news data, external third-party integrations, or interruptions in service.</p>
          <p>These terms may change periodically. Continued use of the service after changes are published constitutes acceptance of the updated terms.</p>
        </div>
      </article>
    </main>
  );
}
