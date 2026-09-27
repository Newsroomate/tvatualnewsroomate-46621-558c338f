import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bloco, Materia } from "@/types";
import { formatTime, translateStatus } from "./utils";
import { Clock, FileText, AlertTriangle, BarChart3, Layers } from "lucide-react";

type BlockWithItems = Bloco & { items: Materia[]; totalTime: number };

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: BlockWithItems[];
  totalJournalTime: number;
  telejornalNome?: string;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  variant?: "default" | "warning" | "success";
}

const MetricCard = ({ icon, label, value, subtitle, variant = "default" }: MetricCardProps) => {
  const variantStyles = {
    default: "bg-card border-border",
    warning: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
    success: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800",
  };

  return (
    <div className={`rounded-lg border p-4 ${variantStyles[variant]}`}>
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
};

export const DashboardModal = ({
  isOpen,
  onClose,
  blocks,
  totalJournalTime,
  telejornalNome,
}: DashboardModalProps) => {
  const metrics = useMemo(() => {
    const allMaterias = blocks.flatMap((b) => b.items);
    const totalMaterias = allMaterias.length;
    const emptyBlocks = blocks.filter((b) => b.items.length === 0);

    // Status breakdown
    const statusMap = new Map<string, number>();
    allMaterias.forEach((m) => {
      const status = m.status || "draft";
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    // Block breakdown
    const blockBreakdown = blocks.map((b) => ({
      nome: b.nome,
      count: b.items.length,
      time: b.totalTime,
    }));

    return { totalMaterias, emptyBlocks, statusMap, blockBreakdown };
  }, [blocks]);

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    urgent: "bg-destructive/10 text-destructive",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dashboard {telejornalNome ? `— ${telejornalNome}` : ""}
          </DialogTitle>
        </DialogHeader>

        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <MetricCard
            icon={<FileText className="h-4 w-4" />}
            label="Total de Matérias"
            value={metrics.totalMaterias}
            subtitle={`em ${blocks.length} bloco(s)`}
          />
          <MetricCard
            icon={<Clock className="h-4 w-4" />}
            label="Duração Total"
            value={formatTime(totalJournalTime)}
            subtitle="min:seg"
          />
          <MetricCard
            icon={<Layers className="h-4 w-4" />}
            label="Total de Blocos"
            value={blocks.length}
          />
          <MetricCard
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Blocos Vazios"
            value={metrics.emptyBlocks.length}
            variant={metrics.emptyBlocks.length > 0 ? "warning" : "default"}
            subtitle={
              metrics.emptyBlocks.length > 0
                ? metrics.emptyBlocks.map((b) => b.nome).join(", ")
                : "Nenhum"
            }
          />
        </div>

        {/* Status breakdown */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Matérias por Status</h3>
          {metrics.statusMap.size === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma matéria encontrada</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Array.from(metrics.statusMap.entries()).map(([status, count]) => (
                <div
                  key={status}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${statusColors[status] || statusColors.draft}`}
                >
                  <span>{translateStatus(status)}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Block breakdown */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Detalhes por Bloco</h3>
          <div className="space-y-2">
            {metrics.blockBreakdown.map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-foreground">{b.nome}</span>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{b.count} matéria(s)</span>
                  <span className="font-mono">{formatTime(b.time)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
