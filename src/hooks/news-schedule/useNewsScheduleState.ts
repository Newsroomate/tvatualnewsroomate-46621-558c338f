
import { useState, useRef } from "react";

export const useNewsScheduleState = () => {
  const [totalJournalTime, setTotalJournalTime] = useState(0);
  const [blockCreationAttempted, setBlockCreationAttempted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return {
    totalJournalTime,
    setTotalJournalTime,
    blockCreationAttempted,
    setBlockCreationAttempted,
    scrollContainerRef
  };
};
