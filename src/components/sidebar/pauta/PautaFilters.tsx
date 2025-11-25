import { Search, SlidersHorizontal, Calendar as CalendarIcon, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PautaFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: 'date' | 'title' | 'status' | 'reporter';
  onSortChange: (value: 'date' | 'title' | 'status' | 'reporter') => void;
}

export const PautaFilters = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
}: PautaFiltersProps) => {
  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'date': return 'Data';
      case 'title': return 'Título';
      case 'status': return 'Status';
      case 'reporter': return 'Repórter';
      default: return 'Ordenar';
    }
  };

  return (
    <div className="space-y-2 mb-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar pautas..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 pl-8 pr-3 text-xs bg-background/50"
        />
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs flex-1 justify-between bg-background/50"
            >
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3 w-3" />
                <span>{getSortLabel(sortBy)}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-xs">Ordenar por</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => onSortChange(v as any)}>
              <DropdownMenuRadioItem value="date" className="text-xs">
                <CalendarIcon className="h-3 w-3 mr-2" />
                Data de cobertura
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="title" className="text-xs">
                Título (A-Z)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="status" className="text-xs">
                Status
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="reporter" className="text-xs">
                Repórter
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
