import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, LogOut, Users, User } from "lucide-react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { AppointmentsList } from "@/components/AppointmentsList";
import { AppointmentBooking } from "@/components/AppointmentBooking";
import { AdminPanel } from "@/components/AdminPanel";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  company: string;
  user_type: "buyer" | "supplier";
  phone: string | null;
}

interface UserRole {
  role: "admin" | "user";
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Check if admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      setIsAdmin(!!roleData);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary-glow">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              VIBE
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">{profile?.company}</p>
            </div>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Bienvenue, {profile?.full_name}
          </h2>
          <p className="text-muted-foreground">
            {profile?.user_type === "buyer" ? "Acheteur international" : "Fournisseur de solutions"}
          </p>
        </div>

        <Tabs defaultValue={isAdmin ? "admin" : "appointments"} className="space-y-6">
          <TabsList className="bg-card shadow-soft">
            <TabsTrigger value="appointments">
              <Calendar className="h-4 w-4 mr-2" />
              Mes rendez-vous
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Mon profil
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin">
                <Users className="h-4 w-4 mr-2" />
                Administration
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="appointments" className="space-y-6">
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mes rendez-vous</CardTitle>
                    <CardDescription>
                      Gérez vos rendez-vous pour le SIVAL 2025
                    </CardDescription>
                  </div>
                  {profile && (
                    <AppointmentBooking
                      userId={user!.id}
                      userType={profile.user_type}
                      onSuccess={() => setRefreshKey((k) => k + 1)}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <AppointmentsList
                  key={refreshKey}
                  userId={user!.id}
                  onUpdate={() => setRefreshKey((k) => k + 1)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Mon profil</CardTitle>
                <CardDescription>
                  Informations de votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nom</label>
                  <p className="text-lg">{profile?.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Entreprise</label>
                  <p className="text-lg">{profile?.company}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg">{profile?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="text-lg">
                    {profile?.user_type === "buyer" ? "Acheteur international" : "Fournisseur de solutions"}
                  </p>
                </div>
                {profile?.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                    <p className="text-lg">{profile.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
