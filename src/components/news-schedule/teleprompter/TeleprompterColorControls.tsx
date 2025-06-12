
import { Label } from "@/components/ui/label";

interface TeleprompterColorControlsProps {
  cabecaColor: string;
  retrancaColor: string;
  onCabecaColorChange: (color: string) => void;
  onRetrancaColorChange: (color: string) => void;
}

export const TeleprompterColorControls = ({
  cabecaColor,
  retrancaColor,
  onCabecaColorChange,
  onRetrancaColorChange
}: TeleprompterColorControlsProps) => {
  const colorOptions = [
    { value: '#FFFFFF', label: 'Branco' },
    { value: '#FFD700', label: 'Amarelo' },
    { value: '#87CEEB', label: 'Azul Claro' },
    { value: '#90EE90', label: 'Verde Claro' },
    { value: '#FFB6C1', label: 'Rosa' },
    { value: '#DDA0DD', label: 'Roxo Claro' },
    { value: '#FFA500', label: 'Laranja' },
    { value: '#98FB98', label: 'Verde Menta' }
  ];

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm whitespace-nowrap">Cor Cabeça:</Label>
        <select
          value={cabecaColor}
          onChange={(e) => onCabecaColorChange(e.target.value)}
          className="px-2 py-1 border rounded text-sm"
          style={{ backgroundColor: cabecaColor, color: cabecaColor === '#FFFFFF' ? '#000' : '#000' }}
        >
          {colorOptions.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              style={{ backgroundColor: option.value, color: '#000' }}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm whitespace-nowrap">Cor Retranca:</Label>
        <select
          value={retrancaColor}
          onChange={(e) => onRetrancaColorChange(e.target.value)}
          className="px-2 py-1 border rounded text-sm"
          style={{ backgroundColor: retrancaColor, color: retrancaColor === '#FFFFFF' ? '#000' : '#000' }}
        >
          {colorOptions.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              style={{ backgroundColor: option.value, color: '#000' }}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
