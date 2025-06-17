
import { getMaterialTypeClass } from './NewsItemStyles';

interface MaterialTypeBadgeProps {
  tipoMaterial?: string;
}

export const MaterialTypeBadge = ({ tipoMaterial }: MaterialTypeBadgeProps) => {
  if (!tipoMaterial) {
    return <span className="text-gray-400">-</span>;
  }

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium ${getMaterialTypeClass(tipoMaterial)}`}>
      {tipoMaterial}
    </span>
  );
};
