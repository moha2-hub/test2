import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/api", "/_next", "/favicon.ico", "/public"];

function isPublicPath(path: string) {
  return PUBLIC_PATHS.some((publicPath) => path.startsWith(publicPath));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userId = request.cookies.get("userId")?.value;
  const userRole = request.cookies.get("userRole")?.value;

  // Always allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // If not logged in, redirect to login
  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based route protection
  if (userRole === "admin" && !pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  if (userRole === "seller" && !pathname.startsWith("/seller")) {
    return NextResponse.redirect(new URL("/seller", request.url));
  }
  if (userRole === "customer" && !pathname.startsWith("/customer")) {
    return NextResponse.redirect(new URL("/customer", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|public|api).*)"],
};
