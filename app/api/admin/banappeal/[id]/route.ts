import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

// addressing the reports
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = request.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (payload.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const params = await context.params;
  const banAppealId = Number(params.id);

    if (isNaN(banAppealId)){
        return NextResponse.json({ error: "Invalid ban appeal ID" }, { status: 400 });
    }

    const body = await request.json();
    const { decision } = body;

    if (!decision){
        return NextResponse.json({ error: "Please dismiss or approve this ban appeal" }, { status: 400 });
    }

    const banAppeal = await prisma.banAppeal.findUnique({ 
        where: { 
            id: banAppealId 
        },
        select: {userId: true}
    });

    if (!banAppeal){
        return NextResponse.json({ error: "Ban appeal not found" }, { status: 404 });
    }

    if (!(decision === 'DISMISS' || decision == 'APPROVE')) {
        return NextResponse.json({ error: "This ban appeal can only be dismissed or approved" }, { status: 400 });
    }

    let is_banned = true

    if (decision === 'APPROVE') {
        is_banned=false
    }

    const updated_user = await prisma.user.update({
        where: { id: banAppeal.userId }, data: {is_banned: is_banned}
    });
    const update_appeal = await prisma.banAppeal.update({
        where: {id:banAppealId}, data: {status: decision}
    })

    return NextResponse.json(update_appeal);
}