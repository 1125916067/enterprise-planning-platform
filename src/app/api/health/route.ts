import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    deepseekConfigured: Boolean(process.env.DEEPSEEK_API_KEY),
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat"
  });
}
