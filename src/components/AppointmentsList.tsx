import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar, Clock, Download, MapPin, RefreshCw, User, X } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Appointment {
  id: string;
  time_slot_id: string;
  table_id: string | null;
  buyer_id: string;
  supplier_id: string;
  status: string;
  notes: string | null;
  time_slots: {
    slot_date: string;
    start_time: string;
    end_time: string;
  };
  meeting_tables: {
    table_number: number;
    location: string | null;
  } | null;
  buyer_profile: {
    full_name: string;
    company: string;
  };
  supplier_profile: {
    full_name: string;
    company: string;
  };
}

interface TimeSlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface AppointmentsListProps {
  userId: string;
  onUpdate?: () => void;
}

const availableDates = [
  new Date(2025, 0, 14),
  new Date(2025, 0, 15),
];

export const AppointmentsList = ({ userId, onUpdate }: AppointmentsListProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  // Reschedule dialog state
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [rescheduleSlot, setRescheduleSlot] = useState<TimeSlot | null>(null);
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        time_slot_id,
        table_id,
        buyer_id,
        supplier_id,
        status,
        notes,
        time_slots (
          slot_date,
          start_time,
          end_time
        ),
        meeting_tables (
          table_number,
          location
        ),
        buyer_profile:profiles!appointments_buyer_id_fkey (
          full_name,
          company
        ),
        supplier_profile:profiles!appointments_supplier_id_fkey (
          full_name,
          company
        )
      `)
      .or(`buyer_id.eq.${userId},supplier_id.eq.${userId}`)
      .order("time_slots(slot_date)", { ascending: true });

    if (error) {
      toast.error("Erreur lors du chargement des rendez-vous");
      console.error(error);
    } else {
      setAppointments(data as any);
    }
    setLoading(false);
  };

  const fetchTimeSlots = async () => {
    const { data } = await supabase
      .from("time_slots")
      .select("*")
      .eq("is_available", true)
      .order("slot_date", { ascending: true })
      .order("start_time", { ascending: true });
    setTimeSlots(data || []);
  };

  useEffect(() => {
    fetchAppointments();
    fetchTimeSlots();

    const channel = supabase
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `buyer_id=eq.${userId}` },
        () => { fetchAppointments(); onUpdate?.(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `supplier_id=eq.${userId}` },
        () => { fetchAppointments(); onUpdate?.(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de l'annulation");
    } else {
      toast.success("Rendez-vous annulé");
      fetchAppointments();
      onUpdate?.();
    }
    setDeleteId(null);
  };

  const openReschedule = (apt: Appointment) => {
    setRescheduleTarget(apt);
    setRescheduleDate(undefined);
    setRescheduleSlot(null);
    setRescheduleNotes(apt.notes || "");
  };

  const handleReschedule = async () => {
    if (!rescheduleTarget || !rescheduleSlot) {
      toast.error("Veuillez sélectionner un nouveau créneau");
      return;
    }

    setRescheduleLoading(true);

    // Conflict check (excluding the current appointment)
    const { data: conflicts } = await supabase
      .from("appointments")
      .select("id")
      .eq("time_slot_id", rescheduleSlot.id)
      .or(
        `buyer_id.eq.${rescheduleTarget.buyer_id},supplier_id.eq.${rescheduleTarget.supplier_id}`
      )
      .neq("id", rescheduleTarget.id);

    if (conflicts && conflicts.length > 0) {
      toast.error("Ce créneau est déjà réservé pour vous ou votre interlocuteur");
      setRescheduleLoading(false);
      return;
    }

    // Find available table for the new slot
    const { data: tables } = await supabase
      .from("meeting_tables")
      .select("id")
      .order("table_number", { ascending: true });

    const { data: existingAppointments } = await supabase
      .from("appointments")
      .select("table_id")
      .eq("time_slot_id", rescheduleSlot.id);

    const usedTableIds = existingAppointments?.map((a) => a.table_id).filter(Boolean) || [];
    const availableTable = tables?.find((t) => !usedTableIds.includes(t.id));

    const { error } = await supabase
      .from("appointments")
      .update({
        time_slot_id: rescheduleSlot.id,
        table_id: availableTable?.id || null,
        notes: rescheduleNotes || null,
      })
      .eq("id", rescheduleTarget.id);

    if (error) {
      toast.error("Erreur lors de la reprogrammation");
      console.error(error);
    } else {
      toast.success("Rendez-vous reprogrammé avec succès !");
      setRescheduleTarget(null);
      fetchAppointments();
      onUpdate?.();
    }

    setRescheduleLoading(false);
  };

  const exportICS = (apt: Appointment) => {
    const isSupplier = apt.supplier_id === userId;
    const other = isSupplier ? apt.buyer_profile : apt.supplier_profile;
    const date = apt.time_slots.slot_date.replace(/-/g, "");
    const start = apt.time_slots.start_time.replace(/:/g, "").slice(0, 4) + "00";
    const end = apt.time_slots.end_time.replace(/:/g, "").slice(0, 4) + "00";
    const table = apt.meeting_tables ? `Table ${apt.meeting_tables.table_number}` : "Table non assignée";

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//VIBE//SIVAL 2025//FR",
      "BEGIN:VEVENT",
      `DTSTART:${date}T${start}`,
      `DTEND:${date}T${end}`,
      `SUMMARY:RDV SIVAL - ${other.full_name} (${other.company})`,
      `DESCRIPTION:Rendez-vous avec ${other.full_name}\\n${other.company}\\n${apt.notes || ""}`,
      `LOCATION:${table}`,
      `UID:vibe-${apt.id}@sival2025`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rdv-${other.full_name.replace(/\s+/g, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredAppointments = appointments.filter((apt) => {
    const slotDate = parseISO(apt.time_slots.slot_date);
    if (filter === "upcoming") return !isPast(slotDate);
    if (filter === "past") return isPast(slotDate);
    return true;
  });

  const rescheduleSlots = rescheduleDate
    ? timeSlots.filter((s) => s.slot_date === format(rescheduleDate, "yyyy-MM-dd"))
    : [];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Filter tabs */}
      {appointments.length > 0 && (
        <div className="mb-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all">Tous ({appointments.length})</TabsTrigger>
              <TabsTrigger value="upcoming">
                À venir ({appointments.filter((a) => !isPast(parseISO(a.time_slots.slot_date))).length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Passés ({appointments.filter((a) => isPast(parseISO(a.time_slots.slot_date))).length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">
            {appointments.length === 0 ? "Aucun rendez-vous pour le moment" : "Aucun rendez-vous dans cette catégorie"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => {
            const isSupplier = appointment.supplier_id === userId;
            const otherProfile = isSupplier
              ? appointment.buyer_profile
              : appointment.supplier_profile;
            const slotDate = parseISO(appointment.time_slots.slot_date);
            const isInPast = isPast(slotDate);

            return (
              <Card key={appointment.id} className={`shadow-soft hover:shadow-medium transition-shadow ${isInPast ? "opacity-70" : ""}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{otherProfile.full_name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{otherProfile.company}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isInPast && <Badge variant="secondary">Passé</Badge>}
                          <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                            {appointment.status === "confirmed" ? "Confirmé" : "En attente"}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>
                            {format(slotDate, "EEEE d MMMM", { locale: fr })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>
                            {appointment.time_slots.start_time.slice(0, 5)} -{" "}
                            {appointment.time_slots.end_time.slice(0, 5)}
                          </span>
                        </div>
                        {appointment.meeting_tables && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>Table {appointment.meeting_tables.table_number}</span>
                          </div>
                        )}
                      </div>

                      {appointment.notes && (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          {appointment.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Exporter en iCal"
                        onClick={() => exportICS(appointment)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {!isInPast && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Reprogrammer"
                          onClick={() => openReschedule(appointment)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Annuler"
                        onClick={() => setDeleteId(appointment.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler le rendez-vous ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le rendez-vous sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Annuler le rendez-vous
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule dialog */}
      <Dialog open={!!rescheduleTarget} onOpenChange={() => setRescheduleTarget(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reprogrammer le rendez-vous</DialogTitle>
            <DialogDescription>
              Choisissez un nouveau créneau pour votre rendez-vous avec{" "}
              {rescheduleTarget
                ? (rescheduleTarget.supplier_id === userId
                    ? rescheduleTarget.buyer_profile.full_name
                    : rescheduleTarget.supplier_profile.full_name)
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Sélectionner une date</Label>
              <div className="flex justify-center mt-2">
                <CalendarComponent
                  mode="single"
                  selected={rescheduleDate}
                  onSelect={setRescheduleDate}
                  disabled={(date) =>
                    !availableDates.some((d) => d.toDateString() === date.toDateString())
                  }
                  className="rounded-md border"
                />
              </div>
            </div>

            {rescheduleDate && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Sélectionner un créneau</Label>
                <div className="grid grid-cols-2 gap-2">
                  {rescheduleSlots.map((slot) => (
                    <Button
                      key={slot.id}
                      variant={rescheduleSlot?.id === slot.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRescheduleSlot(slot)}
                      className="justify-start"
                    >
                      <Clock className="h-3 w-3 mr-2" />
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reschedule-notes">Notes (optionnel)</Label>
              <Textarea
                id="reschedule-notes"
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setRescheduleTarget(null)}>
                Annuler
              </Button>
              <Button onClick={handleReschedule} disabled={!rescheduleSlot || rescheduleLoading}>
                {rescheduleLoading ? "Reprogrammation..." : "Confirmer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
