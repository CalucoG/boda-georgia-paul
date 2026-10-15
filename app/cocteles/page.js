"use client";

import { useEffect, useMemo, useState } from "react";
import Nav from "../../components/Nav";
import { COCKTAILS, WEDDING_CONFIG } from "../../lib/config";

function ensureGuestId() {
  let id = localStorage.getItem("gp_guest_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("gp_guest_id", id);
  }
  return id;
}

const statusLabels = {
  pending: "Pedido recibido",
  preparing: "En preparación",
  delivered: "Entregado",
  cancelled: "Cancelado"
};

const categoryLabelMap = {
  all: "Todos",
  "Clásico": "Clásicos",
  Refrescante: "Refrescantes",
  Tropical: "Tropicales",
  "Sin alcohol": "Sin alcohol"
};

function artClassById(id) {
  return `art-${id}`;
}

export default function CoctelesPage() {
  const [guestId, setGuestId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [selectedId, setSelectedId] = useState("aperol");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [alcoholCount, setAlcoholCount] = useState(0);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    const id = ensureGuestId();
    setGuestId(id);
    setGuestName(localStorage.getItem("gp_guest_name") || "");

    const savedOrderId = localStorage.getItem("gp_current_order");
    if (savedOrderId) {
      setCurrentOrder({ id: savedOrderId, loading: true });
    }
  }, []);

  useEffect(() => {
    if (!currentOrder?.id || !guestId) return;

    let stopped = false;

    async function check() {
      try {
        const res = await fetch(
          `/api/orders/status?orderId=${encodeURIComponent(currentOrder.id)}&guestId=${encodeURIComponent(guestId)}`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 404) {
            localStorage.removeItem("gp_current_order");
            setCurrentOrder(null);
          }
          return;
        }

        if (stopped) return;
        setCurrentOrder(data.order);
        setAlcoholCount(data.alcoholCount || 0);

        if (["delivered", "cancelled"].includes(data.order.status)) {
          localStorage.removeItem("gp_current_order");
        }
      } catch {}
    }

    check();
    const interval = setInterval(check, 3000);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [currentOrder?.id, guestId]);

  const selected = useMemo(
    () => COCKTAILS.find((c) => c.id === selectedId) || COCKTAILS[0],
    [selectedId]
  );

  const categories = ["all", ...Array.from(new Set(COCKTAILS.map((c) => c.type)))];
  const filteredCocktails = category === "all" ? COCKTAILS : COCKTAILS.filter((c) => c.type === category);

  function saveName(value) {
    setGuestName(value);
    localStorage.setItem("gp_guest_name", value);
  }

  async function placeOrder(cocktailIdArg) {
    setMessage("");
    const targetId = cocktailIdArg || selected.id;
    const picked = COCKTAILS.find((c) => c.id === targetId) || selected;
    setSelectedId(picked.id);

    if (!guestName.trim()) {
      setMessage("Escribe tu nombre antes de realizar el pedido.");
      return;
    }

    if (currentOrder && !["delivered", "cancelled"].includes(currentOrder.status)) {
      setMessage("Ya tienes un pedido activo.");
      return;
    }

    try {
      setSending(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId,
          guestName: guestName.trim(),
          cocktailId: picked.id
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.order?.id) {
          localStorage.setItem("gp_current_order", data.order.id);
          setCurrentOrder(data.order);
        }
        setMessage(data.error || "No se pudo realizar el pedido.");
        return;
      }

      localStorage.setItem("gp_current_order", data.order.id);
      setCurrentOrder(data.order);
      setMessage(
        data.responsibleReminder
          ? "Pedido enviado. Te recomendamos alternar con agua o una bebida sin alcohol."
          : "Pedido enviado correctamente."
      );
    } catch {
      setMessage("No se pudo conectar con la barra. Intenta nuevamente.");
    } finally {
      setSending(false);
    }
  }

  function closeFinished() {
    if (currentOrder?.status === "delivered" || currentOrder?.status === "cancelled") {
      setCurrentOrder(null);
      setMessage("");
    }
  }

  const activeOrder = currentOrder && !["delivered", "cancelled"].includes(currentOrder.status);

  return (
    <main className="innerPage cocktailEditorial cocktailPageRedesign">
      <Nav />

      <section className="cocktailShowcaseHero">
        <div className="cocktailShowcaseOverlay" />
        <div className="cocktailShowcaseContent">
          <div>
            <p className="sectionLabel light">Brindemos juntos</p>
            <h1>Nuestros Cócteles</h1>
            <p>Brindemos juntos por esta nueva etapa.</p>
          </div>

          <div className="showcaseBadges">
            <div><span>⚶</span><p>Cócteles de autor</p></div>
            <div><span>❦</span><p>Ingredientes frescos</p></div>
            <div><span>◎</span><p>Servicio ágil</p></div>
            <div><span>♡</span><p>Disfruta con moderación</p></div>
          </div>
        </div>
      </section>

      <section className="contentWrap cocktailNewWrap">
        <div className="guestQuickBar">
          <label className="field compactField">
            <span>Tu nombre</span>
            <input
              value={guestName}
              onChange={(e) => saveName(e.target.value)}
              placeholder="Ej. Carlos"
              maxLength={60}
            />
          </label>
          <div className="miniStats">
            <span><b>{alcoholCount}</b> alcohólicas entregadas</span>
            <span>Espera entre alcohólicos: {WEDDING_CONFIG.alcoholCooldownMinutes} min</span>
          </div>
        </div>

        {currentOrder && (
          <div className={`guestOrderStatus status-${currentOrder.status || "pending"}`}>
            <div>
              <p className="sectionLabel">Pedido actual</p>
              <h3>{currentOrder.code || "…"} · {currentOrder.cocktailName || "Cargando…"}</h3>
              <p>
                {statusLabels[currentOrder.status] || "Consultando pedido"}
                {currentOrder.bartender ? ` · ${currentOrder.bartender}` : ""}
              </p>
            </div>

            {currentOrder.status === "pending" && <div className="orderPulse">En cola</div>}
            {currentOrder.status === "preparing" && <div className="orderPulse preparing">Preparando</div>}
            {["delivered", "cancelled"].includes(currentOrder.status) && (
              <button className="outlineButton" onClick={closeFinished}>Cerrar</button>
            )}
          </div>
        )}

        <div className="filterRow bigFilterRow">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={`filterPill btnPill ${category === item ? "active" : ""}`}
              onClick={() => setCategory(item)}
            >
              {categoryLabelMap[item] || item}
            </button>
          ))}
        </div>

        <div className="cocktailVisualGrid">
          {filteredCocktails.map((item) => (
            <article key={item.id} className={`cocktailVisualCard ${selectedId === item.id ? "selected" : ""}`}>
              <div className={`cocktailVisualArt ${artClassById(item.id)}`} onClick={() => setSelectedId(item.id)}>
                <div className="drinkGlass" />
                {item.id === "aperol" && <div className="garnish orange" />}
                {item.id === "mojito" && <div className="garnish mint" />}
                {item.id === "margarita" && <div className="garnish lime" />}
                {item.id === "gin" && <div className="garnish rosemary" />}
                {item.id === "pina" && <div className="garnish pineapple" />}
                {item.id === "mocktail" && <div className="garnish berries" />}
                {item.id === "agua" && <div className="garnish waterdrop" />}
              </div>
              <div className="cocktailVisualBody">
                <h3>{item.name}</h3>
                <p>{item.ingredients}</p>
                <button
                  type="button"
                  className="softPillButton orderMini"
                  onClick={() => placeOrder(item.id)}
                  disabled={sending || Boolean(activeOrder)}
                >
                  {sending && selectedId === item.id ? "Enviando..." : activeOrder ? "Pedido activo" : "Pedir"}
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="alcoholFreeBox">
          <div>
            <h3>También opciones sin alcohol</h3>
            <p>Deliciosos y refrescantes para todos.</p>
          </div>
          <button type="button" className="outlineButton" onClick={() => setCategory("Sin alcohol")}>Ver opciones sin alcohol →</button>
        </div>

        {message && <p className="status orderStatus">{message}</p>}
      </section>
    </main>
  );
}
