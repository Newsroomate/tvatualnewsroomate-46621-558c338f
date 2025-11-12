
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
  tipoMaterialColor: string;
  onPlayPause: () => void;
  onSpeedChange: (value: number[]) => void;
  onReset: () => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onFontSizeChange: (newSize: number) => void;
  onCabecaColorChange: (color: string) => void;
  onRetrancaColorChange: (color: string) => void;
  onTipoMaterialColorChange: (color: string) => void;
  onClose: () => void;
  isMobile?: boolean;
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
  tipoMaterialColor,
  onPlayPause,
  onSpeedChange,
  onReset,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onFontSizeChange,
  onCabecaColorChange,
  onRetrancaColorChange,
  onTipoMaterialColorChange,
  onClose,
  isMobile = false
}: TeleprompterWindowControlsProps) => {
  if (isFullscreen) return null;

  return (
    <div className={`flex items-center gap-2 p-2 border-b bg-gray-50 ${
      isMobile ? 'flex-col space-y-2' : 'flex-wrap gap-4 p-4'
    }`}>
      <div className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center' : ''}`}>
        <TeleprompterControls
          isPlaying={isPlaying}
          speed={speed}
          onPlayPause={onPlayPause}
          onSpeedChange={onSpeedChange}
          onReset={onReset}
          isMobile={isMobile}
        />
      </div>

      <div className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center' : ''}`}>
        <TeleprompterViewControls
          fontSize={fontSize}
          onIncreaseFontSize={onIncreaseFontSize}
          onDecreaseFontSize={onDecreaseFontSize}
          onFontSizeChange={onFontSizeChange}
          isMobile={isMobile}
        />
      </div>

      {!isMobile && (
        <>
          <TeleprompterColorControls
            cabecaColor={cabecaColor}
            retrancaColor={retrancaColor}
            tipoMaterialColor={tipoMaterialColor}
            onCabecaColorChange={onCabecaColorChange}
            onRetrancaColorChange={onRetrancaColorChange}
            onTipoMaterialColorChange={onTipoMaterialColorChange}
          />

          <TeleprompterExport
            blocks={blocks}
            telejornal={telejornal}
          />
        </>
      )}

      <button
        onClick={onClose}
        className={`${
          isMobile ? 'w-full' : 'ml-auto'
        } px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700`}
      >
        Fechar
      </button>
    </div>
  );
};
