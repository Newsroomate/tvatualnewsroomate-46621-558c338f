
import React from "react";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";

interface ResizableRowProps {
  children: React.ReactNode[];
  className?: string;
  onDoubleClick?: () => void;
  provided?: any;
  snapshot?: any;
  isSelected?: boolean;
}

export const ResizableRow = ({ 
  children, 
  className = "", 
  onDoubleClick,
  provided,
  snapshot,
  isSelected = false
}: ResizableRowProps) => {
  const rowClasses = `
    hover:bg-gray-50 transition-colors min-h-[56px]
    ${snapshot?.isDragging ? "bg-blue-50" : ""}
    ${isSelected ? "bg-blue-50" : ""}
    ${className}
  `.trim();

  const content = (
    <div 
      className={rowClasses}
      onDoubleClick={onDoubleClick}
    >
      <ResizablePanelGroup direction="horizontal" className="min-h-[56px]">
        {children.map((child, index) => {
          const isLast = index === children.length - 1;
          return (
            <React.Fragment key={index}>
              <ResizablePanel 
                defaultSize={100 / children.length}
                minSize={5}
                className="flex items-center px-4 py-2"
              >
                {child}
              </ResizablePanel>
              {!isLast && <ResizableHandle />}
            </React.Fragment>
          );
        })}
      </ResizablePanelGroup>
    </div>
  );

  if (provided) {
    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        {content}
      </div>
    );
  }

  return content;
};
