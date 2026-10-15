"use client";

import { useEffect, useState } from "react";
import Nav from "../../components/Nav";

export default function GaleriaPage() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function loadPhotos() {
      try {
        const response = await fetch("/api/photos", { cache: "no-store" });
        const data = await response.json();
        setPhotos(data.photos || []);
      } finally {
        setLoading(false);
      }
    }
    loadPhotos();
  }, []);

  return (
    <main className="innerPage">
      <Nav />
      <section className="contentWrap">
        <div className="pageIntro">
          <p className="sectionLabel">Momentos compartidos</p>
          <h1>Galería</h1>
          <p>Aquí aparecerán las fotos subidas por sus invitados.</p>
        </div>

        {loading ? (
          <div className="emptyState">Cargando galería...</div>
        ) : photos.length === 0 ? (
          <div className="emptyState">
            <div>
              <h3>Aún no hay fotos</h3>
              <p>Las fotos aparecerán aquí cuando los invitados las suban.</p>
            </div>
          </div>
        ) : (
          <div className="galleryGrid">
            {photos.map((photo) => (
              <button
                key={photo.url}
                className="galleryItem"
                onClick={() => setSelected(photo.url)}
              >
                <img src={photo.url} alt="Foto de la boda" />
              </button>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <div className="lightbox" onClick={() => setSelected(null)}>
          <button className="closeLightbox" onClick={() => setSelected(null)}>×</button>
          <img src={selected} alt="Foto ampliada" />
        </div>
      )}
    </main>
  );
}
