import crypto from "crypto";

const COOKIE_NAME = "gp_bar_auth";

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(value) {
  const secret = process.env.BAR_AUTH_SECRET;
  if (!secret) throw new Error("BAR_AUTH_SECRET no configurado.");
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function createAuthToken(user) {
  const payload = b64url(JSON.stringify({
    user,
    exp: Date.now() + 12 * 60 * 60 * 1000
  }));
  return `${payload}.${sign(payload)}`;
}

export function verifyAuthToken(token) {
  try {
    if (!token) return null;
    const [payload, signature] = token.split(".");
    const expected = sign(payload);
    const a = Buffer.from(signature || "");
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data?.user || !data?.exp || data.exp < Date.now()) return null;
    return data.user;
  } catch {
    return null;
  }
}

export function getCookieFromRequest(request) {
  const raw = request.headers.get("cookie") || "";
  const parts = raw.split(";").map((x) => x.trim());
  for (const part of parts) {
    if (part.startsWith(`${COOKIE_NAME}=`)) {
      return decodeURIComponent(part.slice(COOKIE_NAME.length + 1));
    }
  }
  return null;
}

export function getBartender(request) {
  return verifyAuthToken(getCookieFromRequest(request));
}

export function cookieHeader(token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${secure}`;
}

export function clearCookieHeader() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function validateBartenderCredentials(username, password) {
  const candidates = [
    {
      user: process.env.BARTENDER_1_USER || "bartender1",
      pass: process.env.BARTENDER_1_PASSWORD
    },
    {
      user: process.env.BARTENDER_2_USER || "bartender2",
      pass: process.env.BARTENDER_2_PASSWORD
    }
  ];

  const match = candidates.find(
    (x) => x.pass && x.user === username && x.pass === password
  );
  return match?.user || null;
}
