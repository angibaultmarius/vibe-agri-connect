import { JournalClient } from "@/components/JournalClient";
import { ilYA } from "@/lib/dates";
import { entrees } from "@/lib/donnees";

export const dynamic = "force-dynamic";

const JOURS_AFFICHES = 60;

export default async function PageJournal() {
  const toutes = await entrees(ilYA(JOURS_AFFICHES), { avecSommeil: true });
  const photos = toutes.filter((e) => e.photoUrl).slice(0, 24);

  return (
    <>
      <header className="entete-ecran">
        <h1>Journal</h1>
        <span className="horodatage">{JOURS_AFFICHES} derniers jours</span>
      </header>

      <JournalClient entrees={toutes} photos={photos} />
    </>
  );
}
