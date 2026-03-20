import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";

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

        for (const key in state) {
          const presences = state[key];
          if (presences && presences.length > 0) {
            const p = presences[0];
            if (!seen.has(p.userId)) {
              seen.add(p.userId);
              users.push({
                userId: p.userId,
                fullName: p.fullName,
                role: p.role,
                onlineSince: p.onlineSince,
              });
            }
          }
        }

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
