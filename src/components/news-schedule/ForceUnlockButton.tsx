import { useState } from "react";
import { Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  materiaId: string;
  lockedByName: string;
}

export const ForceUnlockButton = ({ materiaId, lockedByName }: Props) => {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (profile?.role !== "editor_chefe") return null;

  const release = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("force_release_materia_lock" as never, { p_materia_id: materiaId } as never);
    setBusy(false);
    setOpen(false);
    if (error) {
      toast({ title: "Não foi possível desbloquear", description: error.message, variant: "destructive" });
      return;
    }
    window.dispatchEvent(new CustomEvent("materia-locks-changed", { detail: { materiaId } }));
    toast({ title: data ? "Lauda desbloqueada" : "A lauda já estava livre" });
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="text-muted-foreground hover:text-destructive"
        title="Forçar desbloqueio (Editor-Chefe)"
      >
        <Unlock className="h-3.5 w-3.5" />
      </button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Forçar desbloqueio?</AlertDialogTitle>
            <AlertDialogDescription>
              A lauda está em edição por {lockedByName}. Alterações não salvas dessa pessoa podem ser perdidas. Esta ação fica registrada na auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={release} disabled={busy}>Desbloquear</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
