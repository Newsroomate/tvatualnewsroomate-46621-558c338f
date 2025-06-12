
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus } from "lucide-react";

interface TeleprompterViewControlsProps {
  fontSize: number;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onFontSizeChange: (size: number) => void;
}

export const TeleprompterViewControls = ({
  fontSize,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onFontSizeChange
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
      <span className="text-sm text-gray-600">Fonte:</span>
      <Button
        variant="outline"
        size="sm"
        onClick={onDecreaseFontSize}
        disabled={fontSize <= 12}
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      {isEditing ? (
        <Input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="w-16 h-8 text-center text-sm"
          min="12"
          max="200"
          autoFocus
        />
      ) : (
        <button
          onClick={handleClick}
          className="text-sm text-gray-600 min-w-[50px] text-center hover:bg-gray-100 px-2 py-1 rounded border border-transparent hover:border-gray-300 transition-colors"
        >
          {fontSize}px
        </button>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={onIncreaseFontSize}
        disabled={fontSize >= 200}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};
