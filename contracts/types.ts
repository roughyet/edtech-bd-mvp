export * from "./errors";

export interface Subject {
  id: number;
  nameEn: string;
  nameBn: string;
  classLevel: number;
  icon: string;
  color: string;
}

export interface Chapter {
  id: number;
  subjectId: number;
  chapterNumber: number;
  titleBn: string;
  titleEn: string;
  pageStart: number;
  pageEnd: number;
}

export interface SearchResult {
  id: string;
  textContent: string;
  sectionTitle: string;
  pageNumber: number;
  chapterTitle: string;
  similarity: number;
}

export interface AskResponse {
  answer: string;
  sources: SearchResult[];
  queryType: string;
}

export interface Lesson {
  id: string;
  subjectId: number;
  chapterId: number | null;
  titleBn: string;
  contentBn: string;
  lessonType: string;
  status: "pending" | "approved" | "rejected";
  viewCount: number;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  displayName: string | null;
  classLevel: number | null;
  isAdmin: boolean;
  isPremium: boolean;
  dailyExplainCount: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}
