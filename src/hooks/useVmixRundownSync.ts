import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Materia } from '@/types';
import { VmixSettings, VmixStateResult } from '@/types/vmix';
import { fetchVmixState } from '@/services/vmix-api';
import { updateMateria } from '@/services/materias-update';
import { takeMateria } from '@/services/playout-api';
import { logVmixTrigger } from '@/services/vmix-logs';
import { clearVmixAlertsByKey, notifyVmixRecovered, pushVmixAlert } from '@/services/vmix-alerts';

const CONNECTION_ALERT_KEY = 'vmix-connection';
const STALE_ALERT_KEY = 'vmix-sync-stalled';
const STALE_AFTER_MS = 30000;
/** Nº de leituras seguidas com o mesmo título antes de trocar a matéria no ar (evita "piscadas"). */
const CONFIRMATIONS_REQUIRED = 2;
/** Tempo mínimo no ar para que a matéria anterior seja marcada como publicada. */
const MIN_ON_AIR_MS = 2000;
/** Limite do intervalo quando o vMix não responde (backoff progressivo). */
const MAX_BACKOFF_MS = 15000;

interface UseVmixRundownSyncProps {
  telejornalId?: string | null;
  materias: Materia[];
  settings: VmixSettings;
  enabled: boolean;
  intervalMs?: number;
}

const normalize = (value?: string | null) => (value || '').trim().toLowerCase();

