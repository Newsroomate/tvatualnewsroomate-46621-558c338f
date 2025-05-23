import React from "react";
import { EditPanel } from "@/components/edit-panel";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GripVertical } from "lucide-react";
import { Materia } from "@/types";

interface NewsItemProps {
  item: Materia;
  index: number;
  isDragging: boolean;
  dragHandleProps: any;
  handleEditItem: (item: Materia) => void;
  handleDeleteItem: (item: Materia) => void;
}

export const NewsItem: React.FC<NewsItemProps> = React.memo(({
  item,
  index,
  isDragging,
  dragHandleProps,
  handleEditItem,
  handleDeleteItem
}) => {
  const [editPanelOpen, setEditPanelOpen] = React.useState(false);

  const openEditPanel = () => {
    handleEditItem(item);
    setEditPanelOpen(true);
  };

  const closeEditPanel = () => {
    setEditPanelOpen(false);
  };

  return (
    <>
      <Card
        data-id={item.id}
        className={`group mb-2 border-2 border-transparent hover:border-primary ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      >
        <CardContent className="relative p-3">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="absolute left-1 top-1/2 transform -translate-y-1/2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <GripVertical className="h-4 w-4 text-gray-500" />
          </div>

          {/* Page and Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Label htmlFor={`item-${index}-page`} className="text-xs text-gray-500 mr-1">Página:</Label>
              <Input
                type="text"
                id={`item-${index}-page`}
                value={item.pagina || ''}
                className="w-16 text-xs font-bold"
                readOnly
              />
            </div>
            <h3 className="text-sm font-semibold">{item.retranca}</h3>
          </div>

          {/* Duration and Status */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              <Label htmlFor={`item-${index}-duration`} className="text-xs text-gray-500 mr-1">Duração:</Label>
              <Input
                type="text"
                id={`item-${index}-duration`}
                value={item.duracao ? `${item.duracao}s` : '0s'}
                className="w-16 text-xs"
                readOnly
              />
            </div>
            <span className="text-xs text-gray-500">{item.status}</span>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button variant="ghost" size="icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={openEditPanel}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M4 13a9 9 0 0 0 9 9c2.21 0 4.22-.89 5.53-2.36L22 22" />
                  <path d="M15 5.83A2 2 0 0 0 13.54 5h-4.37L3 14.27a9 9 0 0 0 2.19 4.59" />
                  <path d="M10.17 10.17a3 3 0 1 0 4.24 4.24" />
                </svg>
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-4 w-4 text-destructive"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" x2="10" y1="11" y2="17" />
                        <line x1="14" x2="14" y1="11" y2="17" />
                      </svg>
                      Excluir
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Essa ação irá excluir a matéria permanentemente. Tem certeza que deseja continuar?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteItem(item)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
      <EditPanel
        isOpen={editPanelOpen}
        onClose={closeEditPanel}
        item={item}
      />
    </>
  );
});
