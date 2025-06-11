
import { Materia } from '@/types';

export const useOrderCalculation = () => {
  // Calculate the next order value for inserting below a selected materia
  const calculateInsertOrder = (items: Materia[], selectedMateria: Materia): number => {
    // Sort items by order to ensure we have the correct sequence
    const sortedItems = [...items].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    
    // Find the index of the selected materia in the sorted array
    const selectedIndex = sortedItems.findIndex(item => item.id === selectedMateria.id);
    
    if (selectedIndex === -1) {
      // If selected materia not found, add at the end
      return Math.max(...sortedItems.map(item => item.ordem || 0)) + 1;
    }
    
    const selectedOrder = selectedMateria.ordem || 0;
    
    // Check if there's a next item after the selected one
    if (selectedIndex < sortedItems.length - 1) {
      const nextOrder = sortedItems[selectedIndex + 1].ordem || 0;
      // Use a decimal value between current and next to ensure proper ordering
      return selectedOrder + 0.1;
    } else {
      // If it's the last item, simply add 1
      return selectedOrder + 1;
    }
  };

  // Normalize orders to ensure they are sequential integers
  const normalizeOrders = (items: Materia[]): Materia[] => {
    const sortedItems = [...items].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    
    return sortedItems.map((item, index) => ({
      ...item,
      ordem: index
    }));
  };

  // Get items that need their order updated after an insertion
  const getItemsToUpdate = (items: Materia[], insertOrder: number): Materia[] => {
    return items.filter(item => (item.ordem || 0) >= Math.floor(insertOrder));
  };

  return {
    calculateInsertOrder,
    normalizeOrders,
    getItemsToUpdate
  };
};
