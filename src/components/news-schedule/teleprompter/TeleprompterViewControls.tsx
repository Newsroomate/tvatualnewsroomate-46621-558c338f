
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus } from "lucide-react";

interface TeleprompterViewControlsProps {
  fontSize: number;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onFontSizeChange: (size: number) => void;
  isMobile?: boolean;
}

export const TeleprompterViewControls = ({
  fontSize,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onFontSizeChange,
  isMobile = false
}: TeleprompterViewControlsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(fontSize.toString());

  const handleClick = () => {
    setIsEditing(true);
    setInputValue(fontSize.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const newSize = parseInt(inputValue);
    if (!isNaN(newSize) && newSize >= 12 && newSize <= 200) {
      onFontSizeChange(newSize);
    } else {
      // Reset to current fontSize if invalid
      setInputValue(fontSize.toString());
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setInputValue(fontSize.toString());
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
        Fonte:
      </span>
      <Button
        variant="outline"
        size={isMobile ? "default" : "sm"}
        onClick={onDecreaseFontSize}
        disabled={fontSize <= 12}
        className={isMobile ? "h-10 w-10 p-0" : ""}
      >
        <Minus className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
      </Button>
      
      {isEditing ? (
        <Input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className={`text-center ${
            isMobile ? 'w-12 h-10 text-xs' : 'w-16 h-8 text-sm'
          }`}
          min="12"
          max="200"
          autoFocus
        />
      ) : (
        <button
          onClick={handleClick}
          className={`text-gray-600 text-center hover:bg-gray-100 px-2 py-1 rounded border border-transparent hover:border-gray-300 transition-colors ${
            isMobile ? 'text-xs min-w-[40px]' : 'text-sm min-w-[50px]'
          }`}
        >
          {fontSize}px
        </button>
      )}
      
      <Button
        variant="outline"
        size={isMobile ? "default" : "sm"}
        onClick={onIncreaseFontSize}
        disabled={fontSize >= 200}
        className={isMobile ? "h-10 w-10 p-0" : ""}
      >
        <Plus className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
      </Button>
    </div>
  );
};
