import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InlineEditCellProps {
  value: string;
  onSave: (newValue: string) => void;
  type?: "text" | "select" | "status";
  options?: { value: string; label: string }[];
  disabled?: boolean;
  placeholder?: string;
}

export const InlineEditCell = ({
  value,
  onSave,
  type = "text",
  options = [],
  disabled = false,
  placeholder
}: InlineEditCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    // Ensure status field always has a valid default value
    if (type === "status" && (!value || value === null || value === undefined)) {
      setEditValue("draft");
    } else {
      setEditValue(value || "");
    }
  }, [value, type]);

  const handleSave = () => {
    // Normalize empty values for proper comparison and saving
    const normalizedEditValue = editValue?.trim() === "" ? null : editValue?.trim();
    const normalizedValue = value?.trim() === "" ? null : value?.trim();
    
    if (normalizedEditValue !== normalizedValue) {
      // For status field, ensure we never save empty values - default to 'draft'
      if (type === "status" && !normalizedEditValue) {
        onSave("draft");
      } else {
        onSave(normalizedEditValue || "");
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  // Para o campo status, sempre mostrar como dropdown fixo
  if (type === "status") {
    if (disabled) {
      return <span className="text-gray-500">{options.find(opt => opt.value === value)?.label || "Rascunho"}</span>;
    }
    
    // Ensure status always has a valid value - default to 'draft' if empty/null
    const statusValue = value && value !== "" ? value : "draft";
    
    return (
      <Select 
        value={statusValue} 
        onValueChange={(newValue) => {
          // Ensure we're saving exactly the same format as edit screen
          onSave(newValue);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="h-8 text-xs bg-white border-gray-200">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white z-50 border shadow-md">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="cursor-pointer hover:bg-gray-50">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (disabled) {
    return <span className="text-gray-500">{value || "-"}</span>;
  }

  if (!isEditing) {
    return (
      <div 
        className="group flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
        onClick={() => setIsEditing(true)}
      >
        <span className="flex-1">{value || placeholder || "-"}</span>
        <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {type === "text" ? (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-xs"
          autoFocus
          onBlur={handleSave}
        />
      ) : (
        <Select value={editValue} onValueChange={setEditValue}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={handleSave}
      >
        <Check className="h-3 w-3 text-green-600" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={handleCancel}
      >
        <X className="h-3 w-3 text-red-600" />
      </Button>
    </div>
  );
};