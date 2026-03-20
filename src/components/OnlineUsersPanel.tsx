import { usePresence, OnlineUser } from "@/hooks/usePresence";
import { useAuth } from "@/context/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const translateRole = (role: string) => {
  const roles: Record<string, string> = {
    editor_chefe: "Editor-chefe",
    editor: "Editor",
    reporter: "Repórter",
    produtor: "Produtor",
  };
  return roles[role] || role;
};

const roleColor = (role: string) => {
  switch (role) {
    case "editor_chefe":
      return "bg-amber-100 text-amber-800";
    case "editor":
      return "bg-blue-100 text-blue-800";
    case "reporter":
      return "bg-emerald-100 text-emerald-800";
    case "produtor":
      return "bg-violet-100 text-violet-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const timeSince = (isoString: string) => {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  return `${hours}h`;
};

export const OnlineUsersPanel = () => {
  const { onlineUsers } = usePresence();
  const { user } = useAuth();

  const count = onlineUsers.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Users className="h-4 w-4" />
          <span className="text-xs font-medium">{count}</span>
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-semibold">
            Usuários online{" "}
            <span className="text-muted-foreground font-normal">({count})</span>
          </p>
        </div>
        <ScrollArea className="max-h-64">
          <div className="py-1">
            {onlineUsers.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                Nenhum usuário online
              </p>
            ) : (
              onlineUsers.map((u) => (
                <UserRow
                  key={u.userId}
                  user={u}
                  isCurrentUser={u.userId === user?.id}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

const UserRow = ({
  user: u,
  isCurrentUser,
}: {
  user: OnlineUser;
  isCurrentUser: boolean;
}) => (
  <div className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors">
    <div className="relative shrink-0">
      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
        {getInitials(u.fullName)}
      </div>
      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium truncate leading-tight">
        {u.fullName}
        {isCurrentUser && (
          <span className="text-muted-foreground font-normal ml-1">(você)</span>
        )}
      </p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleColor(
            u.role
          )}`}
        >
          {translateRole(u.role)}
        </span>
        <span className="text-[10px] text-muted-foreground">
          · {timeSince(u.onlineSince)}
        </span>
      </div>
    </div>
  </div>
);
