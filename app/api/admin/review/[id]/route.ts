import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = request.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (payload.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const params = await context.params;
  const reportId = Number(params.id);

  if (isNaN(reportId)) return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });

  const { decision } = await request.json();

  if (!decision) return NextResponse.json({ error: "Please dismiss or approve this report" }, { status: 400 });
  if (!(decision === "DISMISS" || decision === "APPROVE")) return NextResponse.json({ error: "This report can only be dismissed or approved" }, { status: 400 });

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  if (decision === "APPROVE") {
    if (report.threadId) await prisma.thread.update({ where: { id: report.threadId }, data: { isVisible: false } });
    if (report.postId) await prisma.post.update({ where: { id: report.postId }, data: { isVisible: false } });
    if (report.replyId) await prisma.reply.update({ where: { id: report.replyId }, data: { isVisible: false } });
  }

  const updated_report = await prisma.report.update({ where: { id: reportId }, data: { status: decision } });
  return NextResponse.json(updated_report);
}