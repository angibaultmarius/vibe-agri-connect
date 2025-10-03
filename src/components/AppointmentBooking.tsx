import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Search, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Profile {
  id: string;
  full_name: string;
  company: string;
  user_type: "buyer" | "supplier";
}

interface TimeSlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface AppointmentBookingProps {
  userId: string;
  userType: "buyer" | "supplier";
  onSuccess?: () => void;
}

export const AppointmentBooking = ({ userId, userType, onSuccess }: AppointmentBookingProps) => {
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const targetType = userType === "buyer" ? "supplier" : "buyer";

  useEffect(() => {
    if (open) {
      fetchProfiles();
      fetchTimeSlots();
    }
  }, [open]);

  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, company, user_type")
      .eq("user_type", targetType)
      .neq("id", userId);

    if (error) {
      toast.error("Erreur lors du chargement des profils");
    } else {
      setProfiles(data);
    }
    setLoadingProfiles(false);
  };

  const fetchTimeSlots = async () => {
    const { data, error } = await supabase
      .from("time_slots")
      .select("*")
      .eq("is_available", true)
      .order("slot_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      toast.error("Erreur lors du chargement des créneaux");
    } else {
      setTimeSlots(data);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProfile || !selectedSlot) {
      toast.error("Veuillez sélectionner un participant et un créneau");
      return;
    }

    setLoading(true);

    // Find available table
    const { data: tables } = await supabase
      .from("meeting_tables")
      .select("id")
      .order("table_number", { ascending: true });

    // Get appointments for this time slot
    const { data: existingAppointments } = await supabase
      .from("appointments")
      .select("table_id")
      .eq("time_slot_id", selectedSlot.id);

    const usedTableIds = existingAppointments?.map((a) => a.table_id).filter(Boolean) || [];
    const availableTable = tables?.find((t) => !usedTableIds.includes(t.id));

    const appointmentData = {
      buyer_id: userType === "buyer" ? userId : selectedProfile.id,
      supplier_id: userType === "supplier" ? userId : selectedProfile.id,
      time_slot_id: selectedSlot.id,
      table_id: availableTable?.id || null,
      notes: notes || null,
      status: "confirmed",
      created_by: userId,
    };

    const { error } = await supabase.from("appointments").insert(appointmentData);

    if (error) {
      toast.error("Erreur lors de la création du rendez-vous");
      console.error(error);
    } else {
      toast.success("Rendez-vous créé avec succès !");
      setOpen(false);
      setSelectedProfile(null);
      setSelectedSlot(null);
      setNotes("");
      onSuccess?.();
    }

    setLoading(false);
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedSlots = timeSlots.reduce((acc, slot) => {
    const date = slot.slot_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="lg">
        <Calendar className="mr-2 h-5 w-5" />
        Prendre un rendez-vous
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau rendez-vous</DialogTitle>
            <DialogDescription>
              Sélectionnez un {targetType === "buyer" ? "acheteur" : "fournisseur"} et un créneau
              disponible
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Participant Selection */}
            <div className="space-y-3">
              <Label>
                Sélectionner un {targetType === "buyer" ? "acheteur" : "fournisseur"}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou entreprise..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {loadingProfiles ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {filteredProfiles.map((profile) => (
                    <Card
                      key={profile.id}
                      className={`cursor-pointer transition-all ${
                        selectedProfile?.id === profile.id
                          ? "ring-2 ring-primary shadow-medium"
                          : "hover:shadow-soft"
                      }`}
                      onClick={() => setSelectedProfile(profile)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{profile.full_name}</p>
                            <p className="text-sm text-muted-foreground">{profile.company}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Time Slot Selection */}
            {selectedProfile && (
              <div className="space-y-3">
                <Label>Sélectionner un créneau</Label>
                <div className="space-y-4">
                  {Object.entries(groupedSlots).map(([date, slots]) => (
                    <div key={date} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-4 w-4 text-primary" />
                        {format(new Date(date), "EEEE d MMMM yyyy", { locale: fr })}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {slots.map((slot) => (
                          <Button
                            key={slot.id}
                            variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedSlot(slot)}
                            className="justify-start"
                          >
                            <Clock className="h-3 w-3 mr-2" />
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedSlot && (
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Ajoutez des notes pour ce rendez-vous..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* Submit */}
            {selectedProfile && selectedSlot && (
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Création..." : "Confirmer le rendez-vous"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
