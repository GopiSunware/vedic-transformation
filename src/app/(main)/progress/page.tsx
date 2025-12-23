import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PILLARS, TOTAL_JOURNEY_DAYS } from "@/constants/pillars";
import { TrendingUp, Calendar, Award, Target } from "lucide-react";

export default async function ProgressPage() {
  const user = await requireAuth();
  const userId = user.id;

  // Get user's journey
  const journey = await prisma.journey.findFirst({
    where: {
      userId,
      isActive: true,
    },
  });

  // Get all check-ins for this journey
  let checkins: { checkinDate: Date; pillar: { slug: string; name: string } }[] = [];
  if (journey) {
    checkins = await prisma.dailyCheckin.findMany({
      where: {
        userId,
        completed: true,
      },
      include: {
        pillar: {
          select: {
            slug: true,
            name: true,
          },
        },
      },
    });
  }

  // Get streak
  let streak: { currentStreak: number; longestStreak: number } | null = null;
  if (journey) {
    streak = await prisma.streak.findFirst({
      where: {
        userId,
        journeyId: journey.id,
      },
      select: {
        currentStreak: true,
        longestStreak: true,
      },
    });
  }

  // Get total karma
  const karmaTransactions = await prisma.karmaTransaction.findMany({
    where: { userId },
    select: { points: true },
  });
  const totalKarma = karmaTransactions.reduce((sum, t) => sum + t.points, 0);

  // Get badges
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: {
      badge: true,
    },
  });

  // Calculate current day
  const currentDay = journey
    ? Math.min(
        Math.floor(
          (new Date().getTime() - new Date(journey.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1,
        TOTAL_JOURNEY_DAYS
      )
    : 0;

  // Calculate pillar completion stats
  const pillarStats = PILLARS.map((pillar) => {
    const completions = checkins.filter((c) => c.pillar.slug === pillar.slug).length;
    return {
      ...pillar,
      completions,
      percentage: currentDay > 0 ? Math.round((completions / currentDay) * 100) : 0,
    };
  });

  // Get unique completed days
  const completedDays = new Set(
    checkins.map((c) => c.checkinDate.toISOString().split("T")[0])
  ).size;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Your Progress</h1>
        <p className="text-gray-600 mt-2">Track your transformation journey</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Day</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentDay} / {TOTAL_JOURNEY_DAYS}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">
                  {streak?.currentStreak || 0} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Karma</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalKarma.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Badges Earned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userBadges?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Journey progress */}
      <Card>
        <CardHeader>
          <CardTitle>48-Day Journey Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Overall completion</span>
              <span className="font-medium text-amber-600">
                {Math.round((currentDay / TOTAL_JOURNEY_DAYS) * 100)}%
              </span>
            </div>
            <Progress
              value={currentDay}
              max={TOTAL_JOURNEY_DAYS}
              size="lg"
              variant="gradient"
            />
          </div>

          <div className="grid grid-cols-8 gap-1 mt-6">
            {Array.from({ length: TOTAL_JOURNEY_DAYS }, (_, i) => {
              const day = i + 1;
              const isCompleted = day <= completedDays;
              const isCurrent = day === currentDay;
              const isFuture = day > currentDay;

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium
                    ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-amber-500 text-white ring-2 ring-amber-300"
                        : isFuture
                        ? "bg-gray-100 text-gray-400"
                        : "bg-red-100 text-red-600"
                    }`}
                  title={`Day ${day}`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-gray-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500" />
              <span className="text-gray-600">Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100" />
              <span className="text-gray-600">Upcoming</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pillar completion rates */}
      <Card>
        <CardHeader>
          <CardTitle>Pillar Consistency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pillarStats.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.id} className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${pillar.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: pillar.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {pillar.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {pillar.completions}/{currentDay} days ({pillar.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pillar.percentage}%`,
                          backgroundColor: pillar.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges & Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          {userBadges && userBadges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {userBadges.map((ub) => (
                <div
                  key={ub.id}
                  className="flex flex-col items-center p-4 rounded-xl bg-amber-50 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                    <Award className="w-8 h-8 text-amber-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">{ub.badge?.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {ub.badge?.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Complete pillars to earn badges!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
