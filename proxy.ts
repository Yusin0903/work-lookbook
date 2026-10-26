import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  if (!session.isAdmin) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
