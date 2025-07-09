
import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTelejornais, updateTelejornal } from '@/services/api';
import { saveRundownSnapshot } from '@/services/saved-rundowns-api';
import { fetchBlocosByTelejornal, fetchMateriasByBloco } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const useAutoCloseRundowns = () => {
  const lastCheckDateRef = useRef<string>(new Date().toDateString());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: telejornais = [] } = useQuery({
    queryKey: ['telejornais'],
    queryFn: fetchTelejornais,
    refetchInterval: 30000, // Verifica a cada 30 segundos
  });

  const saveRundownBeforeClosing = async (telejornalId: string, telejornalNome: string, isAutomatic: boolean = false) => {
    try {
      console.log(`Salvando snapshot antes de fechar: ${telejornalNome}`, { isAutomatic });
      
      const blocks = await fetchBlocosByTelejornal(telejornalId);
      const blocksWithItems = await Promise.all(
        blocks.map(async (block) => {
          const materias = await fetchMateriasByBloco(block.id);
          return {
            id: block.id,
            nome: block.nome,
            ordem: block.ordem,
            items: materias.map(materia => ({
              id: materia.id,
              retranca: materia.retranca,
              clip: materia.clip,
              duracao: materia.duracao || 0,
              pagina: materia.pagina,
              reporter: materia.reporter,
              status: materia.status,
              texto: materia.texto,
              cabeca: materia.cabeca,
              ordem: materia.ordem
            }))
          };
        })
      );

      // Para fechamento automático, usar data de ontem
      // Para fechamento manual, usar data atual
      let dataReferencia: string;
      
      if (isAutomatic) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const year = yesterday.getFullYear();
        const month = String(yesterday.getMonth() + 1).padStart(2, '0');
        const day = String(yesterday.getDate()).padStart(2, '0');
        dataReferencia = `${year}-${month}-${day}`;
      } else {
        // Fechamento manual: usar data atual do dispositivo
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dataReferencia = `${year}-${month}-${day}`;
      }

      console.log("Saving with date reference:", dataReferencia, { isAutomatic });

      await saveRundownSnapshot({
        telejornal_id: telejornalId,
        data_referencia: dataReferencia,
        nome: telejornalNome,
        estrutura: {
          blocos: blocksWithItems
        }
      });

      console.log(`Snapshot salvo com sucesso para ${telejornalNome}`);
    } catch (error) {
      console.error(`Erro ao salvar snapshot para ${telejornalNome}:`, error);
    }
  };

  const closeRundownAutomatically = async (telejornal: any) => {
    try {
      console.log(`Fechando automaticamente espelho de ${telejornal.nome}`);
      
      // Salvar snapshot antes de fechar (com flag de fechamento automático)
      await saveRundownBeforeClosing(telejornal.id, telejornal.nome, true);
      
      // Fechar o espelho
      await updateTelejornal(telejornal.id, {
        ...telejornal,
        espelho_aberto: false
      });

      console.log(`Espelho de ${telejornal.nome} fechado automaticamente`);
      
      // Mostrar notificação
      toast({
        title: "Espelho fechado automaticamente",
        description: `Espelho de ${telejornal.nome} foi fechado e salvo devido à mudança de data`,
        variant: "default"
      });

    } catch (error) {
      console.error(`Erro ao fechar automaticamente espelho de ${telejornal.nome}:`, error);
    }
  };

  useEffect(() => {
    const checkDateChange = async () => {
      const currentDate = new Date().toDateString();
      
      // Se a data mudou desde a última verificação
      if (currentDate !== lastCheckDateRef.current) {
        console.log('Data mudou! Verificando espelhos abertos para fechamento automático...');
        
        // Encontrar todos os telejornais com espelhos abertos
        const openRundowns = telejornais.filter(tj => tj.espelho_aberto);
        
        if (openRundowns.length > 0) {
          console.log(`Encontrados ${openRundowns.length} espelhos abertos para fechamento automático`);
          
          // Fechar cada espelho aberto
          for (const telejornal of openRundowns) {
            await closeRundownAutomatically(telejornal);
          }
          
          // Invalidar queries para atualizar a UI
          queryClient.invalidateQueries({ queryKey: ['telejornais'] });
          queryClient.invalidateQueries({ queryKey: ['blocos'] });
        }
        
        lastCheckDateRef.current = currentDate;
      }
    };

    // Verificar imediatamente e depois a cada minuto
    checkDateChange();
    const interval = setInterval(checkDateChange, 60000); // Verifica a cada minuto

    return () => clearInterval(interval);
  }, [telejornais, toast, queryClient]);

  return {
    // Função para fechamento manual (sem aplicar data anterior)
    saveRundownBeforeClosing: (telejornalId: string, telejornalNome: string) => 
      saveRundownBeforeClosing(telejornalId, telejornalNome, false),
    
    // Podemos expor funções se necessário no futuro
    forceCloseAllRundowns: async () => {
      const openRundowns = telejornais.filter(tj => tj.espelho_aberto);
      for (const telejornal of openRundowns) {
        await closeRundownAutomatically(telejornal);
      }
      queryClient.invalidateQueries({ queryKey: ['telejornais'] });
    }
  };
};
