"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconeAccueil, IconeCarnet, IconeCourbe } from "./pictos";

const ONGLETS = [
  { href: "/", libelle: "Aujourd'hui", Icone: IconeAccueil },
  { href: "/journal", libelle: "Journal", Icone: IconeCarnet },
  { href: "/tendances", libelle: "Tendances", Icone: IconeCourbe },
];

export function Navigation() {
  const chemin = usePathname();

  return (
    <nav className="navigation" aria-label="Navigation principale">
      {ONGLETS.map(({ href, libelle, Icone }) => (
        <Link
          key={href}
          href={href}
          aria-current={chemin === href ? "page" : undefined}
        >
          <Icone />
          {libelle}
        </Link>
      ))}
    </nav>
  );
}
