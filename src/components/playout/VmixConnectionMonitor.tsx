import { useEffect, useState } from "react";
import { fetchVmixSettings, testVmixConnection } from "@/services/vmix-api";
import { Telejornal } from "@/types";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

interface VmixConnectionMonitorProps {
  currentTelejornal: Telejornal | null;
  intervalMs?: number;
}

export const VmixConnectionMonitor = ({ currentTelejornal, intervalMs = 30000 }: VmixConnectionMonitorProps) => {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    if (!currentTelejornal) return;
    let mounted = true;
    const ping = async () => {
      try {
        const settings: any = await fetchVmixSettings(currentTelejornal.id);
        if (!settings) { setOnline(null); return; }
        const res = await testVmixConnection(settings.vmix_host, settings.vmix_port);
        if (mounted) setOnline(!!res?.success);
      } catch {
        if (mounted) setOnline(false);
      }
    };
    ping();
    const t = setInterval(ping, intervalMs);
    return () => { mounted = false; clearInterval(t); };
  }, [currentTelejornal, intervalMs]);

  if (online === null) return null;
  return (
    <div className={cn("inline-flex items-center gap-1 text-xs", online ? "text-emerald-600" : "text-rose-600")}>
      {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      vMix {online ? 'online' : 'offline'}
    </div>
  );
};
