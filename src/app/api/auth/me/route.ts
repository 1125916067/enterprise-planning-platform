import { NextResponse } from "next/server";

import { getSessionUser } from "../../../../lib/auth/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request);

  return NextResponse.json({
    user: sessionUser?.user ?? null
  });
}
