/**
 * Graphiques dessinés en SVG, sans dépendance.
 *
 * Règle commune à tous : un jour sans donnée est un trou, jamais un zéro.
 * Les séries reçoivent donc des `null` et les tracés se coupent aux trous.
 */

const L = 320; // largeur du viewBox
const MARGE = { haut: 10, bas: 18, gauche: 30, droite: 6 };

export interface Point {
  /** Étiquette lisible (date ISO, semaine…). */
  cle: string;
  valeur: number | null;
}

function echelle(valeurs: number[]) {
  const min = Math.min(...valeurs);
  const max = Math.max(...valeurs);
  if (min === max) return { min: min - 1, max: max + 1 };
  const marge = (max - min) * 0.15;
  return { min: min - marge, max: max + marge };
}

export function Courbe({
  points,
  hauteur = 120,
  couleur = "var(--graph-bleu)",
  suffixe = "",
}: {
  points: Point[];
  hauteur?: number;
  couleur?: string;
  suffixe?: string;
}) {
  const renseignes = points
    .map((p, index) => ({ ...p, index }))
    .filter((p): p is { cle: string; valeur: number; index: number } =>
      p.valeur != null,
    );

  if (renseignes.length === 0) {
    return <p className="vide">Pas encore de donnée sur cette période.</p>;
  }

  const { min, max } = echelle(renseignes.map((p) => p.valeur));
  const largeurUtile = L - MARGE.gauche - MARGE.droite;
  const hauteurUtile = hauteur - MARGE.haut - MARGE.bas;
  const pasX = points.length > 1 ? largeurUtile / (points.length - 1) : 0;

  const enX = (index: number) => MARGE.gauche + index * pasX;
  const enY = (valeur: number) =>
    MARGE.haut + hauteurUtile * (1 - (valeur - min) / (max - min));

  // Un trait ne relie que des jours consécutifs renseignés.
  const traits: string[] = [];
  let courant: string[] = [];
  let precedent = -2;
  for (const point of renseignes) {
    if (point.index !== precedent + 1 && courant.length > 0) {
      traits.push(courant.join(" "));
      courant = [];
    }
    courant.push(`${enX(point.index)},${enY(point.valeur)}`);
    precedent = point.index;
  }
  if (courant.length > 0) traits.push(courant.join(" "));

  const dernier = renseignes[renseignes.length - 1];

  return (
    <svg
      className="graphique"
      viewBox={`0 0 ${L} ${hauteur}`}
      role="img"
      aria-label={`Série de ${renseignes.length} mesures, de ${Math.round(min)} à ${Math.round(max)}${suffixe}`}
    >
      <line
        x1={MARGE.gauche}
        y1={hauteur - MARGE.bas}
        x2={L - MARGE.droite}
        y2={hauteur - MARGE.bas}
        stroke="var(--bordure)"
        strokeWidth="1"
      />
      {traits.map((trait, i) => (
        <polyline
          key={i}
          points={trait}
          fill="none"
          stroke={couleur}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {renseignes.length === 1 ? (
        <circle
          cx={enX(renseignes[0].index)}
          cy={enY(renseignes[0].valeur)}
          r="3"
          fill={couleur}
        />
      ) : null}
      <circle cx={enX(dernier.index)} cy={enY(dernier.valeur)} r="3" fill={couleur} />
      <text x="0" y={MARGE.haut + 4} className="etiquette-axe">
        {Math.round(max)}
      </text>
      <text x="0" y={hauteur - MARGE.bas} className="etiquette-axe">
        {Math.round(min)}
      </text>
    </svg>
  );
}

export function Barres({
  points,
  hauteur = 120,
  couleur = "var(--graph-aqua)",
}: {
  points: Point[];
  hauteur?: number;
  couleur?: string;
}) {
  const valeurs = points.map((p) => p.valeur ?? 0);
  const max = Math.max(1, ...valeurs);
  const largeurUtile = L - MARGE.gauche - MARGE.droite;
  const hauteurUtile = hauteur - MARGE.haut - MARGE.bas;
  const pas = largeurUtile / points.length;
  const largeurBarre = Math.min(pas * 0.6, 26);

  return (
    <svg
      className="graphique"
      viewBox={`0 0 ${L} ${hauteur}`}
      role="img"
      aria-label={`Barres : ${points.map((p) => `${p.cle} ${p.valeur ?? 0}`).join(", ")}`}
    >
      <line
        x1={MARGE.gauche}
        y1={hauteur - MARGE.bas}
        x2={L - MARGE.droite}
        y2={hauteur - MARGE.bas}
        stroke="var(--bordure)"
        strokeWidth="1"
      />
      {points.map((point, index) => {
        const valeur = point.valeur ?? 0;
        const h = (valeur / max) * hauteurUtile;
        const x = MARGE.gauche + index * pas + (pas - largeurBarre) / 2;
        return (
          <g key={point.cle}>
            <rect
              x={x}
              y={hauteur - MARGE.bas - h}
              width={largeurBarre}
              height={Math.max(h, valeur > 0 ? 2 : 0)}
              rx="3"
              fill={couleur}
            />
            <text
              x={x + largeurBarre / 2}
              y={hauteur - 5}
              textAnchor="middle"
              className="etiquette-axe"
            >
              {point.cle}
            </text>
          </g>
        );
      })}
      <text x="0" y={MARGE.haut + 4} className="etiquette-axe">
        {max}
      </text>
    </svg>
  );
}
