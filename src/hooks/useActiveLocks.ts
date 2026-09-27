import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface LockInfo {
  user_id: string;
  user_name: string;
}

export const useActiveLocks = (telejornalId: string | null) => {
  const [locks, setLocks] = useState<Map<string, LockInfo>>(new Map());
  const prevLocksRef = useRef<Map<string, LockInfo>>(new Map());
  const materiaRetrancaCache = useRef<Map<string, string>>(new Map());
  const { user } = useAuth();

  const fetchLocks = useCallback(async () => {
    if (!telejornalId) {
      setLocks(new Map());
      return;
    }

    const { data: blocos } = await supabase
      .from('blocos')
      .select('id')
      .eq('telejornal_id', telejornalId);

    if (!blocos?.length) {
      setLocks(new Map());
      return;
    }

    const blocoIds = blocos.map(b => b.id);

    const { data: materias } = await supabase
      .from('materias')
      .select('id, retranca')
      .in('bloco_id', blocoIds);

    if (!materias?.length) {
      setLocks(new Map());
      return;
    }

    // Cache retrancas for toast messages
    for (const m of materias) {
      materiaRetrancaCache.current.set(m.id, m.retranca);
    }

    const materiaIds = materias.map(m => m.id);

    const { data: activeLocks } = await supabase
      .from('materias_locks')
      .select('materia_id, user_id')
      .in('materia_id', materiaIds)
      .gt('expires_at', new Date().toISOString());

    if (!activeLocks?.length) {
      setLocks(new Map());
      return;
    }

    const userIds = [...new Set(activeLocks.map(l => l.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p.full_name || 'Usuário']) || []);

    const newLocks = new Map<string, LockInfo>();
    for (const lock of activeLocks) {
      if (lock.user_id === user?.id) continue;
      newLocks.set(lock.materia_id, {
        user_id: lock.user_id,
        user_name: profileMap.get(lock.user_id) || 'Usuário',
      });
    }

    // Detect newly locked matérias and show toast
    const prev = prevLocksRef.current;
    for (const [materiaId, lockInfo] of newLocks) {
      if (!prev.has(materiaId)) {
        const retranca = materiaRetrancaCache.current.get(materiaId) || 'matéria';
        toast.info(`"${retranca}" está sendo editada por ${lockInfo.user_name}`, {
          duration: 4000,
        });
      }
    }
    prevLocksRef.current = newLocks;

    setLocks(newLocks);
  }, [telejornalId, user?.id]);

  useEffect(() => {
    fetchLocks();

    if (!telejornalId) return;

    const channel = supabase
      .channel(`locks-${telejornalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'materias_locks',
        },
        () => {
          fetchLocks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [telejornalId, fetchLocks]);

  const getLockInfo = useCallback(
    (materiaId: string): string | null => {
      const lock = locks.get(materiaId);
      return lock ? lock.user_name : null;
    },
    [locks]
  );

  return { getLockInfo };
};
