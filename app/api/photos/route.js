import { list } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await list({ prefix: "boda/", limit: 1000 });

    const photos = result.blobs
      .map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        uploadedAt: blob.uploadedAt
      }))
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return Response.json(
      { photos },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(error);
    return Response.json(
      { photos: [], error: "No se pudo cargar la galería." },
      { status: 500 }
    );
  }
}
