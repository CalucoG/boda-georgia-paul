"use client";

import { useMemo, useState } from "react";
import Nav from "../../components/Nav";

export default function FotosPage() {
  const [file, setFile] = useState(null);
  const [guest, setGuest] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const preview = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);

  async function handleUpload(e) {
    e.preventDefault();
    setStatus("");

    if (!file) {
      setStatus("Selecciona o toma una foto primero.");
      return;
    }

    if (!consent) {
      setStatus("Debes autorizar el envío de la foto.");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("guest", guest.trim());

    try {
      setLoading(true);
      setStatus("Subiendo tu foto...");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: form
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo subir la foto.");
      }

      setStatus("¡Foto enviada! Ya puedes verla en la galería.");
      setFile(null);
      setGuest("");
      setConsent(false);
    } catch (error) {
      setStatus(error.message || "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="innerPage">
      <Nav />
      <section className="contentWrap">
        <div className="pageIntro">
          <p className="sectionLabel">Recuerdos del día</p>
          <h1>Sube tu foto</h1>
          <p>Toma una foto en este instante o selecciona una desde tu galería.</p>
        </div>

        <div className="card">
          <form onSubmit={handleUpload}>
            <label className="cameraBox">
              {preview ? (
                <img src={preview} alt="Vista previa" />
              ) : (
                <div className="cameraEmpty">
                  <span className="cameraIcon">◎</span>
                  <strong>Toca para abrir la cámara</strong>
                  <small>JPG, PNG o WEBP · máximo 8 MB</small>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>

            <label className="field">
              <span>Tu nombre <em>(opcional)</em></span>
              <input
                type="text"
                value={guest}
                onChange={(e) => setGuest(e.target.value)}
                placeholder="Ej. Carlos"
              />
            </label>

            <label className="consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>Autorizo guardar esta foto como recuerdo de la boda.</span>
            </label>

            <button className="mainButton" type="submit" disabled={loading}>
              {loading ? "Subiendo..." : "Subir foto"}
            </button>

            {status && <p className="status">{status}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
