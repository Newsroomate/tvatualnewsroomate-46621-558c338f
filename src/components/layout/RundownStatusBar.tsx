
import { Telejornal } from "@/types/index";
import { canCreateEspelhos } from "@/utils/permission";
import { useAuth } from "@/context/AuthContext";

interface RundownStatusBarProps {
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  onToggleRundown: () => void;
}

export const RundownStatusBar = ({
  selectedJournal,
  currentTelejornal,
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
        {currentTelejornal && (
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
        )}
        {!currentTelejornal && (
          <div className="text-sm text-muted-foreground">
            Nenhum espelho selecionado
          </div>
        )}
      </div>
      
      {canCreateEspelhos(profile) && (
        <button 
          onClick={onToggleRundown}
          className={`px-4 py-1 rounded-md text-xs font-medium ${
            currentTelejornal?.espelho_aberto 
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
        >
          {currentTelejornal?.espelho_aberto ? "Fechar Espelho" : "Abrir Espelho Agora"}
        </button>
      )}
    </div>
  );
};
