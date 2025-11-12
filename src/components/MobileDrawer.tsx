import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export const MobileDrawer = ({ isOpen, onClose, children, title }: MobileDrawerProps) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const drawerContent = (
    <>
      {/* Overlay */}
      <div 
        className="mobile-drawer-overlay md:hidden"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`mobile-drawer ${isOpen ? 'open' : ''} md:hidden`}>
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-primary text-primary-foreground">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-primary-foreground hover:bg-primary/80"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );

  return createPortal(drawerContent, document.body);
};