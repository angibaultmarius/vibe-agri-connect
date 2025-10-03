import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, X } from "lucide-react";
import { format } from "date-fns";
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

interface AppointmentsListProps {
  userId: string;
  onUpdate?: () => void;
}

export const AppointmentsList = ({ userId, onUpdate }: AppointmentsListProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `buyer_id=eq.${userId}`,
        },
        () => {
          fetchAppointments();
          onUpdate?.();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `supplier_id=eq.${userId}`,
        },
        () => {
          fetchAppointments();
          onUpdate?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg">Aucun rendez-vous pour le moment</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {appointments.map((appointment) => {
          const isSupplier = appointment.supplier_id === userId;
          const otherProfile = isSupplier
            ? appointment.buyer_profile
            : appointment.supplier_profile;

          return (
            <Card key={appointment.id} className="shadow-soft hover:shadow-medium transition-shadow">
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
                      <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                        {appointment.status === "confirmed" ? "Confirmé" : "En attente"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>
                          {format(new Date(appointment.time_slots.slot_date), "EEEE d MMMM", {
                            locale: fr,
                          })}
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

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(appointment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
    </>
  );
};
