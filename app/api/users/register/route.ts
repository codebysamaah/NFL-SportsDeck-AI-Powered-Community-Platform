import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest){
    try{
    const { email, username, password } = await request.json();

    if (!email){
        return NextResponse.json({error: "email is needed to create an account"}, { status: 400 })
    }
    if (!username){
        return NextResponse.json({error: "username is needed to create an account"}, { status: 400 })
    }
    if (!password){
        return NextResponse.json({error: "you must have a password to create an account"}, { status: 400 })
    }

    if (await prisma.user.findUnique({where: {email: email}}) ||await prisma.user.findUnique({where: {username: username}})){
        return NextResponse.json({error: "this email or username is already associated with an account"}, { status: 400 })
    }


    const user = await prisma.user.create({
    data: {
        email,
        username,
        password: await bcrypt.hash(password, 10),

    },
    select: {
        email: true,
        username: true,
        password: true
    },
    });

    return NextResponse.json({ user });

}
catch(e){
    const error = e as Error
    return NextResponse.json({error: error.message}, {status: 400})}}