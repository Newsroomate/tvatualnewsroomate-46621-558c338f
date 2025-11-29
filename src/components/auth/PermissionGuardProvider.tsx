import { createContext, useContext, useState, ReactNode } from "react";
import { PermissionDeniedDialog } from "./PermissionDeniedDialog";

interface PermissionGuardContextType {
  showPermissionDenied: (action: string, resource: string, message?: string) => void;
}

const PermissionGuardContext = createContext<PermissionGuardContextType | undefined>(undefined);

export const usePermissionGuardContext = () => {
  const context = useContext(PermissionGuardContext);
  if (!context) {
    throw new Error("usePermissionGuardContext must be used within PermissionGuardProvider");
  }
  return context;
};

interface PermissionGuardProviderProps {
  children: ReactNode;
}

export const PermissionGuardProvider = ({ children }: PermissionGuardProviderProps) => {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    action: string;
    resource: string;
    message?: string;
  }>({
    isOpen: false,
    action: '',
    resource: '',
    message: undefined,
  });

  const showPermissionDenied = (action: string, resource: string, message?: string) => {
    setDialogState({
      isOpen: true,
      action,
      resource,
      message,
    });
  };

  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <PermissionGuardContext.Provider value={{ showPermissionDenied }}>
      {children}
      <PermissionDeniedDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        action={dialogState.action}
        resource={dialogState.resource}
        message={dialogState.message}
      />
    </PermissionGuardContext.Provider>
  );
};
