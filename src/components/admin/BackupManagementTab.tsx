import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Download, Upload, Trash2, Database, Clock, HardDrive } from "lucide-react";
import { listBackups, createManualBackup, downloadBackup, restoreBackup, deleteBackup, EspelhoBackup } from "@/services/backup-api";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function BackupManagementTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<EspelhoBackup | null>(null);
  const [restoreType, setRestoreType] = useState<'complete' | 'merge'>('merge');

  const { data: backups = [], isLoading } = useQuery({
    queryKey: ['espelhos-backups'],
    queryFn: listBackups,
  });

  const createBackupMutation = useMutation({
    mutationFn: createManualBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['espelhos-backups'] });
      toast({
        title: "Backup criado",
        description: "Backup manual criado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar backup",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: ({ backupId, type }: { backupId: string; type: 'complete' | 'merge' }) =>
      restoreBackup(backupId, type),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['espelhos-backups'] });
      toast({
        title: "Backup restaurado",
        description: `${data.restored} espelhos restaurados com sucesso`,
      });
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao restaurar backup",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['espelhos-backups'] });
      toast({
        title: "Backup excluído",
        description: "Backup removido com sucesso",
      });
      setDeleteDialogOpen(false);
      setSelectedBackup(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir backup",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDownload = async (backup: EspelhoBackup) => {
    try {
      const data = await downloadBackup(backup.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-espelhos-${format(new Date(backup.created_at), 'yyyy-MM-dd-HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Download concluído",
        description: "Backup baixado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao baixar backup",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRestore = (backup: EspelhoBackup) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
  };

  const handleDelete = (backup: EspelhoBackup) => {
    setSelectedBackup(backup);
    setDeleteDialogOpen(true);
  };

  const confirmRestore = () => {
    if (selectedBackup) {
      restoreMutation.mutate({ backupId: selectedBackup.id, type: restoreType });
    }
  };

  const confirmDelete = () => {
    if (selectedBackup) {
      deleteMutation.mutate(selectedBackup.id);
    }
  };

  if (isLoading) {
    return <div className="p-6">Carregando backups...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Backups</h2>
          <p className="text-muted-foreground">
            Sistema automático de backup diário às 3h da manhã (últimos 30 dias)
          </p>
        </div>
        <Button
          onClick={() => createBackupMutation.mutate()}
          disabled={createBackupMutation.isPending}
        >
          <Database className="mr-2 h-4 w-4" />
          Criar Backup Manual
        </Button>
      </div>

      {backups.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Nenhum backup disponível. Crie um backup manual ou aguarde o backup automático.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {backups.map((backup) => (
            <Card key={backup.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {format(new Date(backup.created_at), "dd/MM/yyyy 'às' HH:mm")}
                      <Badge variant={backup.backup_type === 'automatic' ? 'secondary' : 'default'}>
                        {backup.backup_type === 'automatic' ? 'Automático' : 'Manual'}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-4 w-4" />
                        {backup.total_espelhos} espelhos
                      </span>
                      <span>•</span>
                      <span>{backup.total_blocos} blocos</span>
                      <span>•</span>
                      <span>{backup.total_materias} matérias</span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(backup)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(backup)}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(backup)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Restauração</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Você está prestes a restaurar o backup de{' '}
                {selectedBackup &&
                  format(new Date(selectedBackup.created_at), "dd/MM/yyyy 'às' HH:mm")}
              </p>
              <p>
                Este backup contém <strong>{selectedBackup?.total_espelhos} espelhos</strong>,{' '}
                <strong>{selectedBackup?.total_blocos} blocos</strong> e{' '}
                <strong>{selectedBackup?.total_materias} matérias</strong>.
              </p>
              
              <RadioGroup value={restoreType} onValueChange={(value) => setRestoreType(value as 'complete' | 'merge')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="merge" id="merge" />
                  <Label htmlFor="merge" className="cursor-pointer">
                    <strong>Merge (Recomendado)</strong> - Adiciona espelhos do backup que não existem atualmente
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="complete" id="complete" />
                  <Label htmlFor="complete" className="cursor-pointer">
                    <strong>Restauração Completa</strong> - Substitui TODOS os espelhos atuais (⚠️ Cuidado!)
                  </Label>
                </div>
              </RadioGroup>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestore}
              disabled={restoreMutation.isPending}
            >
              {restoreMutation.isPending ? 'Restaurando...' : 'Confirmar Restauração'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o backup de{' '}
              {selectedBackup &&
                format(new Date(selectedBackup.created_at), "dd/MM/yyyy 'às' HH:mm")}
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
