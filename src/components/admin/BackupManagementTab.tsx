import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Download, Upload, Trash2, Database, Clock, HardDrive } from "lucide-react";
import { listBackups, createManualBackup, downloadBackup, restoreBackup, deleteBackup, EspelhoBackup, RestoreMode, RestoreScope } from "@/services/backup-api";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export function BackupManagementTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<EspelhoBackup | null>(null);
  const [restoreMode, setRestoreMode] = useState<RestoreMode>('merge');
  const [restoreScope, setRestoreScope] = useState<RestoreScope>('all');
  const [confirmText, setConfirmText] = useState('');
  const [selectedTjs, setSelectedTjs] = useState<string[]>([]);
  const [backupTelejornais, setBackupTelejornais] = useState<{ id: string; nome: string }[]>([]);

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
    mutationFn: ({ backupId }: { backupId: string }) =>
      restoreBackup(backupId, restoreMode, restoreScope, selectedTjs),
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      toast({
        title: "Backup restaurado",
        description: `${data.restored} itens processados. Uma cópia do estado anterior foi salva.`,
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

  const handleRestore = async (backup: EspelhoBackup) => {
    setSelectedBackup(backup);
    setRestoreScope(backup.scope === 'full' ? 'all' : 'espelhos');
    setRestoreMode('merge');
    setConfirmText('');
    setSelectedTjs([]);
    setBackupTelejornais([]);
    setRestoreDialogOpen(true);
    try {
      const data = await downloadBackup(backup.id);
      const list = Array.isArray(data)
        ? Array.from(new Map(data.map((e: any) => [e.telejornal_id, { id: e.telejornal_id, nome: e.estrutura?.telejornal?.nome || e.nome }])).values())
        : (data?.telejornais || []).map((t: any) => ({ id: t.id, nome: t.nome }));
      setBackupTelejornais(list.filter((t: any) => t.id));
    } catch {
      /* lista opcional */
    }
  };

  const handleDelete = (backup: EspelhoBackup) => {
    setSelectedBackup(backup);
    setDeleteDialogOpen(true);
  };

  const confirmRestore = () => {
    if (selectedBackup) {
      restoreMutation.mutate({ backupId: selectedBackup.id });
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
                      <Badge variant={backup.backup_type === 'manual' ? 'default' : backup.backup_type === 'pre_restore' ? 'outline' : 'secondary'}>
                        {backup.backup_type === 'automatic' ? 'Automático' : backup.backup_type === 'pre_restore' ? 'Antes de restauração' : 'Manual'}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                      {backup.scope === 'full' && (
                        <>
                          <span>{backup.total_telejornais ?? 0} telejornais</span>
                          <span>•</span>
                          <span>{backup.total_pautas ?? 0} pautas</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{backup.total_blocos} blocos</span>
                      <span>•</span>
                      <span>{backup.total_materias} matérias</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-4 w-4" />
                        {backup.total_espelhos} espelhos
                      </span>
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

      {/* Restore Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar backup</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-sm">
                <p>
                  Backup de {selectedBackup && format(new Date(selectedBackup.created_at), "dd/MM/yyyy 'às' HH:mm")}.
                  Antes de restaurar, uma cópia do estado atual é salva automaticamente.
                </p>

                <div className="space-y-2">
                  <p className="font-medium text-foreground">1. O que restaurar</p>
                  <RadioGroup value={restoreScope} onValueChange={(v) => setRestoreScope(v as RestoreScope)}>
                    {[
                      ['all', 'Tudo (telejornais, blocos, matérias, pautas e espelhos)'],
                      ['telejornais', 'Telejornais com seus blocos e matérias'],
                      ['pautas', 'Somente pautas'],
                      ['espelhos', 'Somente espelhos salvos'],
                    ].map(([v, l]) => (
                      <div key={v} className="flex items-center space-x-2">
                        <RadioGroupItem value={v} id={`scope-${v}`} />
                        <Label htmlFor={`scope-${v}`} className="cursor-pointer">{l}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {(restoreScope === 'telejornais' || restoreScope === 'espelhos') && backupTelejornais.length > 0 && (
                    <div className="ml-6 max-h-32 overflow-auto space-y-1 rounded border border-border p-2">
                      <p className="text-xs text-muted-foreground">Nenhum marcado = todos</p>
                      {backupTelejornais.map((t) => (
                        <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedTjs.includes(t.id)}
                            onCheckedChange={(c) =>
                              setSelectedTjs((prev) => (c ? [...prev, t.id] : prev.filter((x) => x !== t.id)))
                            }
                          />
                          <span className="text-foreground">{t.nome}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-foreground">2. Como restaurar</p>
                  <RadioGroup value={restoreMode} onValueChange={(v) => setRestoreMode(v as RestoreMode)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="merge" id="mode-merge" />
                      <Label htmlFor="mode-merge" className="cursor-pointer">
                        <strong>Recuperar o que falta (recomendado)</strong> — só recria itens apagados
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="overwrite" id="mode-overwrite" />
                      <Label htmlFor="mode-overwrite" className="cursor-pointer">
                        <strong>Voltar ao estado do backup</strong> — sobrescreve itens existentes
                      </Label>
                    </div>
                  </RadioGroup>
                  {restoreMode === 'overwrite' && (
                    <Input
                      placeholder='Digite "RESTAURAR" para confirmar'
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                    />
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmRestore(); }}
              disabled={restoreMutation.isPending || (restoreMode === 'overwrite' && confirmText !== 'RESTAURAR')}
            >
              {restoreMutation.isPending ? 'Restaurando...' : 'Restaurar'}
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
