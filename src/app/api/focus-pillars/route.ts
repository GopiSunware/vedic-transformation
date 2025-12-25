import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

// GET - Fetch user's focus pillars
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("vedic-auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = payload.id;

    const focusPillars = await prisma.focusPillar.findMany({
      where: { userId },
      orderBy: { priority: "asc" },
    });

    // Get pillar details with completion rates
    const pillarIds = focusPillars.map((fp) => fp.pillarId);

    // Get all pillars
    const pillars = await prisma.pillar.findMany();

    // Get all completed check-ins for user
    const checkins = await prisma.dailyCheckin.findMany({
      where: { userId, completed: true },
      select: { pillarId: true },
    });

    // Get journey for day calculation
    const journey = await prisma.journey.findFirst({
      where: { userId, isActive: true },
    });

    const currentDay = journey
      ? Math.min(
          Math.floor(
            (new Date().getTime() - new Date(journey.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1,
          48
        )
      : 1;

    // Calculate completion rates
    const pillarDetails = pillars.map((pillar) => {
      const completedDays = checkins.filter((c) => c.pillarId === pillar.id).length;
      const completionRate = currentDay > 0 ? Math.round((completedDays / currentDay) * 100) : 0;

      return {
        id: pillar.id,
        name: pillar.name,
        description: pillar.description,
        category: pillar.category,
        icon: pillar.icon,
        completionRate: Math.min(100, completionRate),
        isFocus: pillarIds.includes(pillar.id),
      };
    });

    return NextResponse.json({
      focusPillars: focusPillars.map((fp) => ({
        ...fp,
        pillarDetails: pillarDetails.find((p) => p.id === fp.pillarId),
      })),
      allPillars: pillarDetails,
    });
  } catch (error) {
    console.error("Focus pillars fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch focus pillars" }, { status: 500 });
  }
}

// POST - Set focus pillars
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("vedic-auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = payload.id;
    const data = await request.json();

    if (!data.pillarIds || !Array.isArray(data.pillarIds)) {
      return NextResponse.json({ error: "pillarIds array required" }, { status: 400 });
    }

    if (data.pillarIds.length > 3) {
      return NextResponse.json({ error: "Maximum 3 focus pillars allowed" }, { status: 400 });
    }

    // Delete existing focus pillars for user
    await prisma.focusPillar.deleteMany({
      where: { userId },
    });

    // Create new focus pillars
    const focusPillars = await Promise.all(
      data.pillarIds.map((pillarId: string, index: number) =>
        prisma.focusPillar.create({
          data: {
            userId,
            pillarId: parseInt(pillarId),
            priority: index + 1,
          },
        })
      )
    );

    return NextResponse.json({ success: true, focusPillars });
  } catch (error) {
    console.error("Focus pillars save error:", error);
    return NextResponse.json({ error: "Failed to save focus pillars" }, { status: 500 });
  }
}
