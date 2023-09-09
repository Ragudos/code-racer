
import { User } from "next-auth";
import { notFound } from "next/navigation";
import Link from "next/link";

import { getSnippetById } from "@/app/race/(play)/loaders";

import { pushNotification } from "@/lib/notification";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { cn } from "@/lib/utils";

import HistoryChart from "../_components/history-chart";
import { RaceAchievementBadges } from "../_components/race-achievement-badges";
import { ReplayCode } from "../_components/replay-timestamps";
import { ResultChart } from "../_components/result-chart";
import { TopTable } from "../_components/topten";
import { Voting } from "../_components/voting";
import {
  ParsedRacesResult,
  getBestAccuracy,
  getBestCPM,
  getCurrentRaceResult,
  getSnippetVote,
  getUserResultsForSnippet,
} from "../loaders";

type AuthenticatedPageProps = {
  resultId: string;
  user: User;
};


const AuthenticatedPage: React.FC<AuthenticatedPageProps> = async ({
  resultId,
  user
}) => {
  if (!resultId)
    return (
      <main className="flex flex-col items-center justify-center gap-10 mt-20">
        <Heading title="Oops, Something went wrong" />
        <Link
          className={cn(buttonVariants(), "whitespace-nowrap")}
          href="/race"
        >
          Go back
        </Link>
      </main>
    );

  const currentRaceResult = await getCurrentRaceResult(resultId);

  if (!currentRaceResult) notFound();

  const usersVote = await getSnippetVote(currentRaceResult.snippetId);
  const currentSnippet = await getSnippetById(currentRaceResult.snippetId);

  let raceResults: ParsedRacesResult[] = [];
  let cardObjects = [] as { title: string; value: string | undefined }[];

  if (!currentRaceResult) {
    throw new Error("race result not found");
  }

  raceResults = await getUserResultsForSnippet(currentRaceResult.snippetId);
  cardObjects = [
    {
      title: "CPM",
      value: currentRaceResult?.cpm.toString(),
    },
    {
      title: "Accuracy",
      value: currentRaceResult?.accuracy
        ? `${Number(currentRaceResult.accuracy)}%`
        : "0%",
    },
    {
      title: "Misses",
      value: currentRaceResult?.errorCount?.toString(),
    },
    {
      title: "Time Taken",
      value: `${currentRaceResult?.takenTime}s`,
    },
  ];

  const bestCPMRace = await getBestCPM({
    snippetId: currentRaceResult.snippetId,
    raceId: currentRaceResult.id,
  });

  if (bestCPMRace && bestCPMRace?.cpm < currentRaceResult.cpm) {
    const notificationData = {
      notification: {
        title: "New Record!",
        description: "You just achvied your highest CPM!",
        ctaUrl: "/dashboard/races",
      },
      userId: user.id,
    };

    try {
      await pushNotification(notificationData);
      console.log("Best CPM notification sent successfully!");
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  const bestAccuracy = await getBestAccuracy({
    snippetId: currentRaceResult.snippetId,
    raceId: currentRaceResult.id,
  });

  if (bestAccuracy && bestAccuracy?.accuracy < currentRaceResult.accuracy) {
    const notificationData = {
      notification: {
        title: "New Record!",
        description: "You just achvied your highest accuracy!",
        ctaUrl: "/dashboard/races",
      },
      userId: user.id,
    };

    try {
      await pushNotification(notificationData);
      console.log("Best accuracy notification sent successfully!");
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  return (
    <main className="w-auto mb-32 lg:mb-40">
      <div className="flex flex-col justify-center gap-4 mt-5">
        <RaceAchievementBadges />
        <Heading
          centered
          title="Your Race Results"
          description="You did great! View your race results below"
        />
        <div className="grid grid-cols-2 gap-3 mx-auto md:grid-cols-4 md:gap-6">
          {cardObjects.map((c, idx) => {
            return (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-center text-warning">
                    {c.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">{c.value}</CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col px-8 rounded-xl">
        <Tabs defaultValue="Results" className="w-full m-5">
          <TabsList className="m-5">
            <TabsTrigger value="Results">Results</TabsTrigger>
            <TabsTrigger value="Replay">Replay</TabsTrigger>
            <TabsTrigger value="TopTen">Top 10</TabsTrigger>
            <TabsTrigger value="History">History</TabsTrigger>
          </TabsList>
          <TabsContent value="Results">
            <span className="text-2xl mx-auto text-primary flex-wrap sm:hidden">
              View in Larger Screen to Unlock Exciting Features!
            </span>
            <ResultChart code={currentSnippet?.code} />
          </TabsContent>
          <TabsContent value="History">
            <HistoryChart raceResult={raceResults} />
          </TabsContent>
          <TabsContent value="Replay">
            <ReplayCode code={currentSnippet?.code} />
          </TabsContent>
          <TabsContent value="TopTen">
            <TopTable snippetId={currentSnippet?.id} />
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 p-2">
        <Link
          title="Retry"
          className={cn(buttonVariants(), "gap-2 text-accent")}
          href={`/race/practice?snippetId=${currentRaceResult.snippetId}`}
          data-cy="race-button"
        >
          <Icons.refresh className="w-5 h-5" aria-hidden="true" /> Retry
        </Link>
        <Link
          title="New Race"
          className={cn(buttonVariants(), "text-accent")}
          href="/race"
        >
          <Icons.chevronRight className="w-5 h-5" aria-hidden="true" /> New Race
        </Link>
      </div>

      <div className="flex items-center justify-center m-2">
        <Badge
          variant="outline"
          className="flex items-center justify-center text-base border-2"
        >
          <Badge variant="secondary" className="text-warning">
            Tab
          </Badge>
          <span className="m-1">+</span>
          <Badge variant="secondary" className="text-warning">
            Enter
          </Badge>
          <span className="m-1">Restart Game</span>
        </Badge>
      </div>

      <div className="m-2">
        {currentRaceResult && (
          <Voting
            snippetId={currentRaceResult.snippetId}
            userId={user?.id ?? undefined}
            usersVote={usersVote ?? undefined}
          />
        )}
      </div>
    </main>
  );
}

export default AuthenticatedPage;