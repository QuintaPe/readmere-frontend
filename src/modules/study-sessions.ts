import { fetchApi } from "@/lib/api";
import type { StudySession } from "@/types";

export function listStudySessions(): Promise<StudySession[]> {
  return fetchApi("/study-sessions");
}

export function bumpStudySession(data: {
  day: string;
  reviews: number;
  wordsAdded: number;
  readingMinutes: number;
}): Promise<void> {
  return fetchApi("/study-sessions/bump", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
