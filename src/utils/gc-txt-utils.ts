
import { Bloco, Materia, Telejornal } from "@/types";

export const generateGCTextFile = (blocks: (Bloco & { items: Materia[] })[], telejornal: Telejornal | null) => {
  if (!telejornal || blocks.length === 0) {
    alert('Não há conteúdo para exportar.');
    return;
  }

  let content = `TELEJORNAL: ${telejornal.nome}\n`;
  content += `DATA: ${new Date().toLocaleDateString('pt-BR')}\n`;
  content += `HORÁRIO: ${telejornal.horario || 'Não definido'}\n\n`;
  content += "=".repeat(60) + "\n";
  content += "CONTEÚDO GC - GERADOR DE CARACTERES\n";
  content += "=".repeat(60) + "\n\n";

  let totalMaterias = 0;

  blocks.forEach((bloco, blocoIndex) => {
    if (bloco.items.length === 0) return;

    content += `BLOCO ${blocoIndex + 1}: ${bloco.nome}\n`;
    content += "-".repeat(40) + "\n\n";

    // Ordenar matérias por ordem
    const sortedMaterias = [...bloco.items].sort((a, b) => a.ordem - b.ordem);

    sortedMaterias.forEach((materia) => {
      totalMaterias++;
      
      content += `${materia.ordem.toString().padStart(2, '0')}. RETRANCA: ${materia.retranca || 'Sem retranca'}\n`;
      
      if (materia.gc && materia.gc.trim()) {
        content += `    GC:\n`;
        // Indenta cada linha do GC
        const gcLines = materia.gc.split('\n');
        gcLines.forEach(line => {
          content += `    ${line}\n`;
        });
      } else {
        content += `    GC: [NÃO DEFINIDO]\n`;
      }
      
      content += "\n";
    });

    content += "\n";
  });

  content += "=".repeat(60) + "\n";
  content += `TOTAL DE MATÉRIAS: ${totalMaterias}\n`;
  content += `GERADO EM: ${new Date().toLocaleString('pt-BR')}\n`;
  content += "=".repeat(60);

  // Criar e baixar o arquivo
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `GC_${telejornal.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
