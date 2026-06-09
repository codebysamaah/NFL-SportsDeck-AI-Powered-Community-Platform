import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (payload.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

  const reports = await prisma.report.findMany({ 
    where: { status: "PENDING" },
    orderBy: { aiScore: "desc" },
    select: {
        id:true,
        reporterid: true,
        threadId:true,
        postId:true,
        replyId:true,
        reason:true,
        isAIGenerated:true,            
        aiVerdict:true,
        aiScore:true,
        status:true          
  }})

  const counts = reports.map(report => ({
    ...report, reportCount: reports.filter(r =>
        r.isAIGenerated === false && (
    (report.postId !== null && r.postId === report.postId) ||
    (report.threadId !== null && r.threadId === report.threadId) ||
    (report.replyId !== null && r.replyId === report.replyId))
).length
  }))

  counts.sort((x,y) => y.reportCount-x.reportCount || y.aiScore-x.aiScore)

  return NextResponse.json(counts)

}