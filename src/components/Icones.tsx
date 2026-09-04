/** Icônes au trait, 24×24, héritant de `currentColor`. */

type Props = { className?: string };

const commun = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconeRepas(props: Props) {
  return (
    <svg {...commun} {...props}>
      <path d="M5 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3" />
      <path d="M7 12v9" />
      <path d="M17 3c-1.7 1-2.5 3-2.5 5.5S15.3 13 17 13v8" />
    </svg>
  );
}

export function IconeSport(props: Props) {
  return (
    <svg {...commun} {...props}>
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
    </svg>
  );
}

export function IconeMedicament(props: Props) {
  return (
    <svg {...commun} {...props}>
      <rect x="3" y="8" width="18" height="8" rx="4" />
      <path d="M12 8v8" />
    </svg>
  );
}

export function IconeTabac(props: Props) {
  return (
    <svg {...commun} {...props}>
      <rect x="3" y="13" width="14" height="5" rx="1.5" />
      <path d="M19 13v5M17 6c1.8.6 2.6 1.7 2.5 3.3" />
    </svg>
  );
}

export function IconeAujourdhui(props: Props) {
  return (
    <svg {...commun} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconeJournal(props: Props) {
  return (
    <svg {...commun} {...props}>
      <path d="M5 4h13a1 1 0 0 1 1 1v15H6a1 1 0 0 1-1-1z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

export function IconeTendances(props: Props) {
  return (
    <svg {...commun} {...props}>
      <path d="M4 19V5M4 19h16" />
      <path d="M7.5 15l3.5-4 3 2.5L20 8" />
    </svg>
  );
}

export function IconeCoeur(props: Props) {
  return (
    <svg {...commun} {...props}>
      <path d="M12 19.5S4.5 15 4.5 9.8A3.8 3.8 0 0 1 12 7.7a3.8 3.8 0 0 1 7.5 2.1c0 5.2-7.5 9.7-7.5 9.7z" />
    </svg>
  );
}

export function IconeSommeil(props: Props) {
  return (
    <svg {...commun} {...props}>
      <path d="M19 13.5A7.5 7.5 0 0 1 10.5 5a7.5 7.5 0 1 0 8.5 8.5z" />
    </svg>
  );
}
