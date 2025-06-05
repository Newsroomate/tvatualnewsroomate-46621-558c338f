
import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface ResizableGridRowProps {
  children: React.ReactNode[];
  className?: string;
  onDoubleClick?: () => void;
  provided?: any;
  snapshot?: any;
}

export const ResizableGridRow = ({ 
  children, 
  className = "", 
  onDoubleClick,
  provided,
  snapshot 
}: ResizableGridRowProps) => {
  // Calculate equal default sizes for all panels
  const defaultSizes = children.map(() => 100 / children.length);

  return (
    <div 
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      className={`hover:bg-gray-50 transition-colors ${
        snapshot?.isDragging ? "bg-blue-50" : ""
      } ${className}`}
      onDoubleClick={onDoubleClick}
    >
      <ResizablePanelGroup direction="horizontal" className="min-h-[60px]">
        {children.map((child, index) => (
          <React.Fragment key={index}>
            <ResizablePanel 
              defaultSize={defaultSizes[index]}
              minSize={5}
              className="flex items-center"
            >
              <div className="py-2 px-4 w-full flex items-center min-h-[56px]">
                {child}
              </div>
            </ResizablePanel>
            {index < children.length - 1 && (
              <ResizableHandle withHandle className="w-1 bg-gray-200 hover:bg-gray-300 transition-colors" />
            )}
          </React.Fragment>
        ))}
      </ResizablePanelGroup>
    </div>
  );
};
