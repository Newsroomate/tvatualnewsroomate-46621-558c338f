
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit2, Copy, Clock, Archive } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DeepSearchResult } from "@/services/deep-search-api";

interface DeepSearchResultItemProps {
  result: DeepSearchResult;
  query: string;
  onEdit: (result: DeepSearchResult) => void;
  onCopy: (result: DeepSearchResult) => void;
}

export const DeepSearchResultItem = ({ result, query, onEdit, onCopy }: DeepSearchResultItemProps) => {
  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() ? 
        <mark key={index} className="bg-yellow-200">{part}</mark> : part
    );
  };

  const isFromSnapshot = result.source === 'snapshots';

  return (
    <Card className={`border-l-4 ${isFromSnapshot ? 'border-l-orange-500' : 'border-l-blue-500'}`}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm">{result.retranca}</h4>
            <div className="flex items-center space-x-2">
              {isFromSnapshot ? (
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                  <Archive className="h-3 w-3 mr-1" />
                  Histórico
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Atual
                </Badge>
              )}
              
              <Badge variant="outline" className="text-xs">
                {result.telejornal_nome}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {result.bloco_nome}
              </Badge>
              
              {/* Botões de ação */}
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(result)}
                  className="h-6 w-6 p-0"
                  title="Editar matéria"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCopy(result)}
                  className="h-6 w-6 p-0"
                  title="Copiar matéria"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          
          {result.clip && (
            <p className="text-sm text-muted-foreground">
              <strong>Clip:</strong> {result.clip}
            </p>
          )}
          
          {result.reporter && (
            <p className="text-sm text-muted-foreground">
              <strong>Repórter:</strong> {result.reporter}
            </p>
          )}
          
          {result.highlight_text && (
            <div className="bg-gray-50 p-2 rounded text-sm">
              <strong className="capitalize">{result.highlight_field}:</strong>{" "}
              {highlightText(result.highlight_text, query)}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>
              Atualizado em: {format(new Date(result.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </span>
            {isFromSnapshot && (
              <span className="text-orange-600 font-medium">
                Espelho fechado
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
