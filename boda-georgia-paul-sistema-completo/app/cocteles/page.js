"use client";
import { useEffect, useMemo, useState } from "react";
import Nav from "../../components/Nav";
import { COCKTAILS, WEDDING_CONFIG } from "../../lib/config";

function ensureGuestId() {
  let id = localStorage.getItem("gp_guest_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("gp_guest_id", id); }
  return id;
}
const statusLabels = { pending: "Pedido recibido", preparing: "En preparación", delivered: "Entregado", cancelled: "Cancelado" };

export default function CoctelesPage() {
  const [guestId, setGuestId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [selectedId, setSelectedId] = useState(COCKTAILS[0].id);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [alcoholCount, setAlcoholCount] = useState(0);

  useEffect(() => {
    const id = ensureGuestId(); setGuestId(id);
    setGuestName(localStorage.getItem("gp_guest_name") || "");
    const saved = localStorage.getItem("gp_current_order");
    if (saved) setCurrentOrder({ id: saved, loading: true });
  }, []);

  useEffect(() => {
    if (!currentOrder?.id || !guestId) return;
    let stopped = false;
    async function check() {
      try {
        const res = await fetch(`/api/orders/status?orderId=${encodeURIComponent(currentOrder.id)}&guestId=${encodeURIComponent(guestId)}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 404) { localStorage.removeItem("gp_current_order"); setCurrentOrder(null); }
          return;
        }
        if (stopped) return;
        setCurrentOrder(data.order); setAlcoholCount(data.alcoholCount || 0);
        if (["delivered", "cancelled"].includes(data.order.status)) localStorage.removeItem("gp_current_order");
      } catch {}
    }
    check(); const timer = setInterval(check, 5000);
    return () => { stopped = true; clearInterval(timer); };
  }, [currentOrder?.id, guestId]);

  const selected = useMemo(() => COCKTAILS.find(c => c.id === selectedId) || COCKTAILS[0], [selectedId]);
  function saveName(v) { setGuestName(v); localStorage.setItem("gp_guest_name", v); }

  async function placeOrder(cocktailId = selected.id) {
    setMessage(""); const picked = COCKTAILS.find(c => c.id === cocktailId) || selected; setSelectedId(picked.id);
    if (!guestName.trim()) return setMessage("Escribe tu nombre antes de realizar el pedido.");
    if (currentOrder && !["delivered", "cancelled"].includes(currentOrder.status)) return setMessage("Ya tienes un pedido activo.");
    try {
      setSending(true);
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guestId, guestName: guestName.trim(), cocktailId: picked.id }) });
      const data = await res.json();
      if (!res.ok) {
        if (data.order?.id) { localStorage.setItem("gp_current_order", data.order.id); setCurrentOrder(data.order); }
        return setMessage(data.error || "No se pudo realizar el pedido.");
      }
      localStorage.setItem("gp_current_order", data.order.id); setCurrentOrder(data.order);
      setMessage(data.responsibleReminder ? "Pedido enviado. Considera alternar con agua antes del siguiente cóctel." : "Pedido enviado correctamente.");
    } catch { setMessage("No se pudo conectar con la barra. Intenta nuevamente."); }
    finally { setSending(false); }
  }

  const activeOrder = currentOrder && !["delivered", "cancelled"].includes(currentOrder.status);
  return (
    <main className="innerPage cocktailPageReal">
      <Nav />
      <section className="cocktailRealHero">
        <div className="cocktailRealTitle"><p className="sectionLabel light">Cócteles</p><h1>Nuestros Cócteles</h1><p>Brindemos juntos por esta nueva etapa.</p></div>
        <div className="cocktailBannerGrid">
          {[1,2,3,4].map(n => <img key={n} src={`/bar-real-${n}.jpg`} alt="Barra de cócteles" />)}
        </div>
      </section>

      <section className="contentWrap cocktailNewWrap">
        <div className="guestQuickBar">
          <label className="field compactField"><span>Tu nombre</span><input value={guestName} onChange={e => saveName(e.target.value)} placeholder="Ej. Carlos" maxLength={60} /></label>
          <div className="miniStats"><span><b>{alcoholCount}</b> bebidas alcohólicas entregadas</span><span>Espera: {WEDDING_CONFIG.alcoholCooldownMinutes} min entre pedidos alcohólicos</span></div>
        </div>

        {currentOrder && <div className={`guestOrderStatus status-${currentOrder.status || "pending"}`}>
          <div><p className="sectionLabel">Pedido actual</p><h3>{currentOrder.code || "…"} · {currentOrder.cocktailName || "Cargando…"}</h3><p>{statusLabels[currentOrder.status] || "Consultando pedido"}{currentOrder.bartender ? ` · ${currentOrder.bartender}` : ""}</p></div>
          {currentOrder.status === "pending" && <div className="orderPulse">En cola</div>}
          {currentOrder.status === "preparing" && <div className="orderPulse preparing">Preparando</div>}
          {["delivered","cancelled"].includes(currentOrder.status) && <button className="outlineButton" onClick={() => setCurrentOrder(null)}>Cerrar</button>}
        </div>}

        <div className="realCocktailGrid">
          {COCKTAILS.map(item => <article key={item.id} className={`realCocktailCard ${selectedId === item.id ? "selected" : ""}`}>
            <img src={item.image} alt={item.name} onClick={() => setSelectedId(item.id)} />
            <div className="realCocktailBody"><p className="cocktailTypeLabel">{item.type}</p><h3>{item.name}</h3><p>{item.description}</p>
              <button type="button" className="softPillButton orderMini" disabled={sending || Boolean(activeOrder)} onClick={() => placeOrder(item.id)}>{activeOrder ? "Pedido activo" : sending && selectedId === item.id ? "Enviando..." : "Pedir"}</button>
            </div>
          </article>)}
        </div>
        {message && <p className="status orderStatus">{message}</p>}
      </section>
    </main>
  );
}
