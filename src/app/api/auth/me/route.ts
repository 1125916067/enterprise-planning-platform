import { NextResponse } from "next/server";

import { getSessionUser, publicUser } from "../../../../lib/auth/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request);

  return NextResponse.json({
    user: sessionUser ? publicUser(sessionUser.user) : null
  });
}
