
import { useToast } from "@/hooks/use-toast";
import { useClipboard } from "@/context/ClipboardContext";
import { Bloco, Materia, Telejornal } from "@/types";
import { ClipboardItem, ClipboardBlockData, ClipboardMateriaData } from "@/types/clipboard";
import { createBloco, createMateria } from "@/services/api";
import { findHighestPageNumber } from "@/components/news-schedule/utils";

interface UseClipboardOperationsProps {
  currentTelejornal: Telejornal | null;
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
}

export const useClipboardOperations = ({
  currentTelejornal,
  blocks,
  setBlocks
}: UseClipboardOperationsProps) => {
  const { toast } = useToast();
  const { clipboardItem, setClipboardItem, clearClipboard, hasClipboardData } = useClipboard();

  const copyBlock = (block: Bloco & { items: Materia[] }) => {
    if (!currentTelejornal) return;

    const clipboardData: ClipboardBlockData = {
      nome: block.nome,
      items: block.items.map(item => ({
        retranca: item.retranca,
        clip: item.clip,
        duracao: item.duracao,
        texto: item.texto,
        cabeca: item.cabeca,
        status: item.status,
        reporter: item.reporter,
        local_gravacao: item.local_gravacao,
        tags: item.tags,
        equipamento: item.equipamento
      }))
    };

    const clipboardItem: ClipboardItem = {
      id: `block-${Date.now()}`,
      type: 'block',
      data: clipboardData,
      sourceTelejornalId: currentTelejornal.id,
      sourceTelejornalName: currentTelejornal.nome,
      timestamp: Date.now()
    };

    setClipboardItem(clipboardItem);
    toast({
      title: "Bloco copiado",
      description: `Bloco "${block.nome}" com ${block.items.length} matérias foi copiado`,
    });
  };

  const copyMateria = (materia: Materia) => {
    if (!currentTelejornal) return;

    const clipboardData: ClipboardMateriaData = {
      retranca: materia.retranca,
      clip: materia.clip,
      duracao: materia.duracao,
      texto: materia.texto,
      cabeca: materia.cabeca,
      status: materia.status,
      reporter: materia.reporter,
      local_gravacao: materia.local_gravacao,
      tags: materia.tags,
      equipamento: materia.equipamento
    };

    const clipboardItem: ClipboardItem = {
      id: `materia-${Date.now()}`,
      type: 'materia',
      data: clipboardData,
      sourceTelejornalId: currentTelejornal.id,
      sourceTelejornalName: currentTelejornal.nome,
      timestamp: Date.now()
    };

    setClipboardItem(clipboardItem);
    toast({
      title: "Matéria copiada",
      description: `Matéria "${materia.retranca}" foi copiada`,
    });
  };

  const pasteClipboardItem = async () => {
    if (!clipboardItem || !currentTelejornal?.espelho_aberto) {
      toast({
        title: "Erro ao colar",
        description: "Espelho deve estar aberto para colar conteúdo",
        variant: "destructive"
      });
      return;
    }

    try {
      if (clipboardItem.type === 'block') {
        await pasteBlock();
      } else if (clipboardItem.type === 'materia') {
        await pasteMateria();
      }
    } catch (error) {
      console.error("Erro ao colar:", error);
      toast({
        title: "Erro ao colar",
        description: "Não foi possível colar o conteúdo",
        variant: "destructive"
      });
    }
  };

  const pasteBlock = async () => {
    if (!clipboardItem || clipboardItem.type !== 'block' || !currentTelejornal) return;

    const blockData = clipboardItem.data as ClipboardBlockData;
    
    // Determinar nova ordem para o bloco
    const newBlockOrder = blocks.length + 1;
    
    // Criar novo bloco
    const newBlock = await createBloco({
      nome: `${blockData.nome} (Cópia)`,
      telejornal_id: currentTelejornal.id,
      ordem: newBlockOrder
    });

    // Criar todas as matérias do bloco
    const newMaterias: Materia[] = [];
    let currentPage = findHighestPageNumber(blocks) + 1;

    for (let i = 0; i < blockData.items.length; i++) {
      const itemData = blockData.items[i];
      
      const newMateria = await createMateria({
        bloco_id: newBlock.id,
        ordem: i + 1,
        pagina: currentPage.toString(),
        retranca: itemData.retranca,
        clip: itemData.clip || "",
        duracao: itemData.duracao || 0,
        texto: itemData.texto,
        cabeca: itemData.cabeca,
        status: itemData.status || "draft",
        reporter: itemData.reporter
      });

      newMaterias.push(newMateria);
      currentPage++;
    }

    // Atualizar estado local
    const newBlockWithItems = {
      ...newBlock,
      items: newMaterias,
      totalTime: newMaterias.reduce((sum, item) => sum + (item.duracao || 0), 0)
    };

    setBlocks(prevBlocks => [...prevBlocks, newBlockWithItems]);

    toast({
      title: "Bloco colado",
      description: `Bloco "${blockData.nome}" com ${blockData.items.length} matérias foi colado`,
    });

    clearClipboard();
  };

  const pasteMateria = async () => {
    if (!clipboardItem || clipboardItem.type !== 'materia' || !currentTelejornal) return;

    const materiaData = clipboardItem.data as ClipboardMateriaData;
    
    // Se não houver blocos, criar um bloco padrão
    if (blocks.length === 0) {
      const defaultBlock = await createBloco({
        nome: "Bloco 1",
        telejornal_id: currentTelejornal.id,
        ordem: 1
      });

      const newMateria = await createMateria({
        bloco_id: defaultBlock.id,
        ordem: 1,
        pagina: "1",
        retranca: `${materiaData.retranca} (Cópia)`,
        clip: materiaData.clip || "",
        duracao: materiaData.duracao || 0,
        texto: materiaData.texto,
        cabeca: materiaData.cabeca,
        status: materiaData.status || "draft",
        reporter: materiaData.reporter
      });

      const newBlockWithItems = {
        ...defaultBlock,
        items: [newMateria],
        totalTime: newMateria.duracao || 0
      };

      setBlocks([newBlockWithItems]);
    } else {
      // Colar na última posição do primeiro bloco
      const targetBlock = blocks[0];
      const nextPage = findHighestPageNumber(blocks) + 1;

      const newMateria = await createMateria({
        bloco_id: targetBlock.id,
        ordem: targetBlock.items.length + 1,
        pagina: nextPage.toString(),
        retranca: `${materiaData.retranca} (Cópia)`,
        clip: materiaData.clip || "",
        duracao: materiaData.duracao || 0,
        texto: materiaData.texto,
        cabeca: materiaData.cabeca,
        status: materiaData.status || "draft",
        reporter: materiaData.reporter
      });

      // Atualizar estado local
      setBlocks(prevBlocks => 
        prevBlocks.map(block => {
          if (block.id === targetBlock.id) {
            const updatedItems = [...block.items, newMateria];
            return {
              ...block,
              items: updatedItems,
              totalTime: updatedItems.reduce((sum, item) => sum + (item.duracao || 0), 0)
            };
          }
          return block;
        })
      );
    }

    toast({
      title: "Matéria colada",
      description: `Matéria "${materiaData.retranca}" foi colada`,
    });

    clearClipboard();
  };

  return {
    copyBlock,
    copyMateria,
    pasteClipboardItem,
    hasClipboardData,
    clipboardItem
  };
};
