import { generateWithAI } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { strategyCode, input, context } = body;

  try {
    const result = await generateWithAI(strategyCode, input, context);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({
      result: JSON.stringify({
        error: "AI服务未配置，请设置 GEMINI_API_KEY",
      }),
    });
  }
}
