import Link from "next/link";
import Nav from "../components/Nav";
import Countdown from "../components/Countdown";
import PhotoAccessButton from "../components/PhotoAccessButton";

const galleryPreview = ["/memory-1.jpg", "/memory-2.jpg", "/memory-3.jpg"];
const cocktailPreview = [
  { title: "Sunrise", image: "/cocktail-sunrise.jpg", subtitle: "Frutal y refrescante" },
  { title: "Mojito Clásico", image: "/cocktail-mojito-clasico.jpg", subtitle: "Fresco y ligero" },
  { title: "Margarita", image: "/cocktail-margarita.jpg", subtitle: "Cítrica y elegante" }
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
            <PhotoAccessButton />
            <Link className="heroBtnSecondary" href="/galeria">Ver galería</Link>
          </div>
        </div>
      </section>

      <section className="homeSection previewSection photoSection">
        <div className="previewText">
          <p className="sectionLabel">Fotos</p>
          <h2>Comparte tus fotos</h2>
          <p>Queremos seguir guardando juntos recuerdos. Cuando termine la cuenta regresiva podrás compartir cada sonrisa, cada brindis y cada instante especial.</p>
          <PhotoAccessButton className="softPillButton">↥&nbsp; Subir una foto</PhotoAccessButton>
        </div>
        <div className="polaroidWrap">
          <div className="leafDecor left" />
          <div className="leafDecor right" />
          <div className="polaroid p1"><img src="/memory-1.jpg" alt="Recuerdo de Georgia y Paul" /></div>
          <div className="polaroid p2"><img src="/memory-2.jpg" alt="Recuerdo de Georgia y Paul" /></div>
        </div>
      </section>

      <section className="homeSection previewSection">
        <div className="sectionHead">
          <div><p className="sectionLabel">Galería</p><h2>Nuestros momentos</h2></div>
        </div>
        <div className="homeGalleryGrid threeItems">
          {galleryPreview.map((src, index) => (
            <div className="homeGalleryItem" key={src}><img src={src} alt={`Recuerdo ${index + 1}`} /></div>
          ))}
        </div>
      </section>

      <section className="homeSection previewSection drinksPreviewSection">
        <div className="sectionHead drinksHead">
          <div><p className="sectionLabel">Cócteles</p><h2>Nuestras bebidas</h2></div>
          <Link href="/cocteles" className="softTextLink">Ver menú completo →</Link>
        </div>
        <div className="drinkPreviewGrid">
          {cocktailPreview.map((drink) => (
            <div key={drink.title} className="drinkPreviewCard">
              <img className="drinkPreviewPhoto" src={drink.image} alt={drink.title} />
              <h3>{drink.title}</h3><p>{drink.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bartenderEntrySection">
        <p>Equipo de barra</p>
        <Link href="/barra" className="bartenderEntryButton">Acceso Bartenders</Link>
      </section>
      <footer className="homeFooter">G & P · 17 · 10 · 2026</footer>
    </main>
  );
}
