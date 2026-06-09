import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateAccessToken } from "@/utils/auth"

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  if (!code) return NextResponse.redirect(new URL("/login?error=no_code", req.url))

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/google/callback`,
      grant_type: "authorization_code",
      prompt: "select_account",
    }),
  })

  const tokens = await tokenRes.json()

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const googleUser = await userRes.json()

  if (!googleUser.email) {
    return NextResponse.redirect(new URL("/login?error=no_email", req.url))
  }

  let user = await prisma.user.findUnique({ where: { email: googleUser.email } })
    if (!user) {
    user = await prisma.user.create({
        data: {
        email: googleUser.email, // or primaryEmail for GitHub
        username: googleUser.name.replace(/\s+/g, "_"), // or githubUser.login
        password: "",
        },
    })
    } else if (user.password !== "") {
    // user exists with a password = registered manually, block OAuth login
    return NextResponse.redirect(new URL("/login?error=account_exists", req.url))
    }

  const token = generateAccessToken({ userId: user.id, username: user.username, role: user.role })
  const res = NextResponse.redirect(new URL("/home", req.url))
  res.cookies.set("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  })

  return res
}