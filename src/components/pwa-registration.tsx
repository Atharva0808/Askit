"use client";

import { useEffect } from "react";

export function PWARegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Kill ALL service workers — they are not needed and were causing chat failures
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => reg.unregister());
    });

    // Also register the self-destructing sw.js so any browser that
    // still has an old SW cached will fetch this new one and self-destruct
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => { /* ignore */ });
  }, []);

  return null;
}
