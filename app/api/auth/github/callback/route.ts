import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateAccessToken } from "@/utils/auth"

export async function GET(req: NextRequest) {
  const gitcode = req.nextUrl.searchParams.get("code")
  if (!gitcode) return NextResponse.redirect(new URL("/login?error=no_code", req.url))

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      code: gitcode,
      client_id: process.env.GITHUB_CLIENT_ID!,
      client_secret: process.env.GITHUB_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/github/callback`,
      login: "", 
    }),
  })

  const tokens = await tokenRes.json()


  // Get user info from GitHub
  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const githubUser = await userRes.json()

  const emailRes = await fetch("https://api.github.com/user/emails", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const emails = await emailRes.json()
  console.log(emails)
  const primaryEmail = emails.find((e: { primary: boolean; email: string }) => e.primary)?.email

  if (!primaryEmail) {
    return NextResponse.redirect(new URL("/login?error=no_email", req.url))
  }

  // Find or create user in your DB
  let user = await prisma.user.findUnique({ where: { email: primaryEmail } })
    if (!user) {
    user = await prisma.user.create({
        data: {
        email: githubUser.email, // or primaryEmail for GitHub
        username: githubUser.name.replace(/\s+/g, "_"), // or githubUser.login
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