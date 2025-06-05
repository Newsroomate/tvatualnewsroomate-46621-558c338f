
import React, { useState, useRef, useCallback } from "react";

interface Column {
  id: string;
  label: string;
  minWidth: number;
  defaultWidth: number;
}

interface ResizableTableProps {
  columns: Column[];
  children: React.ReactNode;
  isBatchMode?: boolean;
}

export const ResizableTable = ({ columns, children, isBatchMode = false }: ResizableTableProps) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const initialWidths: Record<string, number> = {};
    columns.forEach(col => {
      initialWidths[col.id] = col.defaultWidth;
    });
    return initialWidths;
  });
  
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    setIsResizing(columnId);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnId]);
  }, [columnWidths]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(
      columns.find(col => col.id === isResizing)?.minWidth || 50,
      startWidth + diff
    );
    
    setColumnWidths(prev => ({
      ...prev,
      [isResizing]: newWidth
    }));
  }, [isResizing, startX, startWidth, columns]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="overflow-x-auto">
      <table ref={tableRef} className="w-full" style={{ tableLayout: 'fixed' }}>
        <thead className="bg-gray-50 text-xs uppercase">
          <tr>
            {isBatchMode && (
              <th 
                className="py-3 px-4 text-left relative border-r border-gray-200" 
                style={{ width: '60px' }}
              >
                Sel.
              </th>
            )}
            {columns.map((column, index) => (
              <th
                key={column.id}
                className="py-3 px-4 text-left relative border-r border-gray-200 last:border-r-0"
                style={{ width: `${columnWidths[column.id]}px` }}
              >
                {column.label}
                {index < columns.length - 1 && (
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-300 transition-colors group"
                    onMouseDown={(e) => handleMouseDown(e, column.id)}
                  >
                    <div className="w-px h-full bg-gray-300 group-hover:bg-blue-500 transition-colors mx-auto" />
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {children}
        </tbody>
      </table>
    </div>
  );
};
