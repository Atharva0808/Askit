"use client";

import { useEffect } from "react";

export function PWARegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Force-update: unregister ALL old service workers, then re-register the new one.
    // This ensures any stale SW that intercepts /api/ routes is killed immediately.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      const unregisterPromises = registrations.map((reg) => reg.unregister());
      Promise.all(unregisterPromises).then(() => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            // Force the new SW to activate immediately
            if (reg.waiting) {
              reg.waiting.postMessage({ type: "SKIP_WAITING" });
            }
            reg.addEventListener("updatefound", () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "activated") {
                    console.log("SW updated and activated");
                  }
                });
              }
            });
            console.log("SW Registered (fresh)", reg);
          })
          .catch((err) => console.log("SW Registration failed", err));
      });
    });
  }, []);

  return null;
}
