
interface StatusDisplayProps {
  status: string;
}

export const StatusDisplay = ({ status }: StatusDisplayProps) => {
  // Status color classes
  const getStatusClass = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Tradução do status para português
  const translateStatus = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'published': return 'Publicado';
      case 'draft': return 'Rascunho';
      case 'pending': return 'Pendente';
      case 'urgent': return 'Urgente';
      default: return status || 'Rascunho';
    }
  };

  const displayStatus = status || "draft";

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(displayStatus)}`}>
      {translateStatus(displayStatus)}
    </span>
  );
};
