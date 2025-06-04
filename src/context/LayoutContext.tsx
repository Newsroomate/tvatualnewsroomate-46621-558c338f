
import { createContext, useContext, useState, ReactNode } from "react";
import { Telejornal } from "@/types";

interface LayoutContextType {
  selectedJournal: string | null;
  setSelectedJournal: (journalId: string | null) => void;
  currentTelejornal: Telejornal | null;
  setCurrentTelejornal: (telejornal: Telejornal | null) => void;
  selectedViewDate: Date;
  setSelectedViewDate: (date: Date) => void;
  isDualViewActive: boolean;
  setIsDualViewActive: (active: boolean) => void;
  secondaryJournal: string | null;
  setSecondaryJournal: (journalId: string | null) => void;
  secondaryTelejornal: Telejornal | null;
  setSecondaryTelejornal: (telejornal: Telejornal | null) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayoutContext must be used within a LayoutProvider");
  }
  return context;
};

interface LayoutProviderProps {
  children: ReactNode;
}

export const LayoutProvider = ({ children }: LayoutProviderProps) => {
  const [selectedJournal, setSelectedJournal] = useState<string | null>(null);
  const [currentTelejornal, setCurrentTelejornal] = useState<Telejornal | null>(null);
  const [selectedViewDate, setSelectedViewDate] = useState<Date>(new Date());
  const [isDualViewActive, setIsDualViewActive] = useState(false);
  const [secondaryJournal, setSecondaryJournal] = useState<string | null>(null);
  const [secondaryTelejornal, setSecondaryTelejornal] = useState<Telejornal | null>(null);

  return (
    <LayoutContext.Provider
      value={{
        selectedJournal,
        setSelectedJournal,
        currentTelejornal,
        setCurrentTelejornal,
        selectedViewDate,
        setSelectedViewDate,
        isDualViewActive,
        setIsDualViewActive,
        secondaryJournal,
        setSecondaryJournal,
        secondaryTelejornal,
        setSecondaryTelejornal,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};
