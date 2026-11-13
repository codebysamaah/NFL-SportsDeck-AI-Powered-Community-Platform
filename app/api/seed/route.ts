import { automatic_threads } from "@/automatic_threads.js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const seeded = await automatic_threads()
    return NextResponse.json({
      message: seeded ? "Default threads are up to date" : "Default threads were seeded recently",
      seeded,
    })
  } catch (error) {
    console.error("Failed to seed default discussion threads", error)
    return NextResponse.json(
      { error: "Failed to seed default discussion threads" },
      { status: 500 }
    )
  }
}