import React from 'react';
import { X, FileText, Package, Copy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClipboard } from '@/context/ClipboardContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ClipboardIndicator = () => {
  const { copiedMateria, copiedBlock, clearClipboard, hasCopiedMateria, hasCopiedBlock } = useClipboard();

  // Don't render if nothing is copied
  if (!hasCopiedMateria() && !hasCopiedBlock()) {
    return null;
  }

  const renderMateriaIndicator = () => {
    if (!copiedMateria) return null;

    return (
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <FileText className="h-4 w-4 text-blue-600" />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Matéria
            </Badge>
            <span className="text-sm font-medium text-blue-800 truncate">
              {copiedMateria.retranca}
            </span>
          </div>
          <span className="text-xs text-blue-600">
            Pressione Ctrl+V para colar
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearClipboard}
                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Limpar clipboard
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  const renderBlockIndicator = () => {
    if (!copiedBlock) return null;

    const totalDuracao = copiedBlock.materias.reduce((sum, m) => sum + (m.duracao || 0), 0);
    const minutos = Math.floor(totalDuracao / 60);
    const segundos = totalDuracao % 60;

    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        <Package className="h-4 w-4 text-green-600" />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              Bloco
            </Badge>
            <span className="text-sm font-medium text-green-800 truncate">
              {copiedBlock.nome}
            </span>
          </div>
          <span className="text-xs text-green-600">
            {copiedBlock.materias.length} matérias • {minutos}:{segundos.toString().padStart(2, '0')} • Ctrl+V para colar
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearClipboard}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Limpar clipboard
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {copiedMateria && renderMateriaIndicator()}
      {copiedBlock && renderBlockIndicator()}
    </div>
  );
};

// Mini indicator for inline use
export const ClipboardMiniIndicator = () => {
  const { hasCopiedMateria, hasCopiedBlock } = useClipboard();

  if (!hasCopiedMateria() && !hasCopiedBlock()) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Copy className="h-3 w-3" />
            {hasCopiedBlock() ? 'Bloco' : 'Matéria'} copiada
          </div>
        </TooltipTrigger>
        <TooltipContent>
          Pressione Ctrl+V para colar
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};