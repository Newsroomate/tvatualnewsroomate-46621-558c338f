
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

interface TeleprompterViewControlsProps {
  fontSize: number;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
}

export const TeleprompterViewControls = ({
  fontSize,
  onIncreaseFontSize,
  onDecreaseFontSize
}: TeleprompterViewControlsProps) => {
  return (
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
      <span className="text-sm text-gray-600 min-w-[50px] text-center">{fontSize}px</span>
      <Button
        variant="outline"
        size="sm"
        onClick={onIncreaseFontSize}
        disabled={fontSize >= 100}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};
