import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Save } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  company: string;
  user_type: "buyer" | "supplier";
  phone: string | null;
  avatar_url: string | null;
  country: string | null;
  sectors: string[] | null;
}

interface ProfileEditProps {
  profile: Profile;
  onUpdate: () => void;
}

const profileSchema = z.object({
  full_name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
  company: z.string().min(2, "L'entreprise doit faire au moins 2 caractères"),
  phone: z.string().optional(),
  country: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const SECTORS = [
  "Arboriculture",
  "Vegetable Crops",
  "Wine Growing",
  "Mushroom Growing",
  "Seeds and seedlings",
  "Horticulture",
  "Cider Making",
  "New sectors",
  "Scented aromatic and medicinal plants",
];

export const ProfileEdit = ({ profile, onUpdate }: ProfileEditProps) => {
  const [sectors, setSectors] = useState<string[]>(profile.sectors || []);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name,
      company: profile.company,
      phone: profile.phone || "",
      country: profile.country || "",
    },
  });

  const toggleSector = (sector: string) => {
    setSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${profile.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      toast.success("Photo uploadée avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'upload de la photo");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        company: data.company,
        phone: data.phone || null,
        country: data.country || null,
        sectors: sectors.length > 0 ? sectors : null,
        avatar_url: avatarUrl,
      })
      .eq("id", profile.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour du profil");
      console.error(error);
    } else {
      toast.success("Profil mis à jour avec succès");
      onUpdate();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-center">
        <div className="relative">
          <Avatar className="h-32 w-32">
            <AvatarImage src={avatarUrl || undefined} alt={profile.full_name} />
            <AvatarFallback className="text-2xl">
              {profile.full_name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
          >
            <Camera className="h-4 w-4" />
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nom complet</Label>
          <Input id="full_name" {...register("full_name")} />
          {errors.full_name && (
            <p className="text-xs text-destructive">{errors.full_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Entreprise</Label>
          <Input id="company" {...register("company")} />
          {errors.company && (
            <p className="text-xs text-destructive">{errors.company.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile.email} disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" type="tel" placeholder="+33 6 12 34 56 78" {...register("phone")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Pays</Label>
          <Input id="country" placeholder="France" {...register("country")} />
        </div>

        <div className="space-y-2">
          <Label>Filière(s)</Label>
          <div className="grid grid-cols-2 gap-2">
            {SECTORS.map((sector) => (
              <button
                key={sector}
                type="button"
                onClick={() => toggleSector(sector)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors text-left ${
                  sectors.includes(sector)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-input"
                }`}
              >
                {sector}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Type de compte</Label>
          <div className="px-3 py-2 bg-muted rounded-md">
            {profile.user_type === "buyer" ? "Acheteur international" : "Fournisseur de solutions"}
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
      </Button>
    </form>
  );
};
