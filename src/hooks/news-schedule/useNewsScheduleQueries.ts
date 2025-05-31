
import { useQuery } from "@tanstack/react-query";
import { fetchBlocosByTelejornal, fetchTelejornais } from "@/services/api";

interface UseNewsScheduleQueriesProps {
  selectedJournal: string | null;
  isDualView: boolean;
}

export const useNewsScheduleQueries = ({
  selectedJournal,
  isDualView
}: UseNewsScheduleQueriesProps) => {
  // Fetch telejornais
  const telejornaisQuery = useQuery({
    queryKey: ['telejornais'],
    queryFn: fetchTelejornais,
  });

  // Fetch blocks for the selected journal (only if not in dual view mode)
  const blocosQuery = useQuery({
    queryKey: ['blocos', selectedJournal],
    queryFn: () => selectedJournal ? fetchBlocosByTelejornal(selectedJournal) : Promise.resolve([]),
    enabled: !!selectedJournal && !isDualView,
  });

  const isLoading = telejornaisQuery.isLoading || (!isDualView && blocosQuery.isLoading);

  return {
    telejornaisQuery,
    blocosQuery,
    isLoading
  };
};
