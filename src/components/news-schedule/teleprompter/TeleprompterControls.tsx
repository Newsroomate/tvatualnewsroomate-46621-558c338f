
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause } from "lucide-react";

interface TeleprompterControlsProps {
  isPlaying: boolean;
  speed: number[];
  onPlayPause: () => void;
  onSpeedChange: (value: number[]) => void;
  onReset: () => void;
  isMobile?: boolean;
}

export const TeleprompterControls = ({
  isPlaying,
  speed,
  onPlayPause,
  onSpeedChange,
  onReset,
  isMobile = false
}: TeleprompterControlsProps) => {
  return (
    <>
      <Button
        variant="outline"
        size={isMobile ? "default" : "sm"}
        onClick={onPlayPause}
        className={isMobile ? "h-10 w-16" : ""}
      >
        {isPlaying ? (
          <Pause className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
        ) : (
          <Play className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
        )}
      </Button>
      
      <div className={`flex items-center gap-2 ${isMobile ? 'flex-1' : 'flex-1'}`}>
        <span className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {isMobile ? 'Vel:' : 'Velocidade:'}
        </span>
        <div className={isMobile ? "w-20" : "w-32"}>
          <Slider
            value={speed}
            onValueChange={onSpeedChange}
            min={1}
            max={100}
            step={1}
          />
        </div>
        <span className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {speed[0]}%
        </span>
      </div>

      <Button
        variant="outline"
        size={isMobile ? "default" : "sm"}
        onClick={onReset}
        className={isMobile ? "h-10 px-3" : ""}
      >
        {isMobile ? 'Reset' : 'Reiniciar'}
      </Button>
    </>
  );
};
