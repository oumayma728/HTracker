"use client";

/**
 * Turn push notifications on/off for THIS device, and send a test.
 * Reminders then arrive at each habit's own reminder time.
 */
import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription, sendTestNotification } from "@/lib/push-actions";

type Status = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

/** VAPID public keys are base64url; the browser wants raw bytes. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export function NotificationSettings() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "notice"; text: string } | null>(null);

  // Work out what this device supports and whether it's already subscribed.
  useEffect(() => {
    async function check() {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const installed = window.matchMedia("(display-mode: standalone)").matches;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        // On iPhone, push only exists once the app is added to the Home Screen.
        setStatus(isIOS && !installed ? "ios-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? "on" : "off");
    }
    check().catch(() => setStatus("unsupported"));
  }, []);

  async function turnOn() {
    setBusy(true);
    setMessage(null);
    try {
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("missing VAPID key");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await savePushSubscription(subscription.toJSON(), timeZone);
      if (result.error) {
        await subscription.unsubscribe();
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setStatus("on");
      setMessage({ kind: "notice", text: "Notifications are on for this device." });
    } catch (error) {
      console.error("[notifications] turn on failed:", error);
      const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      setMessage({ kind: "error", text: `Couldn't turn notifications on (${reason}).` });
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("off");
    } catch {
      setMessage({ kind: "error", text: "Couldn't turn notifications off. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMessage(null);
    const result = await sendTestNotification();
    setMessage(result.error ? { kind: "error", text: result.error } : { kind: "notice", text: "Test sent. It should appear in a few seconds." });
    setBusy(false);
  }

  return (
    <section className="card card-pad stack">
      <h2 className="section-title">Notifications</h2>
      <p className="muted small">Get a reminder at each habit&apos;s reminder time, unless you&apos;ve already checked it off.</p>

      {status === "loading" && <p className="muted small">Checking this device…</p>}
      {status === "unsupported" && <p className="muted small">This browser doesn&apos;t support notifications.</p>}
      {status === "ios-install" && (
        <p className="muted small">
          On iPhone, first add the app to your Home Screen: tap the Share button, then &quot;Add to Home Screen&quot;. Open it from there
          and come back to this page.
        </p>
      )}
      {status === "denied" && (
        <p className="muted small">Notifications are blocked for this site. Allow them in your browser or phone settings, then reload.</p>
      )}

      {status === "off" && (
        <button type="button" className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={turnOn} disabled={busy}>
          {busy ? "Turning on…" : "Turn on notifications"}
        </button>
      )}
      {status === "on" && (
        <div className="btn-row" style={{ maxWidth: 420 }}>
          <button type="button" className="btn btn-outline" onClick={test} disabled={busy}>
            Send a test
          </button>
          <button type="button" className="btn btn-outline" onClick={turnOff} disabled={busy}>
            Turn off on this device
          </button>
        </div>
      )}

      {message && <p className={message.kind === "error" ? "form-error" : "form-notice"}>{message.text}</p>}
    </section>
  );
}
