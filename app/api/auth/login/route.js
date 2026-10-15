import { createAuthToken, cookieHeader, validateBartenderCredentials } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const user = validateBartenderCredentials(String(username || ""), String(password || ""));

    if (!user) {
      return Response.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
    }

    const token = createAuthToken(user);
    return Response.json(
      { ok: true, user },
      { headers: { "Set-Cookie": cookieHeader(token) } }
    );
  } catch {
    return Response.json({ error: "No se pudo iniciar sesión." }, { status: 500 });
  }
}
