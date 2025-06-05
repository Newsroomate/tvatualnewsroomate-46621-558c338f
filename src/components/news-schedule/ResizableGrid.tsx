
import React, { useState, useRef, useCallback } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface Column {
  id: string;
  title: string;
  minWidth?: number;
  defaultWidth?: number;
}

interface ResizableGridProps {
  columns: Column[];
  children: React.ReactNode;
  className?: string;
}

export const ResizableGrid = ({ columns, children, className = "" }: ResizableGridProps) => {
  // Calculate default sizes for panels
  const defaultSizes = columns.map(col => col.defaultWidth || 100 / columns.length);

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <ResizablePanelGroup direction="horizontal" className="bg-gray-50">
        {columns.map((column, index) => (
          <React.Fragment key={column.id}>
            <ResizablePanel 
              defaultSize={defaultSizes[index]}
              minSize={column.minWidth || 5}
              className="flex items-center"
            >
              <div className="py-3 px-4 text-xs uppercase font-medium text-gray-700 truncate w-full">
                {column.title}
              </div>
            </ResizablePanel>
            {index < columns.length - 1 && (
              <ResizableHandle withHandle className="w-1 bg-gray-300 hover:bg-gray-400 transition-colors" />
            )}
          </React.Fragment>
        ))}
      </ResizablePanelGroup>

      {/* Content */}
      <div className="divide-y divide-gray-200">
        {children}
      </div>
    </div>
  );
};
