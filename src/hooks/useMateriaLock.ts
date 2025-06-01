
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MateriaLock {
  id: string;
  materia_id: string;
  user_id: string;
  locked_at: string;
  expires_at: string;
}

interface UseMateriaLockProps {
  materiaId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const useMateriaLock = ({ materiaId, isOpen, onClose }: UseMateriaLockProps) => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockOwner, setLockOwner] = useState<string | null>(null);
  const [isOwnLock, setIsOwnLock] = useState(false);
  const lockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Verificar se a matéria está bloqueada
  const checkLock = async (materiaIdToCheck: string) => {
    try {
      // Primeiro, limpar locks expirados
      await supabase.rpc('cleanup_expired_locks');
      
      const { data, error } = await supabase
        .from('materias_locks')
        .select('*')
        .eq('materia_id', materiaIdToCheck)
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar lock:', error);
        return { isLocked: false, isOwnLock: false, lockOwner: null };
      }

      if (data) {
        const currentUserId = (await supabase.auth.getUser()).data.user?.id;
        const isOwn = data.user_id === currentUserId;
        
        return {
          isLocked: true,
          isOwnLock: isOwn,
          lockOwner: data.user_id
        };
      }

      return { isLocked: false, isOwnLock: false, lockOwner: null };
    } catch (error) {
      console.error('Erro ao verificar lock:', error);
      return { isLocked: false, isOwnLock: false, lockOwner: null };
    }
  };

  // Criar um lock para a matéria
  const createLock = async (materiaIdToLock: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('materias_locks')
        .insert({
          materia_id: materiaIdToLock,
          user_id: user.user.id
        });

      if (error) {
        console.error('Erro ao criar lock:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao criar lock:', error);
      return false;
    }
  };

  // Remover o lock da matéria
  const removeLock = async (materiaIdToUnlock: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('materias_locks')
        .delete()
        .eq('materia_id', materiaIdToUnlock)
        .eq('user_id', user.user.id);

      if (error) {
        console.error('Erro ao remover lock:', error);
      }
    } catch (error) {
      console.error('Erro ao remover lock:', error);
    }
  };

  // Verificação silenciosa em segundo plano quando o modal abrir
  useEffect(() => {
    const acquireLock = async () => {
      if (!materiaId || !isOpen) return;

      // Verificação rápida e silenciosa
      const lockStatus = await checkLock(materiaId);
      
      if (lockStatus.isLocked && !lockStatus.isOwnLock) {
        setIsLocked(true);
        setLockOwner(lockStatus.lockOwner);
        setIsOwnLock(false);
        
        toast({
          title: "Matéria em edição",
          description: "Esta matéria está sendo editada por outro usuário.",
          variant: "destructive"
        });
        return;
      }

      if (lockStatus.isLocked && lockStatus.isOwnLock) {
        setIsLocked(true);
        setIsOwnLock(true);
        setLockOwner(lockStatus.lockOwner);
        return;
      }

      // Tentar criar o lock
      const lockCreated = await createLock(materiaId);
      
      if (lockCreated) {
        setIsLocked(true);
        setIsOwnLock(true);
        setLockOwner((await supabase.auth.getUser()).data.user?.id || null);
        
        // Configurar renovação automática do lock a cada 15 minutos
        lockIntervalRef.current = setInterval(async () => {
          const { error } = await supabase
            .from('materias_locks')
            .update({ expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() })
            .eq('materia_id', materiaId)
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
          
          if (error) {
            console.error('Erro ao renovar lock:', error);
          }
        }, 15 * 60 * 1000); // 15 minutos
      } else {
        // Tentar verificar novamente se alguém criou o lock no meio tempo
        const newLockStatus = await checkLock(materiaId);
        setIsLocked(newLockStatus.isLocked);
        setIsOwnLock(newLockStatus.isOwnLock);
        setLockOwner(newLockStatus.lockOwner);
        
        if (newLockStatus.isLocked && !newLockStatus.isOwnLock) {
          toast({
            title: "Matéria em edição",
            description: "Esta matéria está sendo editada por outro usuário.",
            variant: "destructive"
          });
        }
      }
    };

    acquireLock();
  }, [materiaId, isOpen]);

  // Remover o lock quando o modal fechar
  useEffect(() => {
    return () => {
      if (materiaId && isOwnLock) {
        removeLock(materiaId);
      }
      
      if (lockIntervalRef.current) {
        clearInterval(lockIntervalRef.current);
        lockIntervalRef.current = null;
      }
    };
  }, [materiaId, isOwnLock, isOpen]);

  // Subscription para mudanças nos locks em tempo real
  useEffect(() => {
    if (!materiaId) return;

    const channel = supabase
      .channel(`materia-lock-${materiaId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'materias_locks',
        filter: `materia_id=eq.${materiaId}`
      }, async (payload) => {
        console.log('Lock change detected:', payload);
        
        if (payload.eventType === 'DELETE') {
          setIsLocked(false);
          setIsOwnLock(false);
          setLockOwner(null);
        } else if (payload.eventType === 'INSERT') {
          const newLock = payload.new as MateriaLock;
          const currentUserId = (await supabase.auth.getUser()).data.user?.id;
          const isOwn = newLock.user_id === currentUserId;
          
          setIsLocked(true);
          setIsOwnLock(isOwn);
          setLockOwner(newLock.user_id);
          
          if (!isOwn && isOpen) {
            toast({
              title: "Matéria bloqueada",
              description: "Esta matéria foi bloqueada para edição por outro usuário.",
              variant: "destructive"
            });
            onClose();
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [materiaId, isOpen, onClose]);

  return {
    isLocked,
    isOwnLock,
    lockOwner,
    canEdit: isOwnLock || !isLocked
  };
};
