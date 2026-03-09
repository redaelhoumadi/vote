import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(req: NextRequest) {

  const pathname = req.nextUrl.pathname

  // laisser login accessible
  if (pathname.startsWith("/login")) {
    return NextResponse.next()
  }

  return NextResponse.next()

}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/bureau/:path*"
  ]
}