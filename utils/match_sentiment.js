import { calculateSentiment } from './sentiment.js';

export async function processMatchSentiment(prisma, { content, userId, matchId }) {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: { favoriteTeams: true } 
    });

    const match = await prisma.match.findUnique({ 
      where: { id: matchId },
      include: { 
        homeTeam: true, 
        awayTeam: true,
        thread: true 
      } 
    });

    const homeName = match.homeTeam.name.toLowerCase();
    const awayName = match.awayTeam.name.toLowerCase();
    const text = content.toLowerCase();

    const mentionsHome = text.includes(homeName);
    const mentionsAway = text.includes(awayName);

    // AI Sentiment Analysis Call
    const rawScore = await calculateSentiment(content);
    const score = (rawScore + 1) / 2; // Convert from [-1, 1] to [0, 1]

    // Update data object for the match update (Overall sentiment is always updated, home and away are conditional)
    let updateData = {
      overallSentimentTotal: { increment: score },
      overallPostCount: { increment: 1 }
    };

    // Helper: Get user's favorite team list (fallback to empty array if null/undefined)
    const favTeams = user?.favoriteTeams || [];
    const isHomeFan = favTeams.some(team => team.id === match.homeTeamId);
    const isAwayFan = favTeams.some(team => team.id === match.awayTeamId);

    // This considers three cases for home team sentiment:
    // 1. The user is a home fan (match home team is in their favorites) => always counts towards home sentiment
    // 2. The user is not a rival (away team is NOT in their favorites) but mentions the home team => counts towards home sentiment
    // 3. The user is neutral (no favourite teams or neither match team is a favorite) but mentions the home team => counts towards home sentiment
    if (isHomeFan || (!isAwayFan && mentionsHome)) {
       updateData.homeSentimentTotal = { increment: score };
       updateData.homePostCount = { increment: 1 };
    }

    // This considers two cases for away team sentiment:
    // 1. The user is an away fan (match away team is in their favorites) => always counts towards away sentiment
    // 2. The user is not a rival (home team is NOT in their favorites) but mentions the away team => counts towards away sentiment
    if (isAwayFan || (!isHomeFan && mentionsAway)) {
       updateData.awaySentimentTotal = { increment: score };
       updateData.awayPostCount = { increment: 1 };
    }

    // Update the thread with the new totals and counts
    const updatedThread = await prisma.thread.update({
      where: { id: match.thread.id },
      data: updateData
    });

    // Update Averages
    await prisma.thread.update({
      where: { id: match.thread.id },
      data: {
        overallAverage: updatedThread.overallSentimentTotal / updatedThread.overallPostCount,
        homeAverage: updatedThread.homePostCount > 0 ? updatedThread.homeSentimentTotal / updatedThread.homePostCount : 0,
        awayAverage: updatedThread.awayPostCount > 0 ? updatedThread.awaySentimentTotal / updatedThread.awayPostCount : 0,
      }
    });
  } catch (error) {
    console.error("Failed to update match sentiment:", error);
  }
}