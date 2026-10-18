import { put } from "@vercel/blob";
import { WEDDING_CONFIG } from "../../../lib/config";

export async function POST(request) {
  try {
    if (Date.now() < new Date(WEDDING_CONFIG.photoUnlockISO).getTime()) {
      return Response.json({ error: "La sección de fotos todavía no está habilitada." }, { status: 403 });
    }
    const form = await request.formData();
    const file = form.get("file");
    const guest = String(form.get("guest") || "invitado").trim().toLowerCase().replace(/[^a-z0-9áéíóúñ_-]+/gi, "-").slice(0, 50) || "invitado";
    if (!(file instanceof File)) return Response.json({ error: "No se recibió ninguna foto." }, { status: 400 });
    const allowedTypes = ["image/jpeg","image/png","image/webp"];
    if (!allowedTypes.includes(file.type)) return Response.json({ error: "Formato no permitido. Usa JPG, PNG o WEBP." }, { status: 400 });
    if (file.size > 8*1024*1024) return Response.json({ error: "La foto supera el límite de 8 MB." }, { status: 400 });
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const pathname = `${WEDDING_CONFIG.livePhotoPrefix}${Date.now()}-${guest}-${crypto.randomUUID()}.${extension}`;
    const blob = await put(pathname,file,{access:"public",addRandomSuffix:false});
    return Response.json({ url: blob.url });
  } catch(error) { console.error(error); return Response.json({ error: "No fue posible guardar la foto. Revisa la conexión de Blob." }, { status: 500 }); }
}
