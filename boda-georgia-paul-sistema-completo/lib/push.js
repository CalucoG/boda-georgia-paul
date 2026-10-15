import webpush from "web-push";
import crypto from "crypto";
import { getRedis } from "./redis";

function ready() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT
  );
}

function configure() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export function subscriptionKey(user, endpoint) {
  return `${user}:${crypto.createHash("sha256").update(endpoint).digest("hex")}`;
}

export async function sendOrderPush(order) {
  if (!ready()) return { sent: 0, skipped: true };

  configure();
  const redis = getRedis();
  const values = await redis.hvals("push:subscriptions");
  let sent = 0;

  for (const raw of values || []) {
    try {
      const item = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!item?.subscription?.endpoint) continue;

      await webpush.sendNotification(
        item.subscription,
        JSON.stringify({
          title: `🍸 Nuevo pedido ${order.code}`,
          body: `${order.guestName} · ${order.cocktailName}`,
          url: "/barra",
          tag: `order-${order.id}`
        }),
        { TTL: 60 }
      );
      sent++;
    } catch (error) {
      const status = error?.statusCode;
      if (status === 404 || status === 410) {
        try {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          const key = subscriptionKey(parsed.user, parsed.subscription.endpoint);
          await redis.hdel("push:subscriptions", key);
        } catch {}
      }
    }
  }

  return { sent };
}
