import { fetchApi } from "@/lib/api";

export interface AdminStats {
  users: number;
  books: number;
  words: number;
  decks: number;
}

export interface TimelinePoint {
  day: string;
  count: number;
}

export interface AdminTimeline {
  newUsers: TimelinePoint[];
  newWords: TimelinePoint[];
  newBooks: TimelinePoint[];
}

export function getAdminStats(): Promise<AdminStats> {
  return fetchApi("/admin/stats");
}

export function getAdminTimeline(): Promise<AdminTimeline> {
  return fetchApi("/admin/stats/timeline");
}
