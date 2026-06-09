import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {generateAccessToken, comparePassword, generateRefreshToken} from "@/utils/auth"

export async function POST(request: NextRequest){
    const { username, password} = await request.json()
       if (!username || !password) {
         return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 },
        );
  }
     const user = await prisma.user.findUnique({where: {username:username}})
     if (user === null || !(await comparePassword(password, user.password))){return NextResponse.json({error: "user does not exist or wrong password"}, { status: 401 },)}

    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,  
    });
      const refreshToken = generateRefreshToken({
      userId: user.id,
      username: user.username,
      role: user.role,  
    });

    const insert = await prisma.refreshToken.create({data: {userid: user.id, token_code: refreshToken}})
    const res = NextResponse.json({ message: "Login successful",  role: user.role  })

    res.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 30, // 30 mins
    })

    res.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return res
    }
