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

  const { decision }: { decision: string } = await request.json();
  if (!decision) return NextResponse.json({ error: "Please ban or unban this user" }, { status: 400 });
  if (decision !== 'BAN' && decision !== 'UNBAN') return NextResponse.json({ error: "Decision must be BAN or UNBAN" }, { status: 400 });

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const isBan = decision === 'BAN';
  let userId: number | null = null;

  if (report.threadId) {
    const thread = await prisma.thread.findUnique({ where: { id: report.threadId } });
    if (thread?.userid) userId = thread.userid;
  } else if (report.postId) {
    const post = await prisma.post.findUnique({ where: { id: report.postId } });
    if (post?.userid) userId = post.userid;
  } else if (report.replyId) {
    const reply = await prisma.reply.findUnique({ where: { id: report.replyId } });
    if (reply?.userid) userId = reply.userid;
  }

  if (!userId) return NextResponse.json({ error: "Could not find user to ban" }, { status: 404 });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { is_banned: isBan }
  });

  return NextResponse.json(user);
}