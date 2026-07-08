import { fetchApi } from "@/lib/api";
import type { Profile, StudySession } from "@/types";

export function getProfile(): Promise<Profile> {
  return fetchApi("/profiles/me");
}

export function updateProfile(
  data: Partial<
    Pick<
      Profile,
      "displayName" | "nativeLanguage" | "targetLanguage" | "dailyGoal" | "newCardsPerDay" | "theme"
    >
  >,
): Promise<Profile> {
  return fetchApi("/profiles/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function getProfileStats(): Promise<StudySession[]> {
  return fetchApi("/profiles/stats");
}
