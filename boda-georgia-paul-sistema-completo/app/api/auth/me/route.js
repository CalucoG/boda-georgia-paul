import { getBartender } from "../../../../lib/auth";

export async function GET(request) {
  const user = getBartender(request);
  if (!user) return Response.json({ authenticated: false }, { status: 401 });
  return Response.json({ authenticated: true, user });
}
