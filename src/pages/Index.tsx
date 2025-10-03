import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Users, MapPin, Clock, Sprout, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/10">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-primary to-primary-glow mb-8 shadow-strong">
            <Sprout className="h-12 w-12 text-primary-foreground" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
            VIBE
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
            Plateforme de rendez-vous professionnels
          </p>
          
          <p className="text-lg text-foreground/80 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            Connectez acheteurs internationaux et fournisseurs de solutions agricoles au SIVAL 2025
          </p>
          
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="shadow-strong hover:shadow-medium transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 delay-500"
          >
            Commencer
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Info Cards */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl shadow-medium hover:shadow-strong transition-all duration-300 border border-border">
            <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Dates</h3>
            <p className="text-sm text-muted-foreground">
              Mardi 14 janvier : 14h-18h<br />
              Mercredi 15 janvier : 9h-13h
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl shadow-medium hover:shadow-strong transition-all duration-300 border border-border">
            <div className="p-3 rounded-lg bg-secondary/10 w-fit mb-4">
              <Clock className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Rendez-vous</h3>
            <p className="text-sm text-muted-foreground">
              Créneaux de 30 minutes<br />
              Réservation en ligne
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl shadow-medium hover:shadow-strong transition-all duration-300 border border-border">
            <div className="p-3 rounded-lg bg-accent/10 w-fit mb-4">
              <MapPin className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">40 Tables</h3>
            <p className="text-sm text-muted-foreground">
              Affectation automatique<br />
              Salle principale
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl shadow-medium hover:shadow-strong transition-all duration-300 border border-border">
            <div className="p-3 rounded-lg bg-primary-glow/10 w-fit mb-4">
              <Users className="h-6 w-6 text-primary-glow" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Networking</h3>
            <p className="text-sm text-muted-foreground">
              Acheteurs & Fournisseurs<br />
              Rencontres ciblées
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Une plateforme complète</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow mx-auto flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="font-semibold">Inscription simple</h3>
              <p className="text-sm text-muted-foreground">
                Créez votre profil en quelques clics
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-accent mx-auto flex items-center justify-center">
                <span className="text-xl font-bold text-secondary-foreground">2</span>
              </div>
              <h3 className="font-semibold">Réservation rapide</h3>
              <p className="text-sm text-muted-foreground">
                Choisissez vos créneaux disponibles
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-glow to-accent mx-auto flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">3</span>
              </div>
              <h3 className="font-semibold">Table automatique</h3>
              <p className="text-sm text-muted-foreground">
                Attribution instantanée de votre table
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>VIBE - SIVAL 2025 © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
