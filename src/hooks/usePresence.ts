import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";
import { playJoinSound, playLeaveSound } from "@/utils/notification-sound";

export interface OnlineUser {
  userId: string;
  fullName: string;
  role: string;
  onlineSince: string;
}

export const usePresence = () => {
  const { user, profile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const previousUsersRef = useRef<Map<string, OnlineUser>>(new Map());
  const isEditorChefe = profile?.role === "editor_chefe";

  useEffect(() => {
    if (!user || !profile) return;

    const presenceChannel = supabase.channel("online-users", {
      config: { presence: { key: user.id } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState<{
          userId: string;
          fullName: string;
          role: string;
          onlineSince: string;
        }>();

        const users: OnlineUser[] = [];
        const seen = new Set<string>();
        const currentIds = new Set<string>();

        for (const key in state) {
          const presences = state[key];
          if (presences && presences.length > 0) {
            const p = presences[0];
            if (!seen.has(p.userId)) {
              seen.add(p.userId);
              currentIds.add(p.userId);
              users.push({
                userId: p.userId,
                fullName: p.fullName,
                role: p.role,
                onlineSince: p.onlineSince,
              });
            }
          }
        }

        // Notify editor_chefe about joins/leaves
        if (isEditorChefe && previousUsersRef.current.size > 0) {
          // New users that joined
          for (const u of users) {
            if (!previousUsersRef.current.has(u.userId) && u.userId !== user.id) {
              toast.info(`${u.fullName} entrou no sistema`, {
                description: `Cargo: ${translateRoleShort(u.role)}`,
                duration: 5000,
              });
            }
          }
          // Users that left
          for (const [prevId, prevUser] of previousUsersRef.current) {
            if (!currentIds.has(prevId) && prevId !== user.id) {
              toast(`${prevUser.fullName} saiu do sistema`, {
                description: `Cargo: ${translateRoleShort(prevUser.role)}`,
                duration: 4000,
              });
            }
          }
        }

        const newMap = new Map<string, OnlineUser>();
        for (const u of users) {
          newMap.set(u.userId, u);
        }
        previousUsersRef.current = newMap;
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            userId: user.id,
            fullName: profile.full_name || user.email || "Usuário",
            role: profile.role,
            onlineSince: new Date().toISOString(),
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
    };
  }, [user?.id, profile?.full_name, profile?.role]);

  return { onlineUsers };
};

const translateRoleShort = (role: string) => {
  const roles: Record<string, string> = {
    editor_chefe: "Editor-chefe",
    editor: "Editor",
    reporter: "Repórter",
    produtor: "Produtor",
  };
  return roles[role] || role;
};
