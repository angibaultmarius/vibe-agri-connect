import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { EnregistrerServiceWorker } from "@/components/EnregistrerServiceWorker";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--police-titre",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--police-corps",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--police-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Carnet de Bord",
  description: "Suivi personnel d'habitudes : capteurs, repas, médicament, tabac.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icone-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "Carnet de Bord", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2ECE6" },
    { media: "(prefers-color-scheme: dark)", color: "#211A15" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body
        className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}
      >
        {children}
        <EnregistrerServiceWorker />
      </body>
    </html>
  );
}
