import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Users, Table, Clock, TrendingUp, Download, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface Stats {
  totalParticipants: number;
  totalBuyers: number;
  totalSuppliers: number;
  totalAppointments: number;
  appointmentsDay1: number;
  appointmentsDay2: number;
  tablesUsed: Set<string>;
}

interface AppointmentDetail {
  id: string;
  buyer_profile: { full_name: string; company: string };
  supplier_profile: { full_name: string; company: string };
  time_slots: { slot_date: string; start_time: string; end_time: string };
  meeting_tables: { table_number: number } | null;
  status: string;
}

export const AdminPanel = () => {
  const [stats, setStats] = useState<Stats>({
    totalParticipants: 0,
    totalBuyers: 0,
    totalSuppliers: 0,
    totalAppointments: 0,
    appointmentsDay1: 0,
    appointmentsDay2: 0,
    tablesUsed: new Set(),
  });
  const [appointments, setAppointments] = useState<AppointmentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "2025-01-14" | "2025-01-15">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchAppointments();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    const { count: totalCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: buyersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("user_type", "buyer");

    const { count: suppliersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("user_type", "supplier");

    const { data: appointmentsData, count: appointmentsCount } = await supabase
      .from("appointments")
      .select("id, table_id, time_slots (slot_date)", { count: "exact" });

    const day1 = appointmentsData?.filter(
      (a: any) => a.time_slots?.slot_date === "2025-01-14"
    ).length;
    const day2 = appointmentsData?.filter(
      (a: any) => a.time_slots?.slot_date === "2025-01-15"
    ).length;

    const tablesUsed = new Set(
      appointmentsData?.map((a: any) => a.table_id).filter(Boolean) || []
    );

    setStats({
      totalParticipants: totalCount || 0,
      totalBuyers: buyersCount || 0,
      totalSuppliers: suppliersCount || 0,
      totalAppointments: appointmentsCount || 0,
      appointmentsDay1: day1 || 0,
      appointmentsDay2: day2 || 0,
      tablesUsed,
    });

    setLoading(false);
  };

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from("appointments")
      .select(
        `
        id,
        status,
        buyer_profile:profiles!appointments_buyer_id_fkey (
          full_name,
          company
        ),
        supplier_profile:profiles!appointments_supplier_id_fkey (
          full_name,
          company
        ),
        time_slots (
          slot_date,
          start_time,
          end_time
        ),
        meeting_tables (
          table_number
        )
      `
      )
      .order("time_slots(slot_date)", { ascending: true });

    setAppointments((data as any) || []);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Rendez-vous supprimé");
      fetchAppointments();
      fetchStats();
    }
    setDeleteId(null);
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.buyer_profile.full_name.toLowerCase().includes(search.toLowerCase()) ||
      apt.buyer_profile.company.toLowerCase().includes(search.toLowerCase()) ||
      apt.supplier_profile.full_name.toLowerCase().includes(search.toLowerCase()) ||
      apt.supplier_profile.company.toLowerCase().includes(search.toLowerCase());

    const matchesDate =
      dateFilter === "all" || apt.time_slots.slot_date === dateFilter;

    return matchesSearch && matchesDate;
  });

  const exportData = () => {
    const csv = [
      ["Date", "Heure", "Acheteur", "Entreprise acheteur", "Fournisseur", "Entreprise fournisseur", "Table", "Statut"],
      ...filteredAppointments.map((apt) => [
        format(new Date(apt.time_slots.slot_date), "dd/MM/yyyy"),
        `${apt.time_slots.start_time.slice(0, 5)} - ${apt.time_slots.end_time.slice(0, 5)}`,
        apt.buyer_profile.full_name,
        apt.buyer_profile.company,
        apt.supplier_profile.full_name,
        apt.supplier_profile.company,
        apt.meeting_tables?.table_number || "Non assignée",
        apt.status,
      ]),
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vibe-rdv-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Participants totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalParticipants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalBuyers} acheteurs • {stats.totalSuppliers} fournisseurs
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rendez-vous</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Jour 1: {stats.appointmentsDay1} • Jour 2: {stats.appointmentsDay2}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tables utilisées</CardTitle>
            <Table className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tablesUsed.size} / 40</div>
            <p className="text-xs text-muted-foreground mt-1">
              {40 - stats.tablesUsed.size} tables disponibles
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux de réservation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalParticipants > 0
                ? Math.round((stats.totalAppointments / stats.totalParticipants) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">RDV par participant</p>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Tous les rendez-vous</CardTitle>
              <CardDescription>
                {filteredAppointments.length} rendez-vous
                {filteredAppointments.length !== appointments.length && ` (filtré sur ${appointments.length})`}
              </CardDescription>
            </div>
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un participant..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as typeof dateFilter)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les jours</SelectItem>
                <SelectItem value="2025-01-14">14 janvier 2025</SelectItem>
                <SelectItem value="2025-01-15">15 janvier 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun rendez-vous trouvé
              </p>
            ) : (
              filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-soft transition-shadow"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium">{apt.buyer_profile.full_name}</p>
                      <p className="text-xs text-muted-foreground">{apt.buyer_profile.company}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{apt.supplier_profile.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {apt.supplier_profile.company}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3 w-3 text-primary" />
                      {format(new Date(apt.time_slots.slot_date), "dd/MM", { locale: fr })} •{" "}
                      {apt.time_slots.start_time.slice(0, 5)}
                    </div>
                    <div className="flex items-center gap-2">
                      {apt.meeting_tables && (
                        <Badge variant="outline">Table {apt.meeting_tables.table_number}</Badge>
                      )}
                      <Badge variant={apt.status === "confirmed" ? "default" : "secondary"}>
                        {apt.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                    onClick={() => setDeleteId(apt.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce rendez-vous ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le rendez-vous sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
