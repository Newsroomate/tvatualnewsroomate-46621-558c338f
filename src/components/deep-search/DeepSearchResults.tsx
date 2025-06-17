
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2 } from "lucide-react";
import { DeepSearchResult } from "@/services/deep-search-api";
import { DeepSearchResultItem } from "./DeepSearchResultItem";

interface DeepSearchResultsProps {
  searchResults: DeepSearchResult[];
  hasSearched: boolean;
  isSearching: boolean;
  query: string;
  onEditMateria: (result: DeepSearchResult) => void;
  onCopyMateria: (result: DeepSearchResult) => void;
}

export const DeepSearchResults = ({
  searchResults,
  hasSearched,
  isSearching,
  query,
  onEditMateria,
  onCopyMateria
}: DeepSearchResultsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Resultados da Busca</span>
          {hasSearched && (
            <Badge variant="secondary">
              {searchResults.length} resultado(s)
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasSearched && !isSearching && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4" />
            <p>Digite uma palavra-chave e clique em "Buscar" para ver os resultados</p>
          </div>
        )}

        {isSearching && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Buscando...</p>
          </div>
        )}

        {hasSearched && searchResults.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4" />
            <p>Nenhum resultado encontrado para sua busca</p>
          </div>
        )}

        {hasSearched && searchResults.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {searchResults.map((result) => (
              <DeepSearchResultItem
                key={result.id}
                result={result}
                query={query}
                onEdit={onEditMateria}
                onCopy={onCopyMateria}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