export const useVmixRundownSync = ({
  telejornalId,
  materias,
  settings,
  enabled,
  intervalMs = 3000,
}: UseVmixRundownSyncProps) => {
  const queryClient = useQueryClient();
  const [activeTitle, setActiveTitle] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [onAirMateriaId, setOnAirMateriaId] = useState<string | null>(null);
  const [previewMateriaId, setPreviewMateriaId] = useState<string | null>(null);
  const [onAirSince, setOnAirSince] = useState<Date | null>(null);
  const [isReachable, setIsReachable] = useState<boolean | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  const materiasRef = useRef<Materia[]>(materias);
  materiasRef.current = materias;
  const onAirRef = useRef<string | null>(null);
  const onAirSinceRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const lastOkRef = useRef<number>(Date.now());
  const failuresRef = useRef(0);
  const candidateRef = useRef<{ id: string | null; count: number }>({ id: null, count: 0 });
  const publishedRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Resolve a matéria correspondente ao que está no vMix.
   * Ordem: vínculo explícito (vmix_target) > número da entrada > nome do clip.
   */
  const findMateria = useCallback(
    (title: string | null, inputNumber?: number | null, state?: VmixStateResult) => {
      const list = materiasRef.current;
      const target = normalize(title);

      if (target) {
        const linked = list.find(
          (m) => m.vmix_target && (m.vmix_link_type ?? 'input') === 'input' && normalize(m.vmix_target) === target
        );
        if (linked) return linked;
      }

      if (inputNumber != null) {
        const byNumber = list.find((m) => m.vmix_target && m.vmix_target.trim() === String(inputNumber));
        if (byNumber) return byNumber;
        // vínculo salvo como número mas título informado no estado
        const stateInput = state?.inputs?.find((i) => i.number === inputNumber);
        if (stateInput) {
          const byStateTitle = list.find((m) => m.vmix_target && normalize(m.vmix_target) === normalize(stateInput.title));
          if (byStateTitle) return byStateTitle;
        }
      }

      if (target) {
        // vínculos de playlist/preset continuam válidos quando o alvo bate com o título no ar
        const anyLinked = list.find((m) => m.vmix_target && normalize(m.vmix_target) === target);
        if (anyLinked) return anyLinked;
        const byClip = list.find((m) => m.clip && normalize(m.clip) === target);
        if (byClip) return byClip;
      }

      return null;
    },
    []
  );

  const tick = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    try {
      const state = await fetchVmixState(settings.vmix_host, settings.vmix_port);
      setLastSyncAt(new Date());
      setIsReachable(!!state.reachable);

      if (!state.reachable) {
        failuresRef.current += 1;
        pushVmixAlert({
          kind: 'connection_lost',
          title: `O vMix parou de responder em ${settings.vmix_host}:${settings.vmix_port}`,
          detail: state.message || 'O espelho está sem sincronização com o vMix.',
          dedupeKey: CONNECTION_ALERT_KEY,
        });
        return;
      }

      failuresRef.current = 0;
      lastOkRef.current = Date.now();
      notifyVmixRecovered(CONNECTION_ALERT_KEY, 'Contato com o vMix restabelecido');
      notifyVmixRecovered(STALE_ALERT_KEY, 'Sincronização com o vMix normalizada');

      const title = state.active_title || null;
      setActiveTitle(title);
      setPreviewTitle(state.preview_title || null);

      const preview = findMateria(state.preview_title || null, null, state);
      setPreviewMateriaId(preview?.id || null);

      const current = findMateria(title, state.active_number ?? null, state);
      const currentId = current?.id || null;

      if (currentId === onAirRef.current) {
        candidateRef.current = { id: currentId, count: CONFIRMATIONS_REQUIRED };
        return;
      }

      // Confirmação em leituras consecutivas antes de trocar o que está no ar
      if (candidateRef.current.id === currentId) {
        candidateRef.current.count += 1;
      } else {
        candidateRef.current = { id: currentId, count: 1 };
      }
      if (candidateRef.current.count < CONFIRMATIONS_REQUIRED) return;

      const previousId = onAirRef.current;
      const previousSince = onAirSinceRef.current;
      onAirRef.current = currentId;
      onAirSinceRef.current = currentId ? Date.now() : null;
      setOnAirMateriaId(currentId);
      setOnAirSince(currentId ? new Date() : null);

      let changedStatus = false;

      // A matéria anterior saiu do ar -> marcar como publicada
      if (previousId && !publishedRef.current.has(previousId)) {
        const stayedLongEnough = !previousSince || Date.now() - previousSince >= MIN_ON_AIR_MS;
        const previous = materiasRef.current.find((m) => m.id === previousId);
        if (previous && previous.status !== 'published' && stayedLongEnough) {
          try {
            await updateMateria(previousId, { retranca: previous.retranca, status: 'published' });
            publishedRef.current.add(previousId);
            changedStatus = true;
          } catch (e) {
            const detail = e instanceof Error ? e.message : String(e);
            pushVmixAlert({
              kind: 'trigger_failed',
              title: `Não foi possível marcar "${previous.retranca}" como publicada`,
              detail,
              dedupeKey: `publish-${previousId}`,
            });
            await logVmixTrigger({
              materiaId: previousId,
              materiaRetranca: previous.retranca,
              telejornalId: telejornalId ?? null,
              action: 'auto_sync',
              linkType: previous.vmix_link_type ?? null,
              target: previous.vmix_target || null,
              success: false,
              message: `Saiu do ar, mas o status não pôde ser atualizado: ${previous.retranca}`,
              errorDetail: detail,
              vmixHost: settings.vmix_host,
              vmixPort: settings.vmix_port,
              source: 'auto',
            });
          }
        }
      }

      // Nova matéria no ar
      if (current) {
        publishedRef.current.delete(current.id);
        let errorDetail: string | null = null;
        if (telejornalId) {
          try {
            await takeMateria(telejornalId, current.id);
            changedStatus = true;
          } catch (e) {
            errorDetail = e instanceof Error ? e.message : String(e);
            console.error('Erro ao atualizar playout com a matéria no ar:', e);
          }
        }
        toast.info(`No ar: ${current.retranca}`);
        await logVmixTrigger({
          materiaId: current.id,
          materiaRetranca: current.retranca,
          telejornalId: telejornalId ?? null,
          action: 'auto_sync',
          linkType: current.vmix_link_type ?? null,
          target: current.vmix_target || title,
          success: !errorDetail,
          message: errorDetail
            ? `No ar no vMix, mas o status não pôde ser atualizado: ${current.retranca}`
            : `Entrou no ar: ${current.retranca}`,
          errorDetail,
          vmixHost: settings.vmix_host,
          vmixPort: settings.vmix_port,
          source: 'auto',
        });
      } else if (title) {
        pushVmixAlert({
          kind: 'sync_stalled',
          title: `A entrada no ar "${title}" não está vinculada a nenhuma matéria`,
          detail: 'Vincule a matéria correspondente para que o status seja atualizado sozinho.',
          dedupeKey: `unlinked-${normalize(title)}`,
        });
      }

      if (changedStatus) {
        await queryClient.invalidateQueries({ queryKey: ['blocos'] });
        await queryClient.refetchQueries({ queryKey: ['blocos'] });
      }
    } catch (error) {
      failuresRef.current += 1;
      console.error('Erro na sincronização com o vMix:', error);
      setIsReachable(false);
      pushVmixAlert({
        kind: 'connection_lost',
        title: `Falha ao ler o estado do vMix em ${settings.vmix_host}:${settings.vmix_port}`,
        detail: error instanceof Error ? error.message : String(error),
        dedupeKey: CONNECTION_ALERT_KEY,
      });
    } finally {
      if (Date.now() - lastOkRef.current > STALE_AFTER_MS) {
        pushVmixAlert({
          kind: 'sync_stalled',
          title: 'O espelho está há mais de 30 segundos sem sincronizar com o vMix',
          detail: 'Os status das matérias podem estar desatualizados.',
          dedupeKey: STALE_ALERT_KEY,
        });
      }
      runningRef.current = false;
    }
  }, [findMateria, queryClient, settings.vmix_host, settings.vmix_port, telejornalId]);

  useEffect(() => {
    if (!enabled) {
      onAirRef.current = null;
      onAirSinceRef.current = null;
      candidateRef.current = { id: null, count: 0 };
      publishedRef.current.clear();
      setOnAirMateriaId(null);
      setPreviewMateriaId(null);
      setOnAirSince(null);
      setActiveTitle(null);
      setPreviewTitle(null);
      clearVmixAlertsByKey(CONNECTION_ALERT_KEY);
      clearVmixAlertsByKey(STALE_ALERT_KEY);
      return;
    }

    let cancelled = false;
    lastOkRef.current = Date.now();
    failuresRef.current = 0;

    const schedule = () => {
      if (cancelled) return;
      // Backoff quando o vMix não responde; pausa leve com a aba em segundo plano.
      const backoff = Math.min(intervalMs * Math.max(1, failuresRef.current), MAX_BACKOFF_MS);
      const hidden = typeof document !== 'undefined' && document.hidden;
      const delay = failuresRef.current > 0 ? backoff : hidden ? Math.max(intervalMs, 10000) : intervalMs;
      timerRef.current = setTimeout(run, delay);
    };

    const run = async () => {
      await tick();
      schedule();
    };

    run();

    const onVisible = () => {
      if (!document.hidden && !runningRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);
        run();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener('visibilitychange', onVisible);
      clearVmixAlertsByKey(STALE_ALERT_KEY);
    };
  }, [enabled, intervalMs, tick]);

  return {
    activeTitle,
    previewTitle,
    onAirMateriaId,
    previewMateriaId,
    onAirSince,
    isReachable,
    lastSyncAt,
  };
};
