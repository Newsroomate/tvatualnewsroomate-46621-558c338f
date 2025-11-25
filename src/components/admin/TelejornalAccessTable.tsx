import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TelejornalAccessWithDetails } from "@/services/telejornal-access-api";
import { UserRole } from "@/types/auth";

interface TelejornalAccessTableProps {
  data: TelejornalAccessWithDetails[];
  onEdit: (access: TelejornalAccessWithDetails) => void;
  onDelete: (id: string) => void;
}

const roleLabels: Record<UserRole, string> = {
  reporter: "Repórter",
  editor: "Editor",
  editor_chefe: "Editor-chefe",
  produtor: "Produtor",
};

const roleVariants: Record<UserRole, "default" | "secondary" | "destructive" | "outline"> = {
  reporter: "secondary",
  editor: "default",
  editor_chefe: "destructive",
  produtor: "outline",
};

export const TelejornalAccessTable = ({
  data,
  onEdit,
  onDelete,
}: TelejornalAccessTableProps) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma exceção de permissão cadastrada.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuário</TableHead>
          <TableHead>Telejornal</TableHead>
          <TableHead>Permissão</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((access) => (
          <TableRow key={access.id}>
            <TableCell className="font-medium">
              {access.user_name || "Usuário desconhecido"}
            </TableCell>
            <TableCell>{access.telejornal_nome || "Telejornal desconhecido"}</TableCell>
            <TableCell>
              <Badge variant={roleVariants[access.role]}>
                {roleLabels[access.role]}
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(access.created_at).toLocaleDateString("pt-BR")}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(access)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(access.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
