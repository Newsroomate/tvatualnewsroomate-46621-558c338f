
import React, { useState, useRef, useCallback } from "react";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";

interface Column {
  id: string;
  label: string;
  minWidth: number;
  defaultWidth: number;
}

interface ResizableGridProps {
  columns: Column[];
  children: React.ReactNode;
  isBatchMode?: boolean;
}

export const ResizableGrid = ({ columns, children, isBatchMode = false }: ResizableGridProps) => {
  const [columnSizes, setColumnSizes] = useState<number[]>(() => {
    const totalColumns = isBatchMode ? columns.length + 1 : columns.length;
    const baseSize = 100 / totalColumns;
    return Array(totalColumns).fill(baseSize);
  });

  const handleColumnResize = useCallback((sizes: number[]) => {
    setColumnSizes(sizes);
  }, []);

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <ResizablePanelGroup 
          direction="horizontal" 
          onLayout={handleColumnResize}
          className="min-h-[48px]"
        >
          {isBatchMode && (
            <>
              <ResizablePanel 
                defaultSize={columnSizes[0]} 
                minSize={5}
                className="flex items-center justify-center px-4 py-3"
              >
                <span className="text-xs font-medium text-gray-700 uppercase">Sel.</span>
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}
          
          {columns.map((column, index) => {
            const panelIndex = isBatchMode ? index + 1 : index;
            const isLast = panelIndex === columnSizes.length - 1;
            
            return (
              <React.Fragment key={column.id}>
                <ResizablePanel 
                  defaultSize={columnSizes[panelIndex]} 
                  minSize={8}
                  className="flex items-center justify-center px-4 py-3"
                >
                  <span className="text-xs font-medium text-gray-700 uppercase">
                    {column.label}
                  </span>
                </ResizablePanel>
                {!isLast && <ResizableHandle />}
              </React.Fragment>
            );
          })}
        </ResizablePanelGroup>
      </div>

      {/* Body */}
      <div className="divide-y divide-gray-200">
        {children}
      </div>
    </div>
  );
};
