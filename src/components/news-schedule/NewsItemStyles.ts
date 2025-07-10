
// Status color classes
export const getStatusClass = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'published': return 'bg-green-100 text-green-800';
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'urgent': return 'bg-red-100 text-red-800';
    case 'review': return 'bg-blue-100 text-blue-800';
    case 'approved': return 'bg-emerald-100 text-emerald-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Material type color classes - soft and subtle colors
export const getMaterialTypeClass = (tipo: string): string => {
  switch (tipo?.toUpperCase()) {
    case 'VT': return 'bg-red-50 text-red-700 border border-red-200';
    case 'SUP': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    case 'IMG': return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'EST': return 'bg-green-50 text-green-700 border border-green-200';
    case 'LINK': return 'bg-purple-50 text-purple-700 border border-purple-200';
    case 'SELO': return 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'VHT': return 'bg-pink-50 text-pink-700 border border-pink-200';
    case 'SON': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    case 'NET': return 'bg-teal-50 text-teal-700 border border-teal-200';
    case 'NC': return 'bg-gray-50 text-gray-600 border border-gray-200';
    case 'NR': return 'bg-red-100 text-red-800 border border-red-300 font-bold';
    default: return 'bg-gray-50 text-gray-600 border border-gray-200';
  }
};

// Tradução do status para português - incluindo todos os status possíveis
export const translateStatus = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'published': return 'Publicado';
    case 'draft': return 'Rascunho';
    case 'pending': return 'Pendente';
    case 'urgent': return 'Urgente';
    case 'review': return 'Em Revisão';
    case 'approved': return 'Aprovado';
    default: return status || 'Rascunho';
  }
};
