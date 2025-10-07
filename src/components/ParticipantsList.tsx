import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Building2, Mail, Phone, User, Calendar, Globe } from "lucide-react";
import { toast } from "sonner";
import { AppointmentBooking } from "./AppointmentBooking";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Clock } from "lucide-react";
import { format } from "date-fns";

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

interface TimeSlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

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

export const ParticipantsList = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserType, setCurrentUserType] = useState<"buyer" | "supplier">("buyer");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const availableDates = [
    new Date(2025, 0, 14), // 14 janvier 2025
    new Date(2025, 0, 15), // 15 janvier 2025
  ];

  useEffect(() => {
    fetchCurrentUser();
    fetchProfiles();
    fetchTimeSlots();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single();
      if (profile) {
        setCurrentUserType(profile.user_type);
      }
    }
  };

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true });

    if (error) {
      toast.error("Erreur lors du chargement des participants");
      console.error(error);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
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
      setTimeSlots(data || []);
    }
  };

  const toggleSector = (sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  const openBookingDialog = (profile: Profile) => {
    setSelectedProfile(profile);
    setSelectedDate(undefined);
    setSelectedSlot(null);
    setNotes("");
    setBookingDialogOpen(true);
  };

  const handleBookingSubmit = async () => {
    if (!selectedProfile || !selectedSlot) {
      toast.error("Veuillez sélectionner un créneau");
      return;
    }

    setBookingLoading(true);

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
      buyer_id: currentUserType === "buyer" ? currentUserId : selectedProfile.id,
      supplier_id: currentUserType === "supplier" ? currentUserId : selectedProfile.id,
      time_slot_id: selectedSlot.id,
      table_id: availableTable?.id || null,
      notes: notes || null,
      status: "confirmed",
      created_by: currentUserId,
    };

    const { error } = await supabase.from("appointments").insert(appointmentData);

    if (error) {
      toast.error("Erreur lors de la création du rendez-vous");
      console.error(error);
    } else {
      toast.success("Rendez-vous créé avec succès !");
      setBookingDialogOpen(false);
      setSelectedProfile(null);
      setSelectedDate(undefined);
      setSelectedSlot(null);
      setNotes("");
    }

    setBookingLoading(false);
  };

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSectors =
      selectedSectors.length === 0 ||
      (p.sectors && p.sectors.some((s) => selectedSectors.includes(s)));

    return matchesSearch && matchesSectors;
  });

  const buyers = filteredProfiles.filter((p) => p.user_type === "buyer");
  const suppliers = filteredProfiles.filter((p) => p.user_type === "supplier");

  const selectedDateSlots = selectedDate
    ? timeSlots.filter(
        (slot) => slot.slot_date === format(selectedDate, "yyyy-MM-dd")
      )
    : [];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderProfileCard = (profile: Profile) => {
    const canBook =
      currentUserId &&
      profile.id !== currentUserId &&
      ((currentUserType === "buyer" && profile.user_type === "supplier") ||
        (currentUserType === "supplier" && profile.user_type === "buyer"));

    return (
      <Card key={profile.id} className="shadow-soft hover:shadow-medium transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
              <AvatarFallback>
                {profile.full_name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{profile.full_name}</h4>
                  <Badge variant="default" className={profile.user_type === "buyer" ? "bg-blue-500" : "bg-green-600"}>
                    {profile.user_type === "buyer" ? "Acheteur" : "Fournisseur"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {profile.company}
                </div>
                {profile.country && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <Globe className="h-3.5 w-3.5" />
                    {profile.country}
                  </div>
                )}
              </div>
              {profile.sectors && profile.sectors.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {profile.sectors.map((sector) => (
                    <Badge key={sector} variant="outline" className="text-xs">
                      {sector}
                    </Badge>
                  ))}
                </div>
              )}
              {canBook && (
                <Button
                  size="sm"
                  onClick={() => openBookingDialog(profile)}
                  className="w-full mt-2"
                >
                  <Calendar className="h-3.5 w-3.5 mr-2" />
                  Prendre rendez-vous
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un participant..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sector filters */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Filtrer par filière</Label>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((sector) => (
              <Badge
                key={sector}
                variant={selectedSectors.includes(sector) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleSector(sector)}
              >
                {sector}
              </Badge>
            ))}
          </div>
          {selectedSectors.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSectors([])}
            >
              Réinitialiser les filtres
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Acheteurs */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Acheteurs internationaux</h3>
              <Badge variant="secondary">{buyers.length}</Badge>
            </div>
            <div className="space-y-3">
              {buyers.map(renderProfileCard)}
            </div>
          </div>

          {/* Fournisseurs */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Fournisseurs de solutions</h3>
              <Badge variant="secondary">{suppliers.length}</Badge>
            </div>
            <div className="space-y-3">
              {suppliers.map(renderProfileCard)}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau rendez-vous</DialogTitle>
            <DialogDescription>
              Prendre rendez-vous avec {selectedProfile?.full_name}
            </DialogDescription>
          </DialogHeader>

          {selectedProfile && (
            <div className="space-y-6">
              {/* Profile Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedProfile.avatar_url || undefined} />
                      <AvatarFallback>
                        {selectedProfile.full_name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedProfile.full_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedProfile.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Date Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">1. Sélectionner une date</Label>
                <div className="flex justify-center">
                  <CalendarComponent
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
              </div>

              {/* Time Slot Selection */}
              {selectedDate && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">2. Sélectionner un créneau</Label>
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
              {selectedSlot && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleBookingSubmit} disabled={bookingLoading}>
                    {bookingLoading ? "Création..." : "Confirmer le rendez-vous"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
