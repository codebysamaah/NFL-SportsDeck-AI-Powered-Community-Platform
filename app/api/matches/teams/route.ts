import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {verifyToken} from "@/utils/auth"


export async function GET(request: NextRequest) {

  const teams = await prisma.team.findMany({select: {
    id: true,
    name: true
  }})

  return NextResponse.json(teams)

}