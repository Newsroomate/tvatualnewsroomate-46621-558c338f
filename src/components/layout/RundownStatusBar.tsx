
import { Button } from "@/components/ui/button";
import { Telejornal } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { canCreateEspelhos } from "@/utils/permission";

interface RundownStatusBarProps {
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  secondaryTelejornal: Telejornal | null;
  isDualViewActive: boolean;
  onToggleRundown: () => void;
}

export const RundownStatusBar = ({
  selectedJournal,
  currentTelejornal,
  secondaryTelejornal,
  isDualViewActive,
  onToggleRundown
}: RundownStatusBarProps) => {
  const { profile } = useAuth();

  if (!selectedJournal) {
    return (
      <div className="bg-muted px-4 py-2 border-b">
        <div className="text-sm text-muted-foreground">
          Nenhum espelho aberto no momento
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted px-4 py-2 border-b flex justify-between items-center">
      <div>
        {isDualViewActive ? (
          <div className="text-sm space-y-1">
            <div>
              <span className="font-medium">Visualização Dual Ativa</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Principal: {currentTelejornal?.nome} | Secundário: {secondaryTelejornal?.nome}
            </div>
          </div>
        ) : (
          currentTelejornal && (
            <div className="text-sm">
              <span className="font-medium">
                Espelho {currentTelejornal.espelho_aberto ? (
                  <span className="text-green-600">ABERTO</span>
                ) : (
                  <span className="text-red-600">FECHADO</span>
                )}:
              </span> {' '}
              {currentTelejornal.nome} {currentTelejornal.espelho_aberto && (
                <>- ({new Date().toLocaleDateString('pt-BR')})</>
              )}
            </div>
          )
        )}
        {!currentTelejornal && !isDualViewActive && (
          <div className="text-sm text-muted-foreground">
            Nenhum espelho selecionado
          </div>
        )}
      </div>
      
      {canCreateEspelhos(profile) && !isDualViewActive && (
        <Button 
          onClick={onToggleRundown}
          className={`px-4 py-1 rounded-md text-xs font-medium ${
            currentTelejornal?.espelho_aberto 
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
        >
          {currentTelejornal?.espelho_aberto ? "Fechar Espelho" : "Abrir Espelho Agora"}
        </Button>
      )}
    </div>
  );
};
