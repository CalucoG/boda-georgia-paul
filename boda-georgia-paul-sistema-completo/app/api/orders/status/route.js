import { getRedis } from "../../../../lib/redis";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const guestId = searchParams.get("guestId");

    if (!orderId || !guestId) {
      return Response.json({ error: "Faltan datos." }, { status: 400 });
    }

    const redis = getRedis();
    const raw = await redis.hget("orders:data", orderId);
    if (!raw) return Response.json({ error: "Pedido no encontrado." }, { status: 404 });

    const order = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (order.guestId !== guestId) {
      return Response.json({ error: "No autorizado." }, { status: 403 });
    }

    const alcoholCount = Number(await redis.get(`guest:${guestId}:alcoholCount`) || 0);
    const lastAlcoholAt = Number(await redis.get(`guest:${guestId}:lastAlcoholAt`) || 0);

    return Response.json({
      order: {
        id: order.id,
        code: order.code,
        cocktailName: order.cocktailName,
        status: order.status,
        bartender: order.bartender || null,
        deliveredAt: order.deliveredAt || null
      },
      alcoholCount,
      lastAlcoholAt
    });
  } catch {
    return Response.json({ error: "No se pudo consultar el pedido." }, { status: 500 });
  }
}
