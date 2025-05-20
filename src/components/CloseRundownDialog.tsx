
import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CloseRundownDialogProps } from '@/types';

export const CloseRundownDialog: React.FC<CloseRundownDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  telejornalNome 
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar fechamento do espelho</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja fechar o espelho deste telejornal?
            {telejornalNome && (
              <>
                <br />
                <strong className="text-primary">{telejornalNome}</strong>
              </>
            )}
            <br /><br />
            Ao fechar, ele não poderá mais ser editado e será movido para modo somente leitura no histórico de espelhos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Fechar espelho
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
