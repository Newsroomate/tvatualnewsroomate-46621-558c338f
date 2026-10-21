import { useEffect, useRef, useState } from "react";
import { Clock, Timer, Hourglass, Play, Pause, RotateCcw, X } from "lucide-react";

type Mode = "clock" | "stopwatch" | "countdown";

const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
const fmt = (ms: number) => {
  const neg = ms < 0;
  const s = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(s / 3600);
  const body = h > 0 ? `${pad(h)}:${pad((s % 3600) / 60)}:${pad(s % 60)}` : `${pad(s / 60)}:${pad(s % 60)}`;
  return (neg ? "-" : "") + body;
};

interface Props {
  isMirrored?: boolean;
  onClose?: () => void;
}

export const TeleprompterClock = ({ isMirrored = false, onClose }: Props) => {
  const [mode, setMode] = useState<Mode>("clock");
  const [now, setNow] = useState(Date.now());
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const [cdTotal, setCdTotal] = useState(5 * 60 * 1000);
  const [customMin, setCustomMin] = useState("");

  useEffect(() => {
    const id: ReturnType<typeof setInterval> = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const current = running && startRef.current !== null ? elapsed + (now - startRef.current) : elapsed;

  const toggle = () => {
    if (running) {
      setElapsed(current);
      startRef.current = null;
      setRunning(false);
    } else {
      startRef.current = Date.now();
      setRunning(true);
    }
  };
  const reset = () => {
    setRunning(false);
    startRef.current = null;
    setElapsed(0);
  };
  const switchMode = (m: Mode) => {
    reset();
    setMode(m);
  };
  const setPreset = (min: number) => {
    reset();
    setCdTotal(min * 60 * 1000);
  };

  const remaining = cdTotal - current;
  let display = "";
  let color = "#ffffff";
  if (mode === "clock") {
    display = new Date(now).toLocaleTimeString("pt-BR", { hour12: false, timeZone: "America/Sao_Paulo" });
  } else if (mode === "stopwatch") {
    display = fmt(current);
  } else {
    display = fmt(remaining);
    if (remaining <= 0) color = "#ef4444";
    else if (remaining <= 30000) color = "#ef4444";
    else if (remaining <= 120000) color = "#facc15";
  }

  const label = mode === "clock" ? "HORA CERTA" : mode === "stopwatch" ? "CRONÔMETRO" : "REGRESSIVO";
  const btn = "p-1.5 rounded hover:bg-white/20 transition-colors";
  const active = "bg-white/25";

  return (
    <div
      className="absolute top-3 right-3 z-20 rounded-lg border border-white/20 shadow-xl select-none"
      style={{ background: "rgba(0,0,0,0.78)", color: "#fff", minWidth: 220 }}
    >
      <div className="flex items-center justify-between px-2 pt-1.5">
        <div className="flex gap-1">
          <button title="Hora certa" className={`${btn} ${mode === "clock" ? active : ""}`} onClick={() => switchMode("clock")}>
            <Clock className="h-4 w-4" />
          </button>
          <button title="Cronômetro" className={`${btn} ${mode === "stopwatch" ? active : ""}`} onClick={() => switchMode("stopwatch")}>
            <Timer className="h-4 w-4" />
          </button>
          <button title="Regressivo" className={`${btn} ${mode === "countdown" ? active : ""}`} onClick={() => switchMode("countdown")}>
            <Hourglass className="h-4 w-4" />
          </button>
        </div>
        {onClose && (
          <button title="Ocultar" className={btn} onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div style={{ transform: isMirrored ? "scaleX(-1)" : undefined }} className="px-3 text-center">
        <div className="text-[10px] tracking-widest opacity-70">{label}</div>
        <div className="font-mono font-bold leading-none py-1" style={{ fontSize: 40, color }}>
          {display}
        </div>
      </div>

      {mode !== "clock" && (
        <div className="flex items-center justify-center gap-1 pb-2">
          <button title={running ? "Pausar" : "Iniciar"} className={btn} onClick={toggle}>
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button title="Zerar" className={btn} onClick={reset}>
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      )}

      {mode === "countdown" && (
        <div className="flex flex-wrap items-center justify-center gap-1 px-2 pb-2 text-xs">
          {[1, 3, 5, 10, 15, 30].map((m) => (
            <button
              key={m}
              className={`px-2 py-0.5 rounded border border-white/20 hover:bg-white/20 ${cdTotal === m * 60000 ? active : ""}`}
              onClick={() => setPreset(m)}
            >
              {m}m
            </button>
          ))}
          <input
            type="number"
            min={1}
            placeholder="min"
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = parseFloat(customMin);
                if (v > 0) setPreset(v);
              }
            }}
            className="w-14 px-1 py-0.5 rounded bg-white/10 border border-white/20 text-center"
          />
        </div>
      )}
    </div>
  );
};
