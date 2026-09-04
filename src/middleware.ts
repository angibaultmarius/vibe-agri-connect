import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, jetonValide } from "@/lib/auth";

/**
 * Verrou d'accès : rien n'est lisible sans le mot de passe de l'app.
 * Seules exceptions : la page de connexion et les routes d'ingestion, qui ont
 * leur propre jeton partagé (`Authorization: Bearer …`).
 */
const PUBLIC = ["/login", "/api/ingest", "/manifest.json", "/sw.js", "/icone"];

export async function middleware(request: NextRequest) {
  const chemin = request.nextUrl.pathname;
  if (PUBLIC.some((prefixe) => chemin.startsWith(prefixe))) {
    return NextResponse.next();
  }

  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) {
    // Sans secret configuré, on refuse plutôt que d'ouvrir l'app en grand.
    return new NextResponse(
      "APP_SESSION_SECRET n'est pas configuré. Voir .env.example.",
      { status: 500 },
    );
  }

  const jeton = request.cookies.get(SESSION_COOKIE)?.value;
  if (await jetonValide(jeton, secret)) {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.pathname = "/login";
  destination.search = "";
  return NextResponse.redirect(destination);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
