import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, User, Phone, Mail } from "lucide-react";
import { searchContatos, ContatoEntrevistado } from "@/services/contatos-entrevistados-api";
import { cn } from "@/lib/utils";

interface EntrevistadosFieldProps {
  value: ContatoEntrevistado[];
  onChange: (contatos: ContatoEntrevistado[]) => void;
  className?: string;
}

export const EntrevistadosField = ({ value, onChange, className }: EntrevistadosFieldProps) => {
  const contatos = value && value.length > 0 ? value : [{ nome: "", telefone: "", email: "" }];

  const updateAt = (index: number, patch: Partial<ContatoEntrevistado>) => {
    const next = [...contatos];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeAt = (index: number) => {
    const next = contatos.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [{ nome: "", telefone: "", email: "" }]);
  };

  const addNew = () => {
    onChange([...contatos, { nome: "", telefone: "", email: "" }]);
  };

  const handleSelectSuggestion = (index: number, suggestion: ContatoEntrevistado) => {
    updateAt(index, {
      nome: suggestion.nome,
      telefone: suggestion.telefone || "",
      email: suggestion.email || "",
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      {contatos.map((contato, idx) => (
        <Card key={idx} className="p-3 space-y-2 bg-muted/30 border-border/60">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              {/* Nome com autocomplete */}
              <NomeAutocomplete
                value={contato.nome}
                onChange={(nome) => updateAt(idx, { nome })}
                onSelect={(s) => handleSelectSuggestion(idx, s)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="relative">
                  <Phone className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={contato.telefone || ""}
                    onChange={(e) => updateAt(idx, { telefone: e.target.value })}
                    placeholder="Telefone"
                    className="pl-7 h-9"
                    type="tel"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={contato.email || ""}
                    onChange={(e) => updateAt(idx, { email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="pl-7 h-9"
                    type="email"
                  />
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => removeAt(idx)}
              title="Remover entrevistado"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addNew}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-1" />
        Adicionar entrevistado
      </Button>
    </div>
  );
};

interface NomeAutocompleteProps {
  value: string;
  onChange: (v: string) => void;
  onSelect: (c: ContatoEntrevistado) => void;
}

const NomeAutocomplete = ({ value, onChange, onSelect }: NomeAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<ContatoEntrevistado[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSearchRef = useRef(false);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await searchContatos(value);
      // Não sugerir o nome exato já digitado
      const filtered = results.filter(
        (r) => r.nome.toLowerCase() !== value.trim().toLowerCase()
      );
      setSuggestions(filtered);
      setOpen(filtered.length > 0);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const handlePick = (s: ContatoEntrevistado) => {
    skipNextSearchRef.current = true;
    onSelect(s);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <User className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Nome do entrevistado"
            className="pl-7 h-9 font-medium"
            autoComplete="off"
          />
        </div>
      </PopoverTrigger>
      {suggestions.length > 0 && (
        <PopoverContent
          className="p-1 w-[var(--radix-popover-trigger-width)]"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="text-xs text-muted-foreground px-2 py-1">
            Contatos salvos
          </div>
          <div className="space-y-0.5 max-h-60 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handlePick(s)}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-accent transition-colors"
              >
                <div className="font-medium text-sm">{s.nome}</div>
                {(s.telefone || s.email) && (
                  <div className="text-xs text-muted-foreground truncate">
                    {[s.telefone, s.email].filter(Boolean).join(" · ")}
                  </div>
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
};
