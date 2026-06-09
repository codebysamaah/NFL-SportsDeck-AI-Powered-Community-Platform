import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";

// Get all standings for a league
export async function GET(){
    const res = await fetch(
        "https://api.football-data.org/v4/competitions/PD/standings",
        {
            headers: {
                "X-Auth-Token": process.env.FOOTBALL_API_KEY,
            },
        }
    );

    if (!res.ok) {
        return NextResponse.json(
            { error: "Failed to fetch data from football-data API" },
            { status: 500 }
        );
    }

    const data = await res.json();
    const totalStandings = data.standings.find((s) => s.type === "TOTAL");

    return NextResponse.json(totalStandings);
}
