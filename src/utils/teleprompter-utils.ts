import { Materia, Bloco } from "@/types";

/**
 * Filters blocks to only include approved materias
 */
export function filterApprovedMaterias(blocks: (Bloco & { items: Materia[] })[]): (Bloco & { items: Materia[] })[] {
  return blocks.map(block => ({
    ...block,
    items: block.items.filter(materia => materia.status === 'approved')
  })).filter(block => block.items.length > 0);
}

/**
 * Gets all approved materias from blocks in correct order
 */
export function getOrderedApprovedMaterias(blocks: (Bloco & { items: Materia[] })[]): (Materia & { blockName?: string })[] {
  const sortedBlocks = [...blocks].sort((a, b) => a.ordem - b.ordem);
  const orderedMaterias: (Materia & { blockName?: string })[] = [];
  
  sortedBlocks.forEach(block => {
    // Sort materias within each block by ordem and filter for approved only
    const approvedMaterias = [...block.items]
      .filter(materia => materia.status === 'approved')
      .sort((a, b) => a.ordem - b.ordem);
    
    // Add block name to each materia for context
    approvedMaterias.forEach(materia => {
      orderedMaterias.push({
        ...materia,
        blockName: block.nome
      });
    });
  });

  return orderedMaterias;
}

/**
 * Gets ordered blocks with only approved materias
 */
export function getOrderedApprovedBlocks(blocks: (Bloco & { items: Materia[] })[]): (Bloco & { items: Materia[] })[] {
  const sortedBlocks = [...blocks].sort((a, b) => a.ordem - b.ordem);
  
  return sortedBlocks.map(block => ({
    ...block,
    items: [...block.items]
      .filter(materia => materia.status === 'approved')
      .sort((a, b) => a.ordem - b.ordem)
  })).filter(block => block.items.length > 0);
}

/**
 * Checks if blocks have any approved content
 */
export function hasApprovedContent(blocks: (Bloco & { items: Materia[] })[]): boolean {
  return blocks.some(block => 
    block.items.some(materia => materia.status === 'approved')
  );
}

/**
 * Gets telejornal name with fallback to URL parameter
 */
export function getTelejornalName(telejornal: { nome?: string } | null): string {
  if (telejornal?.nome) return telejornal.nome;
  
  const urlParams = new URLSearchParams(window.location.search);
  const urlTelejornalName = urlParams.get('jornal');
  return urlTelejornalName || 'Telejornal';
}

/**
 * Creates a safe filename from telejornal name
 */
export function createSafeFilename(telejornalName: string, prefix: string = 'teleprompter'): string {
  const safeName = telejornalName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const dateFormatted = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  const timeFormatted = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  }).replace(/:/g, 'h');
  
  return `${prefix}_${safeName}_${dateFormatted}_${timeFormatted}`;
}

/**
 * Validates that blocks data is in correct format
 */
export function validateBlocksData(blocks: any): blocks is (Bloco & { items: Materia[] })[] {
  if (!Array.isArray(blocks)) return false;
  
  return blocks.every(block => 
    block && 
    typeof block.id === 'string' &&
    typeof block.nome === 'string' &&
    typeof block.ordem === 'number' &&
    Array.isArray(block.items) &&
    block.items.every((item: any) => 
      item && 
      typeof item.id === 'string' &&
      typeof item.ordem === 'number'
    )
  );
}

/**
 * Logs teleprompter operations for debugging
 */
export function logTeleprompterOperation(operation: string, data?: any): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Teleprompter ${operation}:`, data);
}