import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const {pathname} = req.nextUrl;

    const protectedPaths = ['/practice', '/mock-exam'];

    const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

    if (isProtectedPath && !token) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
}

export const config = {matcher: ["/practice/:path*", "/mock-exam/:path*"]}; 