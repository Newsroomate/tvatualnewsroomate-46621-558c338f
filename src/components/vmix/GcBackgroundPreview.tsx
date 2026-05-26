import { GcLayout, GcLayoutLine, GcMediaType } from "@/types/gc-pacote-grafico";
import { cn } from "@/lib/utils";

interface GcBackgroundPreviewProps {
  mediaUrl: string | null;
  mediaType: GcMediaType;
  layout: GcLayout;
  linha1?: string;
  linha2?: string;
  className?: string;
  /** referência: largura do canvas usada para escalar fontSize (default 1280) */
  referenceWidth?: number;
}

const lineStyle = (line: GcLayoutLine, containerWidth: number, refWidth: number): React.CSSProperties => {
  const scale = containerWidth / refWidth;
  const translate =
    line.align === 'center' ? 'translate(-50%, -50%)' :
    line.align === 'right' ? 'translate(-100%, -50%)' :
    'translate(0, -50%)';
  return {
    position: 'absolute',
    left: `${line.x}%`,
    top: `${line.y}%`,
    transform: translate,
    color: line.color,
    fontWeight: line.bold ? 700 : 400,
    fontSize: `${line.fontSize * scale}px`,
    fontFamily: line.fontFamily || 'Inter',
    textAlign: line.align,
    whiteSpace: 'nowrap',
    textShadow: '0 2px 6px rgba(0,0,0,0.55)',
    pointerEvents: 'none',
    maxWidth: '95%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
};

export const GcBackgroundPreview = ({
  mediaUrl,
  mediaType,
  layout,
  linha1 = 'NOME EXEMPLO',
  linha2 = 'Texto exemplo',
  className,
  referenceWidth = 1280,
}: GcBackgroundPreviewProps) => {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-md bg-slate-900 border border-border",
        className
      )}
      style={{ aspectRatio: '16 / 9' }}
      ref={(el) => {
        // nothing — using CSS aspect-ratio handles sizing; scaling uses container width via ResizeObserver below if needed
      }}
    >
      {mediaType === 'video' && mediaUrl && (
        <video
          src={mediaUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {mediaType === 'image' && mediaUrl && (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" />
      )}
      {!mediaUrl && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Sem template
        </div>
      )}

      <ScaledOverlay layout={layout} linha1={linha1} linha2={linha2} referenceWidth={referenceWidth} />
    </div>
  );
};

// Renders the lines, measuring container width to scale fontSize relative to referenceWidth.
const ScaledOverlay = ({
  layout, linha1, linha2, referenceWidth,
}: { layout: GcLayout; linha1: string; linha2: string; referenceWidth: number }) => {
  // Using CSS container queries fallback: assume container width via ResizeObserver
  return (
    <div className="absolute inset-0">
      <ResponsiveLines layout={layout} linha1={linha1} linha2={linha2} referenceWidth={referenceWidth} />
    </div>
  );
};

import { useEffect, useRef, useState } from "react";

const ResponsiveLines = ({
  layout, linha1, linha2, referenceWidth,
}: { layout: GcLayout; linha1: string; linha2: string; referenceWidth: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(referenceWidth);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setWidth(w);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0">
      {linha1 && <div style={lineStyle(layout.linha1, width, referenceWidth)}>{linha1}</div>}
      {linha2 && <div style={lineStyle(layout.linha2, width, referenceWidth)}>{linha2}</div>}
    </div>
  );
};
