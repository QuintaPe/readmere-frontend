export interface SessionUser {
  id: string;
  email: string;
  role: string;
  displayName: string | null;
  targetLanguage?: string | null;
}

export interface Word {
  id: string;
  term: string;
  translation: string | null;
  definition: string | null;
  example: string | null;
  language: string;
  status: string;
  srsDue: string;
  srsInterval: number;
  srsEase: number;
  srsReps: number;
  srsLapses: number;
  lastReviewedAt: string | null;
  phonetic: string | null;
  partOfSpeech: string | null;
  synonyms: string | null;
  lemma: string | null;
  difficulty: string | null;
  sourceBookId: string | null;
  source: string | null;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string | null;
  language: string;
  filePath: string;
  progress: number;
  currentCfi: string | null;
  lastOpenedAt: string | null;
  coverUrl: string | null;
  coverPath?: string | null;
  genre?: string | null;
  publishedYear?: number | null;
  synopsis?: string | null;
  createdAt: string;
}

export interface Deck {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  wordCount: number;
}

export interface StudySession {
  day: string;
  reviews: number;
  wordsAdded: number;
  readingMinutes: number;
}

export interface Profile {
  id: string;
  displayName: string | null;
  nativeLanguage: string;
  targetLanguage: string;
  dailyGoal: number;
  newCardsPerDay: number;
  theme: string;
  streakCurrent: number;
  streakLongest: number;
  lastStudyDate: string | null;
}

export interface PagedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  displayName: string | null;
  targetLanguage: string | null;
}

export interface AdminWord {
  id: string;
  term: string;
  translation: string | null;
  language: string;
  status: string;
  createdAt: string;
  ownerEmail: string | null;
}

export interface AdminDeck {
  id: string;
  name: string;
  description: string | null;
  color: string;
  wordCount: number;
  createdAt: string;
  ownerEmail: string | null;
}

export interface AdminBook {
  id: string;
  title: string;
  author: string | null;
  language: string;
  progress: number;
  createdAt: string;
  ownerEmail: string | null;
}
