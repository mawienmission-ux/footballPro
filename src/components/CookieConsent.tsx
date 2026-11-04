import { useEffect, useState } from "react";

const STORAGE_KEY = "mission-football-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const setConsent = (value: "accepted" | "rejected") => {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur-md md:left-auto md:right-4 md:max-w-md">
      <p className="text-sm font-semibold text-foreground">Cookie consent</p>
      <p className="mt-2 text-sm text-muted-foreground">
        We use cookies to improve your experience and measure analytics. You can accept or reject non-essential cookies.
      </p>
      <div className="mt-4 flex gap-2">
        <button onClick={() => setConsent("accepted")} className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Accept</button>
        <button onClick={() => setConsent("rejected")} className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground">Reject</button>
      </div>
    </div>
  );
}
