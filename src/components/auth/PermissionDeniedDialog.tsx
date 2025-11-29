import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

interface PermissionDeniedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: string;
  resource: string;
  message?: string;
}

export const PermissionDeniedDialog = ({
  isOpen,
  onClose,
  action,
  resource,
  message,
}: PermissionDeniedDialogProps) => {
  const getActionMessage = (action: string): string => {
    const actionMessages: Record<string, string> = {
      'create': 'criar',
      'update': 'editar',
      'delete': 'excluir',
      'view': 'visualizar',
      'export': 'exportar',
    };
    return actionMessages[action] || action;
  };

  const getResourceMessage = (resource: string): string => {
    const resourceMessages: Record<string, string> = {
      'bloco': 'blocos',
      'materia': 'matérias',
      'telejornal': 'telejornais',
      'pauta': 'pautas',
      'espelho': 'espelhos',
      'snapshot': 'snapshots',
      'gc': 'arquivos GC',
      'playout': 'arquivos Playout',
      'lauda': 'laudas',
      'rss': 'feeds RSS',
      'clip_retranca': 'arquivos Clip/Retranca',
    };
    return resourceMessages[resource] || resource;
  };

  const defaultMessage = `Você não tem permissão para ${getActionMessage(action)} ${getResourceMessage(resource)}.`;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-destructive/10">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">Permissão Negada</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 text-base">
            <p className="font-medium text-foreground">
              {message || defaultMessage}
            </p>
            <p className="text-muted-foreground">
              Para solicitar esta permissão, entre em contato com o <strong>Editor-Chefe</strong> do telejornal. Ele poderá conceder o acesso necessário através do painel de administração.
            </p>
            <p className="text-sm text-muted-foreground italic">
              Esta ação foi bloqueada automaticamente pelo sistema de segurança para proteger a integridade do conteúdo.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={onClose} className="w-full">
            Entendi
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
