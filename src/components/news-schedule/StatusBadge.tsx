
import { getStatusClass, translateStatus } from './NewsItemStyles';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(status)}`}>
      {translateStatus(status)}
    </span>
  );
};
