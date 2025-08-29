
interface TeleprompterWindowHeaderProps {
  telejornalName?: string;
  isFullscreen: boolean;
  isLoading?: boolean;
}

export const TeleprompterWindowHeader = ({ 
  telejornalName, 
  isFullscreen,
  isLoading = false
}: TeleprompterWindowHeaderProps) => {
  if (isFullscreen) return null;

  // Get telejornal name from URL params as fallback
  const urlParams = new URLSearchParams(window.location.search);
  const urlTelejornalName = urlParams.get('jornal');
  
  // Determine display name
  const displayName = telejornalName || urlTelejornalName || (isLoading ? "Conectando..." : "Sem Telejornal Selecionado");

  return (
    <div className="bg-gray-100 border-b p-4">
      <h1 className="text-xl font-bold">
        Teleprompter - {displayName}
      </h1>
    </div>
  );
};
