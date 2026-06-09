import { automatic_threads } from "@/automatic_threads.js"
import { NextResponse } from "next/server"

export async function GET() {
  await automatic_threads()
  return NextResponse.json({ message: "done" })
}