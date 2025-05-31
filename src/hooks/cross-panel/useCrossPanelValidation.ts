
import { useToast } from "@/hooks/use-toast";

export const useCrossPanelValidation = () => {
  const { toast } = useToast();

  const validateEspelhosOpen = (primaryTelejornal: any, secondaryTelejornal: any): boolean => {
    if (!primaryTelejornal?.espelho_aberto || !secondaryTelejornal?.espelho_aberto) {
      toast({
        title: "Espelhos fechados",
        description: "Ambos os espelhos precisam estar abertos para transferir matérias entre telejornais.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const validateDestination = (destination: any): boolean => {
    return !!destination;
  };

  return {
    validateEspelhosOpen,
    validateDestination
  };
};
