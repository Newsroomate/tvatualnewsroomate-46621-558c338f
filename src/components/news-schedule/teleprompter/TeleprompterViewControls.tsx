
import { Button } from "@/components/ui/button";
import { Maximize, Minimize, Plus, Minus } from "lucide-react";

interface TeleprompterViewControlsProps {
  isMaximized: boolean;
  fontSize: number;
  onToggleMaximize: () => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
}

export const TeleprompterViewControls = ({
  isMaximized,
  fontSize,
  onToggleMaximize,
  onIncreaseFontSize,
  onDecreaseFontSize
}: TeleprompterViewControlsProps) => {
  return (
    <>
      {/* Font size controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Fonte:</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onDecreaseFontSize}
          disabled={fontSize <= 12}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-sm text-gray-600 min-w-[40px] text-center">{fontSize}px</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onIncreaseFontSize}
          disabled={fontSize >= 48}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Maximize/Minimize controls */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleMaximize}
      >
        {isMaximized ? (
          <Minimize className="h-4 w-4" />
        ) : (
          <Maximize className="h-4 w-4" />
        )}
      </Button>
    </>
  );
};
