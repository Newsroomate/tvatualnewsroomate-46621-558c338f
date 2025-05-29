
import { generateClipRetrancaPDF } from "@/utils/clip-retranca-pdf-utils";
import { Bloco, Materia, Telejornal } from "@/types";

interface UseNewsScheduleLogicProps {
  currentTelejornal: Telejornal | null;
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  blockManagement: any;
  itemManagement: any;
  teleprompterWindow: any;
}

export const useNewsScheduleLogic = ({
  currentTelejornal,
  blocks,
  scrollContainerRef,
  blockManagement,
  itemManagement,
  teleprompterWindow
}: UseNewsScheduleLogicProps) => {
  const handleViewTeleprompter = () => {
    console.log("Opening teleprompter with blocks:", blocks);
    teleprompterWindow.openTeleprompter(blocks, currentTelejornal);
  };

  const handleExportClipRetranca = () => {
    if (!currentTelejornal || blocks.length === 0) return;
    
    try {
      generateClipRetrancaPDF(blocks, currentTelejornal);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
    }
  };

  // Function to scroll to bottom with smooth animation
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Enhanced handleAddBlock with auto-scroll
  const handleAddBlockWithScroll = async () => {
    const previousBlockCount = blocks.length;
    await blockManagement.handleAddBlock();
    
    setTimeout(() => {
      if (blocks.length > previousBlockCount) {
        scrollToBottom();
      }
    }, 100);
  };

  // Enhanced handleAddFirstBlock with auto-scroll - SEMPRE carrega o último bloco
  const handleAddFirstBlockWithScroll = async () => {
    const previousBlockCount = blocks.length;
    await blockManagement.handleAddFirstBlock();
    
    setTimeout(() => {
      if (blocks.length > previousBlockCount) {
        scrollToBottom();
      }
    }, 100);
  };

  // Enhanced handleAddItem with auto-scroll
  const handleAddItemWithScroll = (blockId: string) => {
    const targetBlock = blocks.find(block => block.id === blockId);
    const previousItemCount = targetBlock?.items.length || 0;
    
    itemManagement.handleAddItem(blockId);
    
    setTimeout(() => {
      const updatedBlock = blocks.find(block => block.id === blockId);
      if (updatedBlock && updatedBlock.items.length > previousItemCount) {
        const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
        if (blockElement && scrollContainerRef.current) {
          blockElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'end',
            inline: 'nearest'
          });
        }
      }
    }, 100);
  };

  return {
    handleViewTeleprompter,
    handleExportClipRetranca,
    handleAddBlockWithScroll,
    handleAddFirstBlockWithScroll,
    handleAddItemWithScroll
  };
};
