import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";

const ROTA_IP_PATH =
  "/Users/wangxing/.cursor/projects/Users-wangxing/assets/Rota-_IP-fc388ae0-25eb-44e4-86b4-c1b5ea597cbc.png";

export async function GET() {
  try {
    const image = await readFile(ROTA_IP_PATH);

    return new NextResponse(image, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new NextResponse("Rota IP image not found", { status: 404 });
  }
}
