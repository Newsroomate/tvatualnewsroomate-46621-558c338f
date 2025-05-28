
import { Bloco, Materia, Telejornal } from '@/types';

export const generateGCTXT = (blocks: (Bloco & { items: Materia[] })[], telejornal: Telejornal) => {
  let content = '';
  
  // Cabeçalho do documento
  content += '='.repeat(60) + '\n';
  content += 'GERADOR DE CARACTERES (GC)\n';
  content += telejornal.nome + '\n';
  content += new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) + '\n';
  content += '='.repeat(60) + '\n\n';
  
  // Processar cada bloco
  blocks.forEach((bloco, blocoIndex) => {
    // Verificar se há matérias com GC no bloco
    const materiasComGC = bloco.items.filter(materia => materia.gc && materia.gc.trim() !== '');
    
    if (materiasComGC.length === 0) {
      return; // Pular blocos sem GC
    }
    
    // Cabeçalho do bloco
    content += `${bloco.nome}\n`;
    content += '-'.repeat(40) + '\n\n';
    
    // Processar matérias do bloco
    materiasComGC.forEach((materia, materiaIndex) => {
      // Retranca
      content += `RETRANCA: ${materia.retranca || 'Sem retranca'}\n\n`;
      
      // GC
      content += 'GC:\n';
      content += (materia.gc || 'Sem conteúdo de GC') + '\n';
      
      // Separador entre matérias
      if (materiaIndex < materiasComGC.length - 1) {
        content += '\n' + '.'.repeat(30) + '\n\n';
      }
    });
    
    // Espaço extra entre blocos
    if (blocoIndex < blocks.length - 1) {
      content += '\n\n';
    }
  });
  
  // Rodapé
  content += '\n\n' + '='.repeat(60) + '\n';
  content += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
  content += '='.repeat(60);
  
  // Criar e baixar o arquivo
  const blob = new Blob([content], {
    type: 'text/plain;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `GC_${telejornal.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
