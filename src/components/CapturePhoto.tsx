"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconeBascule, IconeFermer, IconeReprendre, IconeValider } from "./pictos";

type Etat = "demarrage" | "cadrage" | "apercu" | "refus";

/**
 * Vue caméra plein écran : viseur, déclencheur, aperçu à valider.
 *
 * Le navigateur peut refuser l'accès à la caméra (permission, contexte non
 * sécurisé, appareil sans caméra) : on bascule alors sur le sélecteur de
 * fichier du système, qui ouvre l'appareil photo sur iOS.
 */
export function CapturePhoto({
  titre,
  onPhoto,
  onAnnuler,
}: {
  titre: string;
  onPhoto: (photo: Blob, apercu: string) => void;
  onAnnuler: () => void;
}) {
  const video = useRef<HTMLVideoElement | null>(null);
  const flux = useRef<MediaStream | null>(null);
  const [etat, setEtat] = useState<Etat>("demarrage");
  const [apercu, setApercu] = useState<string | null>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [face, setFace] = useState<"environment" | "user">("environment");

  const couper = useCallback(() => {
    flux.current?.getTracks().forEach((piste) => piste.stop());
    flux.current = null;
  }, []);

  useEffect(() => {
    let annule = false;

    async function ouvrir() {
      try {
        const obtenu = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: face, width: { ideal: 1920 }, height: { ideal: 1920 } },
          audio: false,
        });
        if (annule) {
          obtenu.getTracks().forEach((piste) => piste.stop());
          return;
        }
        flux.current = obtenu;
        if (video.current) {
          video.current.srcObject = obtenu;
          await video.current.play().catch(() => {});
        }
        setEtat("cadrage");
      } catch {
        setEtat("refus");
      }
    }

    if (!apercu) ouvrir();
    return () => {
      annule = true;
      couper();
    };
  }, [face, apercu, couper]);

  function declencher() {
    const source = video.current;
    if (!source) return;

    const canvas = document.createElement("canvas");
    canvas.width = source.videoWidth;
    canvas.height = source.videoHeight;
    const contexte = canvas.getContext("2d");
    if (!contexte) return;
    contexte.drawImage(source, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        couper();
        setPhoto(blob);
        setApercu(URL.createObjectURL(blob));
        setEtat("apercu");
      },
      "image/jpeg",
      0.9,
    );
  }

  function reprendre() {
    if (apercu) URL.revokeObjectURL(apercu);
    setApercu(null);
    setPhoto(null);
    setEtat("demarrage");
  }

  function valider() {
    if (photo && apercu) onPhoto(photo, apercu);
  }

  function depuisFichier(event: React.ChangeEvent<HTMLInputElement>) {
    const fichier = event.target.files?.[0];
    if (!fichier) return;
    const url = URL.createObjectURL(fichier);
    setPhoto(fichier);
    setApercu(url);
    setEtat("apercu");
  }

  return (
    <div className="camera" role="dialog" aria-modal="true" aria-label={titre}>
      <div className="camera-viseur">
        <div className="camera-entete">
          <button
            type="button"
            className="camera-rond-discret"
            onClick={() => {
              couper();
              onAnnuler();
            }}
            aria-label="Annuler"
          >
            <IconeFermer />
          </button>
          <span className="titre">{titre}</span>
          {etat === "cadrage" ? (
            <button
              type="button"
              className="camera-rond-discret"
              onClick={() => setFace((f) => (f === "environment" ? "user" : "environment"))}
              aria-label="Changer de caméra"
            >
              <IconeBascule />
            </button>
          ) : (
            <span style={{ width: 40 }} />
          )}
        </div>

        {etat === "apercu" && apercu ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={apercu} alt="Aperçu de la photo" />
        ) : etat === "refus" ? (
          <div className="camera-message">
            <p>
              La caméra n&apos;est pas accessible — permission refusée, ou
              navigateur qui ne l&apos;autorise pas ici.
            </p>
            <label className="bouton-principal" style={{ display: "block", textAlign: "center" }}>
              Choisir une photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                capture="environment"
                onChange={depuisFichier}
                style={{ display: "none" }}
              />
            </label>
          </div>
        ) : (
          <>
            <video ref={video} playsInline muted autoPlay />
            <div className="camera-cadre" />
          </>
        )}
      </div>

      <div className="camera-barre">
        {etat === "apercu" ? (
          <>
            <div className="cote">
              <button type="button" className="camera-action reprendre" onClick={reprendre}>
                <IconeReprendre /> Reprendre
              </button>
            </div>
            <div className="cote">
              <button type="button" className="camera-action valider" onClick={valider}>
                <IconeValider /> Utiliser
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="cote" />
            <button
              type="button"
              className="declencheur"
              onClick={declencher}
              disabled={etat !== "cadrage"}
              aria-label="Prendre la photo"
            >
              <span />
            </button>
            <div className="cote" />
          </>
        )}
      </div>
    </div>
  );
}
