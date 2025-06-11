
import { RefreshCw } from "lucide-react";

export const LoadingState = () => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p className="text-muted-foreground">Carregando dados atualizados...</p>
      </div>
    </div>
  );
};
