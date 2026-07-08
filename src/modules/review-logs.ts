import { fetchApi } from "@/lib/api";

export interface ReviewLog {
  id: string;
  userId: string;
  wordId: string;
  rating: 0 | 1 | 2 | 3;
  reviewedAt: string;
}

export function logReview(wordId: string, rating: number): Promise<void> {
  return fetchApi("/review-logs", {
    method: "POST",
    body: JSON.stringify({ wordId, rating }),
  });
}

export function listReviewLogs(days = 30): Promise<ReviewLog[]> {
  return fetchApi(`/review-logs?days=${days}`);
}
