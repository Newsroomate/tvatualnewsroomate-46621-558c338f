import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagementTab } from "./UserManagementTab";
import { UserPermissionsTab } from "./UserPermissionsTab";
import { TelejornalAccessTab } from "./TelejornalAccessTab";
import { PermissionsMatrixTab } from "./PermissionsMatrixTab";
import { AuditLogsTab } from "./AuditLogsTab";
import { BackupManagementTab } from "./BackupManagementTab";

interface PermissionsManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PermissionsManagementModal({
  open,
  onOpenChange,
}: PermissionsManagementModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Permissões do Sistema</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="users" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="permissions">Permissões</TabsTrigger>
            <TabsTrigger value="telejornal">Telejornal</TabsTrigger>
            <TabsTrigger value="matrix">Matriz</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
            <TabsTrigger value="backup">Backups</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4">
            <TabsContent value="users" className="m-0">
              <UserManagementTab />
            </TabsContent>

            <TabsContent value="permissions" className="m-0">
              <UserPermissionsTab />
            </TabsContent>

            <TabsContent value="telejornal" className="m-0">
              <TelejornalAccessTab />
            </TabsContent>

            <TabsContent value="matrix" className="m-0">
              <PermissionsMatrixTab />
            </TabsContent>

            <TabsContent value="audit" className="m-0">
              <AuditLogsTab />
            </TabsContent>

            <TabsContent value="backup" className="m-0">
              <BackupManagementTab />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
