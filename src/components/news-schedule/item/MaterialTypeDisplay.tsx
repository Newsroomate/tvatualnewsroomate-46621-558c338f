
interface MaterialTypeDisplayProps {
  tipo: string;
}

export const MaterialTypeDisplay = ({ tipo }: MaterialTypeDisplayProps) => {
  // Material type color classes - soft and subtle colors
  const getMaterialTypeClass = (tipo: string): string => {
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
      default: return 'bg-gray-50 text-gray-600 border border-gray-200';
    }
  };

  return (
    <>
      {tipo ? (
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getMaterialTypeClass(tipo)}`}>
          {tipo}
        </span>
      ) : (
        <span className="text-gray-400">-</span>
      )}
    </>
  );
};
