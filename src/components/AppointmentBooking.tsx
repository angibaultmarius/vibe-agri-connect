import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, Search, User } from "lucide-react";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Profile {
  id: string;
  full_name: string;
  company: string;
  user_type: "buyer" | "supplier";
  avatar_url: string | null;
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const targetType = userType === "buyer" ? "supplier" : "buyer";

  // Available dates for the calendar
  const availableDates = [
    new Date(2025, 0, 14), // 14 janvier 2025
    new Date(2025, 0, 15), // 15 janvier 2025
  ];

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
      .select("id, full_name, company, user_type, avatar_url")
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

    // Conflict detection: check if current user or target already has an appointment at this slot
    const buyerId = userType === "buyer" ? userId : selectedProfile.id;
    const supplierId = userType === "supplier" ? userId : selectedProfile.id;

    const { data: conflicts } = await supabase
      .from("appointments")
      .select("id")
      .eq("time_slot_id", selectedSlot.id)
      .or(`buyer_id.eq.${buyerId},supplier_id.eq.${supplierId}`);

    if (conflicts && conflicts.length > 0) {
      toast.error("Ce créneau est déjà réservé pour vous ou votre interlocuteur");
      setLoading(false);
      return;
    }

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
      buyer_id: buyerId,
      supplier_id: supplierId,
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
      setSelectedDate(undefined);
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

  const selectedDateSlots = selectedDate
    ? timeSlots.filter(
        (slot) => slot.slot_date === format(selectedDate, "yyyy-MM-dd")
      )
    : [];

  return (
    <>
      <Button onClick={() => setOpen(true)} size="lg">
        <CalendarIcon className="mr-2 h-5 w-5" />
        Prendre un rendez-vous
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau rendez-vous</DialogTitle>
            <DialogDescription>
              Sélectionnez un {targetType === "buyer" ? "acheteur" : "fournisseur"}, une date et
              un créneau
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column - Participant Selection */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">
                  1. Sélectionner un {targetType === "buyer" ? "acheteur" : "fournisseur"}
                </Label>
              </div>
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
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
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
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback>
                              {profile.full_name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{profile.full_name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {profile.company}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Date and Time Selection */}
            <div className="space-y-4">
              {selectedProfile && (
                <>
                  <div>
                    <Label className="text-base font-semibold">2. Sélectionner une date</Label>
                  </div>
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) =>
                        !availableDates.some(
                          (d) => d.toDateString() === date.toDateString()
                        )
                      }
                      initialFocus
                      className="rounded-md border"
                    />
                  </div>

                  {selectedDate && (
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">3. Sélectionner un créneau</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedDateSlots.map((slot) => (
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
                  )}
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {selectedSlot && (
            <div className="space-y-2 pt-4 border-t">
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
        </DialogContent>
      </Dialog>
    </>
  );
};