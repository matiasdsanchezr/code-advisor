export async function GET() {
  console.log("✅ test route funciona");
  return Response.json({ ok: true });
}
