import Link from "next/link";
import Nav from "../components/Nav";
import Countdown from "../components/Countdown";

const galleryPreview = [
  "/home-thumb-1.jpg",
  "/home-thumb-2.jpg",
  "/home-thumb-3.jpg",
  "/home-thumb-4.jpg"
];

const cocktailPreview = [
  { title: "Aperol Spritz", className: "aperol", subtitle: "Ligero y cítrico" },
  { title: "Mojito", className: "mojito", subtitle: "Fresco y herbal" },
  { title: "Margarita", className: "margarita", subtitle: "Clásico y elegante" }
];

export default function Home() {
  return (
    <main className="homePage">
      <Nav transparent />

      <section className="heroPremium">
        <div className="heroOverlay" />
        <div className="heroContent">
          <p className="heroMini">¡Nos Casamos!</p>
          <h1>Georgia & Paul</h1>
          <p className="heroDate">17 · 10 · 2026</p>
          <Countdown />
          <div className="heroButtons">
            <Link className="heroBtnPrimary" href="/fotos">Subir una foto</Link>
            <Link className="heroBtnSecondary" href="/galeria">Ver galería</Link>
          </div>
        </div>
      </section>

      <section className="homeSection previewSection photoSection">
        <div className="previewText">
          <p className="sectionLabel">Fotos</p>
          <h2>Comparte tus fotos</h2>
          <p>Nos encantará ver la boda desde tu perspectiva. Sube tus recuerdos en el instante y ayúdanos a guardar cada momento.</p>
          <Link href="/fotos" className="softPillButton">↥&nbsp; Subir una foto</Link>
        </div>

        <div className="polaroidWrap">
          <div className="leafDecor left" />
          <div className="leafDecor right" />
          <div className="polaroid p1"><img src="/home-thumb-3.jpg" alt="Recuerdo de la boda" /></div>
          <div className="polaroid p2"><img src="/home-thumb-2.jpg" alt="Recuerdo de la boda" /></div>
        </div>
      </section>

      <section className="homeSection previewSection">
        <div className="sectionHead">
          <div>
            <p className="sectionLabel">Galería</p>
            <h2>Nuestros momentos</h2>
          </div>
          <div className="filterRow">
            <span className="filterPill active">Todos</span>
            <span className="filterPill">Ceremonia</span>
            <span className="filterPill">Recepción</span>
            <span className="filterPill">Invitados</span>
          </div>
        </div>

        <div className="homeGalleryGrid">
          {galleryPreview.map((src, index) => (
            <div className="homeGalleryItem" key={src}>
              <img src={src} alt={`Momento ${index + 1}`} />
            </div>
          ))}
        </div>
      </section>

      <section className="homeSection previewSection drinksPreviewSection">
        <div className="sectionHead drinksHead">
          <div>
            <p className="sectionLabel">Cócteles</p>
            <h2>Nuestras bebidas</h2>
          </div>
          <Link href="/cocteles" className="softTextLink">Ver menú completo →</Link>
        </div>

        <div className="drinkPreviewGrid">
          {cocktailPreview.map((drink) => (
            <div key={drink.title} className="drinkPreviewCard">
              <div className={`drinkArt ${drink.className}`}>
                <div className="glassShape" />
              </div>
              <h3>{drink.title}</h3>
              <p>{drink.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="homeFooter">G & P · 17 · 10 · 2026</footer>
    </main>
  );
}
