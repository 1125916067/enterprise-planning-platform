import { type NextResponse } from "next/server";

import { getSessionUser } from "../auth/http";
import { billingCookieName } from "./config";

export function getBillingUserId(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [key, ...valueParts] = item.split("=");

        return [key, decodeURIComponent(valueParts.join("="))];
      })
  );

  return cookies[billingCookieName] || "";
}

export async function getBillingUserIdForRequest(request: Request) {
  const sessionUser = await getSessionUser(request);

  return sessionUser?.user.id || getBillingUserId(request);
}

export function setBillingCookie(response: NextResponse, userId: string) {
  response.cookies.set(billingCookieName, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });

  return response;
}
