import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Stethoscope, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { runVmixDiagnostics } from '@/services/vmix-api';
import { VmixDiagnosticsResult } from '@/types/vmix';

interface VmixDiagnosticsPanelProps {
  host: string;
  port: number;
  inputName: string;
  overlayNumber: number;
}

type CheckStatus = 'ok' | 'fail' | 'warn';

const StatusIcon = ({ status }: { status: CheckStatus }) => {
  if (status === 'ok') return <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />;
  if (status === 'warn') return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
  return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
};

export const VmixDiagnosticsPanel = ({ host, port, inputName, overlayNumber }: VmixDiagnosticsPanelProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<VmixDiagnosticsResult | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    setFailed(null);
    try {
      const data = await runVmixDiagnostics(host, port, inputName, overlayNumber);
      setResult(data);
    } catch (error) {
      setResult(null);
      setFailed(error instanceof Error ? error.message : 'Não foi possível executar o diagnóstico.');
    } finally {
      setIsRunning(false);
    }
  };

  const checks: { label: string; detail: string; status: CheckStatus }[] = [];

  if (result) {
    checks.push({
      label: 'Endereço do vMix respondendo',
      detail: result.reachable
        ? `${host}:${port} respondeu em ${result.latency_ms ?? 0} ms`
        : result.message,
      status: result.reachable ? 'ok' : 'fail',
    });

    if (result.reachable) {
      checks.push({
        label: 'Versão do vMix',
        detail: result.version ? `${result.version}${result.edition ? ` · ${result.edition}` : ''}` : 'Não informada',
        status: result.version ? 'ok' : 'warn',
      });

      checks.push({
        label: `Tela "${inputName}" encontrada no vMix`,
        detail: result.input_found
          ? 'A tela existe e está pronta para receber textos.'
          : `Não encontrei "${inputName}" entre as telas abertas no vMix.`,
        status: result.input_found ? 'ok' : 'fail',
      });

      checks.push({
        label: `Sobreposição ${overlayNumber} disponível`,
        detail: result.overlay_available
          ? 'Pode colocar e tirar do ar por essa sobreposição.'
          : 'Confira o número da sobreposição no vMix.',
        status: result.overlay_available ? 'ok' : 'warn',
      });
    }

    if (result.private_host) {
      checks.push({
        label: 'Endereço acessível pela internet',
        detail: 'O endereço informado é de rede interna e só funciona dentro da emissora.',
        status: result.reachable ? 'warn' : 'fail',
      });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Stethoscope className="h-3.5 w-3.5 text-primary" />
          Diagnóstico da conexão
        </h4>
        <Button variant="outline" size="sm" onClick={handleRun} disabled={isRunning}>
          {isRunning ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : null}
          Verificar tudo
        </Button>
      </div>

      {failed && (
        <Alert variant="destructive">
          <AlertDescription className="text-xs">{failed}</AlertDescription>
        </Alert>
      )}

      {!result && !failed && (
        <p className="text-[11px] text-muted-foreground">
          Clique em "Verificar tudo" para conferir o endereço, a tela de GC e a sobreposição configurados aqui.
        </p>
      )}

      {checks.length > 0 && (
        <div className="space-y-2 rounded-lg border p-3">
          {checks.map((check) => (
            <div key={check.label} className="flex items-start gap-2">
              <StatusIcon status={check.status} />
              <div className="space-y-0.5">
                <p className="text-xs font-medium leading-none">{check.label}</p>
                <p className="text-[11px] text-muted-foreground">{check.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {result?.reachable && result.inputs && result.inputs.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] text-muted-foreground">Telas abertas no vMix agora:</span>
          <div className="flex flex-wrap gap-1">
            {result.inputs.slice(0, 20).map((name, i) => (
              <Badge key={`${name}-${i}`} variant="secondary" className="text-[10px] font-normal">
                {name || 'sem nome'}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {result?.private_host && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle className="text-xs">Esse endereço é só da rede interna</AlertTitle>
          <AlertDescription className="text-[11px] space-y-1">
            <p>
              Endereços que começam com 192.168, 10. ou 172.16 só existem dentro da emissora, então o sistema na
              internet não consegue falar com o vMix.
            </p>
            <p>Para funcionar de qualquer lugar, peça ao responsável pela rede um destes caminhos:</p>
            <ul className="list-disc pl-4">
              <li>liberar o acesso externo à porta {port} do computador do vMix e usar o endereço fixo da emissora;</li>
              <li>ou criar um túnel/VPN que dê um endereço público para esse computador.</li>
            </ul>
            <p>Dentro da emissora, na mesma rede, o endereço atual continua funcionando.</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
