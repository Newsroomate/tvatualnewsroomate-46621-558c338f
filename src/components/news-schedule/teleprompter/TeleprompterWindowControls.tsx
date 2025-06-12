
import { TeleprompterControls } from "./TeleprompterControls";
import { TeleprompterViewControls } from "./TeleprompterViewControls";
import { TeleprompterColorControls } from "./TeleprompterColorControls";
import { TeleprompterExport } from "./TeleprompterExport";
import { Materia, Telejornal, Bloco } from "@/types";

interface TeleprompterWindowControlsProps {
  isFullscreen: boolean;
  isPlaying: boolean;
  speed: number[];
  fontSize: number;
  blocks: (Bloco & { items: Materia[] })[];
  telejornal: Telejornal | null;
  cabecaColor: string;
  retrancaColor: string;
  onPlayPause: () => void;
  onSpeedChange: (value: number[]) => void;
  onReset: () => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onFontSizeChange: (newSize: number) => void;
  onCabecaColorChange: (color: string) => void;
  onRetrancaColorChange: (color: string) => void;
  onClose: () => void;
}

export const TeleprompterWindowControls = ({
  isFullscreen,
  isPlaying,
  speed,
  fontSize,
  blocks,
  telejornal,
  cabecaColor,
  retrancaColor,
  onPlayPause,
  onSpeedChange,
  onReset,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onFontSizeChange,
  onCabecaColorChange,
  onRetrancaColorChange,
  onClose
}: TeleprompterWindowControlsProps) => {
  if (isFullscreen) return null;

  return (
    <div className="flex items-center gap-4 p-4 border-b bg-gray-50 flex-wrap">
      <TeleprompterControls
        isPlaying={isPlaying}
        speed={speed}
        onPlayPause={onPlayPause}
        onSpeedChange={onSpeedChange}
        onReset={onReset}
      />

      <TeleprompterViewControls
        fontSize={fontSize}
        onIncreaseFontSize={onIncreaseFontSize}
        onDecreaseFontSize={onDecreaseFontSize}
        onFontSizeChange={onFontSizeChange}
      />

      <TeleprompterColorControls
        cabecaColor={cabecaColor}
        retrancaColor={retrancaColor}
        onCabecaColorChange={onCabecaColorChange}
        onRetrancaColorChange={onRetrancaColorChange}
      />

      <TeleprompterExport
        blocks={blocks}
        telejornal={telejornal}
      />

      <button
        onClick={onClose}
        className="ml-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Fechar
      </button>
    </div>
  );
};
