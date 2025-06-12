
interface TeleprompterWindowHeaderProps {
  telejornalName?: string;
  isFullscreen: boolean;
}

export const TeleprompterWindowHeader = ({ 
  telejornalName, 
  isFullscreen 
}: TeleprompterWindowHeaderProps) => {
  if (isFullscreen) return null;

  return (
    <div className="bg-gray-100 border-b p-4">
      <h1 className="text-xl font-bold">
        Teleprompter - {telejornalName || "Sem Telejornal Selecionado"}
      </h1>
    </div>
  );
};
