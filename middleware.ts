import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const PROTECTED_PATHS = ["/", "/api/leads"];
const LOGIN_PATH = "/login";

function isProtectedPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/api/leads")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { user, response } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (isProtectedPath(pathname) && !user) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", pathname);
    return Response.redirect(loginUrl);
  }

  if (pathname === LOGIN_PATH && user) {
    const next = request.nextUrl.searchParams.get("next") || "/";
    return Response.redirect(new URL(next, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|listicon.png|.*\\.(?:svg|png|ico)$).*)",
  ],
};
