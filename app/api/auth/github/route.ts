import { NextResponse } from "next/server";

export async function GET(){
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/github/callback`,
        scope: "user:email",
        login: "",
    })

    return NextResponse.redirect(
        `https://github.com/login/oauth/authorize?${params}`
    )
}