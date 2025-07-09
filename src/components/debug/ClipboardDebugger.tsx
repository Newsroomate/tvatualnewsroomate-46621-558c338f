
import { useClipboard } from "@/hooks/useClipboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Info } from "lucide-react";

export const ClipboardDebugger = () => {
  const { getClipboardInfo, clearClipboard, copiedMateria, copiedBlock } = useClipboard();
  
  const clipboardInfo = getClipboardInfo();
  
  if (!clipboardInfo && !copiedMateria && !copiedBlock) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Clipboard Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhum item copiado</p>
        </CardContent>
      </Card>
    );
  }

  const formatAge = (age: number) => {
    const seconds = Math.floor(age / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s atrás`;
    }
    return `${seconds}s atrás`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Clipboard Status
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearClipboard}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {clipboardInfo && (
          <>
            <div className="flex items-center gap-2">
              <Badge variant={clipboardInfo.type === 'block' ? 'default' : 'secondary'}>
                {clipboardInfo.type === 'block' ? 'Bloco' : 'Matéria'}
              </Badge>
              <span className="text-sm font-medium">{clipboardInfo.data}</span>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Copiado {formatAge(clipboardInfo.age)}
            </div>
            
            <div className="text-xs text-muted-foreground">
              Timestamp: {new Date(clipboardInfo.timestamp).toLocaleTimeString()}
            </div>
          </>
        )}
        
        {/* Legacy compatibility info */}
        {(copiedMateria || copiedBlock) && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            <div>Legacy State:</div>
            {copiedMateria && <div>• Matéria: {copiedMateria.retranca}</div>}
            {copiedBlock && <div>• Bloco: {copiedBlock.nome}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
