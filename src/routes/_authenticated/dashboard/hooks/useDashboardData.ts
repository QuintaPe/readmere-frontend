import { useState, useEffect } from "react";
import { useAuth } from "@/auth/auth-context";
import { listWords } from "@/modules/words";
import { listBooks } from "@/modules/books";
import { getProfile, getProfileStats } from "@/modules/profiles";

type DashboardData = {
  profile: Awaited<ReturnType<typeof getProfile>> | null;
  dueCount: number;
  totalWords: number;
  last7: Awaited<ReturnType<typeof getProfileStats>>;
  todayReviews: number;
  todayAdded: number;
  books: Awaited<ReturnType<typeof listBooks>>;
};

export function useDashboardData() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | undefined>();

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      getProfile().catch(() => null),
      listWords().catch(() => []),
      getProfileStats().catch(() => []),
      listBooks().catch(() => []),
    ]).then(([profile, words, last7, books]) => {
      const dueCount = words.filter(
        (w) =>
          w.status !== "known" &&
          w.status !== "ignored" &&
          w.srsDue <= new Date().toISOString(),
      ).length;

      const sortedBooks = [...books]
        .sort(
          (a, b) =>
            new Date(b.lastOpenedAt || 0).getTime() -
            new Date(a.lastOpenedAt || 0).getTime(),
        )
        .slice(0, 3);

      const todaySession = last7.find((s) => s.day === today);

      setData({
        profile,
        dueCount,
        totalWords: words.length,
        last7,
        todayReviews: todaySession?.reviews ?? 0,
        todayAdded: todaySession?.wordsAdded ?? 0,
        books: sortedBooks,
      });
    });
  }, [user.id]);

  const goal = data?.profile?.dailyGoal ?? 20;
  const todayDone = (data?.todayReviews ?? 0) + (data?.todayAdded ?? 0);
  const goalPct = Math.min(100, Math.round((todayDone / goal) * 100));

  return { data, goal, todayDone, goalPct };
}
