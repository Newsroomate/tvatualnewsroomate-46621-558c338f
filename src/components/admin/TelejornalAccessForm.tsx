import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAllProfiles } from "@/services/telejornal-access-api";
import { fetchTelejornais } from "@/services/telejornais-api";
import { UserRole } from "@/types/auth";
import { TelejornalAccessWithDetails } from "@/services/telejornal-access-api";

interface TelejornalAccessFormProps {
  onSubmit: (data: TelejornalAccessFormData) => void;
  onCancel: () => void;
  initialData?: TelejornalAccessWithDetails;
  isLoading?: boolean;
}

export interface TelejornalAccessFormData {
  user_id: string;
  telejornal_id: string;
  role: UserRole;
}

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "reporter", label: "Repórter" },
  { value: "editor", label: "Editor" },
  { value: "editor_chefe", label: "Editor-chefe" },
  { value: "produtor", label: "Produtor" },
];

export const TelejornalAccessForm = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading,
}: TelejornalAccessFormProps) => {
  const form = useForm<TelejornalAccessFormData>({
    defaultValues: {
      user_id: initialData?.user_id || "",
      telejornal_id: initialData?.telejornal_id || "",
      role: initialData?.role || "reporter",
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchAllProfiles,
  });

  const { data: telejornais } = useQuery({
    queryKey: ["telejornais"],
    queryFn: fetchTelejornais,
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        user_id: initialData.user_id,
        telejornal_id: initialData.telejornal_id,
        role: initialData.role,
      });
    }
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="user_id"
          rules={{ required: "Selecione um usuário" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuário</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!!initialData}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {profiles?.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name || "Sem nome"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telejornal_id"
          rules={{ required: "Selecione um telejornal" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telejornal</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!!initialData}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um telejornal" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {telejornais?.map((telejornal) => (
                    <SelectItem key={telejornal.id} value={telejornal.id}>
                      {telejornal.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          rules={{ required: "Selecione uma permissão" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Permissão</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma permissão" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : initialData ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
