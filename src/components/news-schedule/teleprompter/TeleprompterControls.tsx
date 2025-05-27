
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause } from "lucide-react";

interface TeleprompterControlsProps {
  isPlaying: boolean;
  speed: number[];
  onPlayPause: () => void;
  onSpeedChange: (value: number[]) => void;
  onReset: () => void;
}

export const TeleprompterControls = ({
  isPlaying,
  speed,
  onPlayPause,
  onSpeedChange,
  onReset
}: TeleprompterControlsProps) => {
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={onPlayPause}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      
      <div className="flex items-center gap-2 flex-1">
        <span className="text-sm text-gray-600">Velocidade:</span>
        <div className="w-32">
          <Slider
            value={speed}
            onValueChange={onSpeedChange}
            min={1}
            max={100}
            step={1}
          />
        </div>
        <span className="text-sm text-gray-600">{speed[0]}%</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
      >
        Reiniciar
      </Button>
    </>
  );
};
