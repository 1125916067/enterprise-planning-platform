import { NextResponse } from "next/server";

import {
  clearAuthCookie,
  getAuthSessionToken
} from "../../../../lib/auth/http";
import { deleteSession } from "../../../../lib/auth/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = getAuthSessionToken(request);

  if (token) {
    await deleteSession(token);
  }

  const response = NextResponse.json({ ok: true });

  return clearAuthCookie(response);
}
