"use client";

import { useEffect, useMemo, useState } from "react";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

const statusTitle = {
  pending: "Pendiente",
  preparing: "Preparando",
  delivered: "Entregado",
  cancelled: "Cancelado"
};

export default function BarraPage() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState([]);
  const [login, setLogin] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [pushState, setPushState] = useState("idle");

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setUser(data.user);
      else setUser(null);
    } finally {
      setChecking(false);
    }
  }

  async function loadOrders() {
    if (!user) return;
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (res.status === 401) {
        setUser(null);
        return;
      }
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
    } catch {}
  }

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    loadOrders();
    const t = setInterval(loadOrders, 2500);
    return () => clearInterval(t);
  }, [user]);

  async function doLogin(e) {
    e.preventDefault();
    setMessage("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(login)
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "No se pudo iniciar sesión.");
      return;
    }

    setUser(data.user);
    setLogin({ username: "", password: "" });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setOrders([]);
  }

  async function updateOrder(orderId, action) {
    setMessage("");
    const res = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action })
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "No se pudo actualizar.");
    }
    await loadOrders();
  }

  async function enableNotifications() {
    try {
      setPushState("working");

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Este navegador no admite notificaciones push.");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Debes permitir las notificaciones.");
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) throw new Error("Falta la clave pública VAPID.");

      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid)
        });
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription)
      });

      if (!res.ok) throw new Error("No se pudo registrar el celular.");

      setPushState("enabled");
      setMessage("Notificaciones activadas en este celular.");
    } catch (error) {
      setPushState("error");
      setMessage(error.message || "No se pudieron activar las notificaciones.");
    }
  }

  const groups = useMemo(() => ({
    pending: orders.filter((o) => o.status === "pending"),
    preparing: orders.filter((o) => o.status === "preparing"),
    delivered: orders.filter((o) => o.status === "delivered").slice(0, 20)
  }), [orders]);

  if (checking) {
    return <main className="barApp"><div className="barLoading">Cargando barra…</div></main>;
  }

  if (!user) {
    return (
      <main className="barApp barLoginWrap">
        <div className="barLoginCard">
          <p className="barEyebrow">Georgia & Paul</p>
          <h1>Acceso Bartender</h1>
          <p>Acceso exclusivo para el equipo de barra.</p>

          <form onSubmit={doLogin}>
            <label>
              <span>Usuario</span>
              <input
                value={login.username}
                onChange={(e) => setLogin({ ...login, username: e.target.value })}
                placeholder="bartender1"
                autoComplete="username"
              />
            </label>

            <label>
              <span>Contraseña</span>
              <input
                type="password"
                value={login.password}
                onChange={(e) => setLogin({ ...login, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>

            <button type="submit">Ingresar</button>
          </form>

          {message && <p className="barMessage">{message}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="barApp">
      <header className="barHeader">
        <div>
          <p className="barEyebrow">Georgia & Paul · Barra</p>
          <h1>Pedidos en vivo</h1>
        </div>
        <div className="barHeaderActions">
          <button className="barNotify" onClick={enableNotifications}>
            {pushState === "enabled" ? "✓ Notificaciones activas" : "Activar notificaciones"}
          </button>
          <button className="barLogout" onClick={logout}>Salir · {user}</button>
        </div>
      </header>

      {message && <div className="barToast">{message}</div>}

      <section className="barSummary">
        <div><strong>{groups.pending.length}</strong><span>Pendientes</span></div>
        <div><strong>{groups.preparing.length}</strong><span>Preparando</span></div>
        <div><strong>{groups.delivered.length}</strong><span>Entregados recientes</span></div>
      </section>

      <section className="barColumns">
        <OrderColumn
          title="Pendientes"
          orders={groups.pending}
          empty="No hay pedidos pendientes."
          renderAction={(order) => (
            <button onClick={() => updateOrder(order.id, "claim")}>Tomar pedido</button>
          )}
        />

        <OrderColumn
          title="Preparando"
          orders={groups.preparing}
          empty="Nadie está preparando un pedido."
          renderAction={(order) =>
            order.bartender === user ? (
              <button onClick={() => updateOrder(order.id, "deliver")}>Marcar entregado</button>
            ) : (
              <div className="claimedBy">Por {order.bartender}</div>
            )
          }
        />

        <OrderColumn
          title="Entregados"
          orders={groups.delivered}
          empty="Aún no hay entregas."
          compact
        />
      </section>
    </main>
  );
}

function OrderColumn({ title, orders, empty, renderAction, compact = false }) {
  return (
    <div className="barColumn">
      <div className="barColumnTitle">
        <h2>{title}</h2>
        <span>{orders.length}</span>
      </div>

      <div className="barOrderList">
        {orders.length === 0 ? (
          <div className="barEmpty">{empty}</div>
        ) : orders.map((order) => (
          <article className={`barOrderCard ${compact ? "compact" : ""}`} key={order.id}>
            <div className="barOrderTop">
              <strong>{order.code}</strong>
              <span>{new Date(order.createdAt).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>

            <h3>{order.cocktailName}</h3>
            <p>{order.guestName}</p>

            {order.alcoholic ? (
              <div className={`consumptionBadge ${order.alcoholCountBefore >= 3 ? "warning" : ""}`}>
                {order.alcoholCountBefore} alcohólicas entregadas antes de este pedido
              </div>
            ) : (
              <div className="consumptionBadge safe">Sin alcohol</div>
            )}

            {renderAction && <div className="barCardAction">{renderAction(order)}</div>}
          </article>
        ))}
      </div>
    </div>
  );
}
