
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTelejornais } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeMaterias } from "@/hooks/useRealtimeMaterias";
import { useItemManagement } from "@/hooks/useItemManagement";
import { useBlockManagement } from "@/hooks/useBlockManagement";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useTeleprompterWindow } from "@/hooks/useTeleprompterWindow";
import { Telejornal } from "@/types";

interface UseNewsScheduleStateProps {
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
}

export const useNewsScheduleState = ({
  selectedJournal,
  currentTelejornal
}: UseNewsScheduleStateProps) => {
  const [totalJournalTime, setTotalJournalTime] = useState(0);
  const [blockCreationAttempted, setBlockCreationAttempted] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const { profile } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch telejornais
  const telejornaisQuery = useQuery({
    queryKey: ['telejornais'],
    queryFn: fetchTelejornais,
  });

  // Use our custom hooks for realtime updates and state management
  const { blocks, setBlocks } = useRealtimeMaterias({
    selectedJournal,
    newItemBlock: null,
    materiaToDelete: null
  });

  // Use the custom hooks for item, block, and drag-drop management
  const itemManagement = useItemManagement({ 
    blocks, 
    setBlocks, 
    currentTelejornal 
  });

  const blockManagement = useBlockManagement({ 
    blocks, 
    setBlocks, 
    selectedJournal, 
    currentTelejornal, 
    blocosQuery: telejornaisQuery 
  });

  const { handleDragEnd } = useDragAndDrop({ 
    blocks, 
    setBlocks, 
    isEspelhoAberto: !!currentTelejornal?.espelho_aberto 
  });
  
  const teleprompterWindow = useTeleprompterWindow();

  const isLoading = telejornaisQuery.isLoading;

  return {
    totalJournalTime,
    setTotalJournalTime,
    blockCreationAttempted,
    setBlockCreationAttempted,
    showTeleprompter,
    setShowTeleprompter,
    profile,
    scrollContainerRef,
    telejornaisQuery,
    blocks,
    setBlocks,
    itemManagement,
    blockManagement,
    handleDragEnd,
    teleprompterWindow,
    isLoading
  };
};
