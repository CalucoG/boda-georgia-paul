import { randomUUID } from "crypto";
import { getRedis } from "../../../lib/redis";
import { getBartender } from "../../../lib/auth";
import { COCKTAILS, WEDDING_CONFIG } from "../../../lib/config";
import { sendOrderPush } from "../../../lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicOrder(order) {
  return {
    id: order.id,
    code: order.code,
    guestId: order.guestId,
    guestName: order.guestName,
    cocktailId: order.cocktailId,
    cocktailName: order.cocktailName,
    alcoholic: order.alcoholic,
    status: order.status,
    bartender: order.bartender || null,
    createdAt: order.createdAt,
    claimedAt: order.claimedAt || null,
    deliveredAt: order.deliveredAt || null,
    alcoholCountBefore: order.alcoholCountBefore || 0
  };
}

async function uniqueCode(redis) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  for (let i = 0; i < 8; i++) {
    const code = `${chars[Math.floor(Math.random() * chars.length)]}${Math.floor(Math.random() * 90 + 10)}`;
    const ok = await redis.set(`ordercode:${code}`, "1", { nx: true, ex: 60 * 60 * 18 });
    if (ok) return code;
  }
  return randomUUID().slice(0, 5).toUpperCase();
}

export async function POST(request) {
  try {
    const redis = getRedis();
    const body = await request.json();

    const guestId = String(body.guestId || "").trim();
    const guestName = String(body.guestName || "").trim().slice(0, 60);
    const cocktailId = String(body.cocktailId || "").trim();

    if (!guestId || !guestName || !cocktailId) {
      return Response.json({ error: "Faltan datos del pedido." }, { status: 400 });
    }

    const cocktail = COCKTAILS.find((c) => c.id === cocktailId);
    if (!cocktail) {
      return Response.json({ error: "Cóctel no válido." }, { status: 400 });
    }

    const pendingId = await redis.get(`guest:${guestId}:pending`);
    if (pendingId) {
      const rawPending = await redis.hget("orders:data", pendingId);
      const pending = typeof rawPending === "string" ? JSON.parse(rawPending) : rawPending;
      if (pending && !["delivered", "cancelled"].includes(pending.status)) {
        return Response.json(
          { error: `Ya tienes un pedido activo (${pending.code}).`, order: publicOrder(pending) },
          { status: 409 }
        );
      }
      await redis.del(`guest:${guestId}:pending`);
    }

    const alcoholCount = Number(await redis.get(`guest:${guestId}:alcoholCount`) || 0);

    if (cocktail.alcoholic) {
      const lastAlcoholAt = Number(await redis.get(`guest:${guestId}:lastAlcoholAt`) || 0);
      if (lastAlcoholAt) {
        const elapsed = Date.now() - lastAlcoholAt;
        const waitMs = WEDDING_CONFIG.alcoholCooldownMinutes * 60 * 1000 - elapsed;
        if (waitMs > 0) {
          return Response.json(
            {
              error: `Puedes pedir otra bebida alcohólica en ${Math.ceil(waitMs / 60000)} min.`,
              waitMinutes: Math.ceil(waitMs / 60000),
              alcoholCount
            },
            { status: 429 }
          );
        }
      }
    }

    const id = randomUUID();
    const code = await uniqueCode(redis);
    const now = Date.now();

    const order = {
      id,
      code,
      guestId,
      guestName,
      cocktailId: cocktail.id,
      cocktailName: cocktail.name,
      alcoholic: cocktail.alcoholic,
      status: "pending",
      bartender: null,
      createdAt: now,
      claimedAt: null,
      deliveredAt: null,
      alcoholCountBefore: alcoholCount
    };

    await redis.hset("orders:data", { [id]: JSON.stringify(order) });
    await redis.lpush("orders:list", id);
    await redis.ltrim("orders:list", 0, 499);
    await redis.set(`guest:${guestId}:pending`, id, { ex: 60 * 60 * 8 });

    try {
      await sendOrderPush(order);
    } catch {}

    return Response.json({
      ok: true,
      order: publicOrder(order),
      responsibleReminder: alcoholCount >= WEDDING_CONFIG.responsibleReminderAfter
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "No se pudo registrar el pedido. Revisa la base de datos." },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const bartender = getBartender(request);
  if (!bartender) return Response.json({ error: "No autorizado." }, { status: 401 });

  try {
    const redis = getRedis();
    const ids = await redis.lrange("orders:list", 0, WEDDING_CONFIG.maxRecentOrders - 1);
    if (!ids?.length) return Response.json({ orders: [], bartender });

    const raws = await redis.hmget("orders:data", ...ids);
    const orders = [];

    for (const raw of raws || []) {
      if (!raw) continue;
      const order = typeof raw === "string" ? JSON.parse(raw) : raw;
      orders.push(publicOrder(order));
    }

    return Response.json(
      { orders, bartender },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "No se pudieron cargar los pedidos." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const bartender = getBartender(request);
  if (!bartender) return Response.json({ error: "No autorizado." }, { status: 401 });

  try {
    const redis = getRedis();
    const { orderId, action } = await request.json();
    const raw = await redis.hget("orders:data", orderId);
    if (!raw) return Response.json({ error: "Pedido no encontrado." }, { status: 404 });

    const order = typeof raw === "string" ? JSON.parse(raw) : raw;
    const now = Date.now();

    if (action === "claim") {
      if (order.status === "preparing" && order.bartender !== bartender) {
        return Response.json(
          { error: `Este pedido ya lo está preparando ${order.bartender}.` },
          { status: 409 }
        );
      }
      if (order.status !== "pending" && order.status !== "preparing") {
        return Response.json({ error: "Este pedido ya no está disponible." }, { status: 409 });
      }

      order.status = "preparing";
      order.bartender = bartender;
      order.claimedAt = order.claimedAt || now;
    } else if (action === "deliver") {
      if (order.status !== "preparing") {
        return Response.json({ error: "Primero debes tomar el pedido." }, { status: 409 });
      }
      if (order.bartender !== bartender) {
        return Response.json(
          { error: `Este pedido pertenece a ${order.bartender}.` },
          { status: 409 }
        );
      }

      order.status = "delivered";
      order.deliveredAt = now;

      await redis.del(`guest:${order.guestId}:pending`);

      if (order.alcoholic) {
        await redis.set(`guest:${order.guestId}:lastAlcoholAt`, now, { ex: 60 * 60 * 24 });
        await redis.incr(`guest:${order.guestId}:alcoholCount`);
        await redis.expire(`guest:${order.guestId}:alcoholCount`, 60 * 60 * 24);
      }
    } else if (action === "cancel") {
      if (!["pending", "preparing"].includes(order.status)) {
        return Response.json({ error: "El pedido ya finalizó." }, { status: 409 });
      }
      order.status = "cancelled";
      order.bartender = bartender;
      await redis.del(`guest:${order.guestId}:pending`);
    } else {
      return Response.json({ error: "Acción no válida." }, { status: 400 });
    }

    await redis.hset("orders:data", { [order.id]: JSON.stringify(order) });
    return Response.json({ ok: true, order: publicOrder(order) });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "No se pudo actualizar el pedido." }, { status: 500 });
  }
}
