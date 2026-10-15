import { getBartender } from "../../../../lib/auth";
import { getRedis } from "../../../../lib/redis";
import { subscriptionKey } from "../../../../lib/push";

export const runtime = "nodejs";

export async function POST(request) {
  const user = getBartender(request);
  if (!user) return Response.json({ error: "No autorizado." }, { status: 401 });

  try {
    const subscription = await request.json();
    if (!subscription?.endpoint) {
      return Response.json({ error: "Suscripción inválida." }, { status: 400 });
    }

    const redis = getRedis();
    const key = subscriptionKey(user, subscription.endpoint);
    await redis.hset("push:subscriptions", {
      [key]: JSON.stringify({ user, subscription, updatedAt: Date.now() })
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "No se pudo activar la notificación." }, { status: 500 });
  }
}
