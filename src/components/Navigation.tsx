"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconeAujourdhui, IconeJournal, IconeTendances } from "./Icones";

const ONGLETS = [
  { href: "/", libelle: "Aujourd'hui", Icone: IconeAujourdhui },
  { href: "/journal", libelle: "Journal", Icone: IconeJournal },
  { href: "/tendances", libelle: "Tendances", Icone: IconeTendances },
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
