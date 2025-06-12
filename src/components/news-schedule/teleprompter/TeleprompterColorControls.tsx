
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
    { name: "Branco", value: "#ffffff" },
    { name: "Amarelo", value: "#facc15" },
    { name: "Azul", value: "#3b82f6" },
    { name: "Verde", value: "#22c55e" },
    { name: "Vermelho", value: "#ef4444" },
    { name: "Laranja", value: "#f97316" },
    { name: "Rosa", value: "#ec4899" },
    { name: "Roxo", value: "#8b5cf6" }
  ];

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm text-gray-600">Cabeça:</Label>
        <select
          value={cabecaColor}
          onChange={(e) => onCabecaColorChange(e.target.value)}
          className="px-2 py-1 border rounded text-sm"
          style={{ backgroundColor: cabecaColor, color: cabecaColor === "#ffffff" ? "#000" : "#fff" }}
        >
          {colorOptions.map((color) => (
            <option key={color.value} value={color.value}>
              {color.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm text-gray-600">Retranca:</Label>
        <select
          value={retrancaColor}
          onChange={(e) => onRetrancaColorChange(e.target.value)}
          className="px-2 py-1 border rounded text-sm"
          style={{ backgroundColor: retrancaColor, color: retrancaColor === "#ffffff" ? "#000" : "#fff" }}
        >
          {colorOptions.map((color) => (
            <option key={color.value} value={color.value}>
              {color.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
