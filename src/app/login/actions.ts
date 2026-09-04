"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_DUREE_MS,
  comparaisonConstante,
  creerJeton,
} from "@/lib/auth";
import { requireEnv } from "@/lib/env";

export async function seConnecter(_etat: string | null, form: FormData) {
  const saisi = String(form.get("mot_de_passe") ?? "");
  const attendu = requireEnv("APP_PASSWORD");

  // Longueurs différentes = échec immédiat, sinon comparaison à temps constant.
  if (saisi.length !== attendu.length || !comparaisonConstante(saisi, attendu)) {
    return "Mot de passe incorrect.";
  }

  const jeton = await creerJeton(requireEnv("APP_SESSION_SECRET"));
  const magasin = await cookies();
  magasin.set(SESSION_COOKIE, jeton, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DUREE_MS / 1000,
  });
  redirect("/");
}
