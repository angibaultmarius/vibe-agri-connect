import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Building2,
  Globe,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const PAGE_SIZE = 10;

const availableDates = [
  new Date(2025, 0, 14),
  new Date(2025, 0, 15),
];

export const ParticipantsList = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"all" | "buyer" | "supplier">("all");
  const [page, setPage] = useState(1);
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

  useEffect(() => {
    fetchCurrentUser();
    fetchProfiles();
    fetchTimeSlots();
  }, []);

  // Reset to page 1 on filter change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedSectors, selectedCountry, selectedType]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single();
      if (profile) setCurrentUserType(profile.user_type);
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
    const { data } = await supabase
      .from("time_slots")
      .select("*")
      .eq("is_available", true)
      .order("slot_date", { ascending: true })
      .order("start_time", { ascending: true });
    setTimeSlots(data || []);
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

    const buyerId = currentUserType === "buyer" ? currentUserId : selectedProfile.id;
    const supplierId = currentUserType === "supplier" ? currentUserId : selectedProfile.id;

    // Conflict detection
    const { data: conflicts } = await supabase
      .from("appointments")
      .select("id")
      .eq("time_slot_id", selectedSlot.id)
      .or(`buyer_id.eq.${buyerId},supplier_id.eq.${supplierId}`);

    if (conflicts && conflicts.length > 0) {
      toast.error("Ce créneau est déjà réservé pour vous ou votre interlocuteur");
      setBookingLoading(false);
      return;
    }

    // Find available table
    const { data: tables } = await supabase
      .from("meeting_tables")
      .select("id")
      .order("table_number", { ascending: true });

    const { data: existingAppointments } = await supabase
      .from("appointments")
      .select("table_id")
      .eq("time_slot_id", selectedSlot.id);

    const usedTableIds = existingAppointments?.map((a) => a.table_id).filter(Boolean) || [];
    const availableTable = tables?.find((t) => !usedTableIds.includes(t.id));

    const { error } = await supabase.from("appointments").insert({
      buyer_id: buyerId,
      supplier_id: supplierId,
      time_slot_id: selectedSlot.id,
      table_id: availableTable?.id || null,
      notes: notes || null,
      status: "confirmed",
      created_by: currentUserId,
    });

    if (error) {
      toast.error("Erreur lors de la création du rendez-vous");
      console.error(error);
    } else {
      toast.success("Rendez-vous créé avec succès !");
      setBookingDialogOpen(false);
    }

    setBookingLoading(false);
  };

  // Derive unique countries for filter
  const countries = Array.from(
    new Set(profiles.map((p) => p.country).filter(Boolean) as string[])
  ).sort();

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSectors =
      selectedSectors.length === 0 ||
      (p.sectors && p.sectors.some((s) => selectedSectors.includes(s)));

    const matchesCountry = selectedCountry === "all" || p.country === selectedCountry;

    const matchesType = selectedType === "all" || p.user_type === selectedType;

    return matchesSearch && matchesSectors && matchesCountry && matchesType;
  });

  const totalPages = Math.ceil(filteredProfiles.length / PAGE_SIZE);
  const paginatedProfiles = filteredProfiles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const buyers = paginatedProfiles.filter((p) => p.user_type === "buyer");
  const suppliers = paginatedProfiles.filter((p) => p.user_type === "supplier");

  const selectedDateSlots = selectedDate
    ? timeSlots.filter((slot) => slot.slot_date === format(selectedDate, "yyyy-MM-dd"))
    : [];

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedSectors([]);
    setSelectedCountry("all");
    setSelectedType("all");
  };

  const hasActiveFilters =
    searchQuery || selectedSectors.length > 0 || selectedCountry !== "all" || selectedType !== "all";

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
                  <Badge
                    variant="default"
                    className={profile.user_type === "buyer" ? "bg-blue-500" : "bg-green-600"}
                  >
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
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un participant..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Type</Label>
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as typeof selectedType)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="buyer">Acheteurs</SelectItem>
                <SelectItem value="supplier">Fournisseurs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {countries.length > 0 && (
            <div className="space-y-1">
              <Label className="text-sm font-medium">Pays</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="self-end">
              Réinitialiser les filtres
            </Button>
          )}
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
        </div>

        {/* Results summary */}
        <p className="text-sm text-muted-foreground">
          {filteredProfiles.length} participant{filteredProfiles.length !== 1 ? "s" : ""} trouvé{filteredProfiles.length !== 1 ? "s" : ""}
        </p>

        {selectedType !== "supplier" && buyers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Acheteurs internationaux</h3>
              <Badge variant="secondary">{buyers.length}</Badge>
            </div>
            <div className="space-y-3">{buyers.map(renderProfileCard)}</div>
          </div>
        )}

        {selectedType !== "buyer" && suppliers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Fournisseurs de solutions</h3>
              <Badge variant="secondary">{suppliers.length}</Badge>
            </div>
            <div className="space-y-3">{suppliers.map(renderProfileCard)}</div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
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

              <div className="space-y-3">
                <Label className="text-base font-semibold">1. Sélectionner une date</Label>
                <div className="flex justify-center">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) =>
                      !availableDates.some((d) => d.toDateString() === date.toDateString())
                    }
                    initialFocus
                    className="rounded-md border"
                  />
                </div>
              </div>

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
