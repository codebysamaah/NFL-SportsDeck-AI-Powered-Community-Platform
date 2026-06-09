import { NextResponse } from "next/server";
import { verifyToken, generateAccessToken } from "@/utils/auth";

export async function POST(request) {
  const { refreshToken } = await request.json();

  if (!refreshToken) {
    return NextResponse.json(
      { error: "Invalid or expired refresh token" },
      { status: 401 }
    );
  }

  const payload = verifyToken(refreshToken);

  if (!payload) {
    return NextResponse.json(
      { error: "Invalid or expired refresh token" },
      { status: 401 }
    );
  }

  const newAccessToken = generateAccessToken({
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
  });

  return NextResponse.json({ accessToken: newAccessToken });
}
