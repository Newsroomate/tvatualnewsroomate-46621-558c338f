import { useEffect, useState } from "react";

const CHANNEL_NAME = "producao-panel-status";
const HEARTBEAT_KEY = "producao_panel_heartbeat";
const HEARTBEAT_INTERVAL = 2000;
const STALE_THRESHOLD = 5000;

/**
 * Heartbeat hook to be used INSIDE the production panel window.
 * Broadcasts presence so other windows know it's open.
 */
export const useProducaoPanelHeartbeat = () => {
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      bc = null;
    }

    const tick = () => {
      const now = Date.now();
      try {
        localStorage.setItem(HEARTBEAT_KEY, String(now));
      } catch {}
      bc?.postMessage({ type: "heartbeat", ts: now });
    };

    tick();
    const interval = setInterval(tick, HEARTBEAT_INTERVAL);

    const onUnload = () => {
      try {
        localStorage.removeItem(HEARTBEAT_KEY);
      } catch {}
      bc?.postMessage({ type: "closed" });
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", onUnload);
      onUnload();
      bc?.close();
    };
  }, []);
};

/**
 * Consumer hook used in the main app to detect whether the panel is open.
 */
export const useProducaoPanelStatus = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      bc = null;
    }

    const check = () => {
      try {
        const raw = localStorage.getItem(HEARTBEAT_KEY);
        if (!raw) {
          setIsOpen(false);
          return;
        }
        const ts = parseInt(raw, 10);
        setIsOpen(!isNaN(ts) && Date.now() - ts < STALE_THRESHOLD);
      } catch {
        setIsOpen(false);
      }
    };

    check();
    const interval = setInterval(check, HEARTBEAT_INTERVAL);

    if (bc) {
      bc.onmessage = (event) => {
        if (event.data?.type === "heartbeat") setIsOpen(true);
        else if (event.data?.type === "closed") setIsOpen(false);
      };
    }

    return () => {
      clearInterval(interval);
      bc?.close();
    };
  }, []);

  return isOpen;
};
