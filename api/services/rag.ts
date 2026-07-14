import { getSupabaseAdmin } from "./supabase";
import { nimChat, nimEmbedSingle } from "./nim";

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

const SYSTEM_PROMPT_TEMPLATE = `তুমি বাংলাদেশের একজন অভিজ্ঞ বিজ্ঞান শিক্ষক। তুমি {class_level}ম শ্রেণির {subject_bn} বিষয়ে পড়াও।

নিয়মাবলী:
১. সর্বদা বাংলায় উত্তর দাও (বৈজ্ঞানিক পরিভাষা ইংরেজিতে রাখতে পারো)
২. সংখ্যা ও সূত্র সঠিকভাবে লেখো
৩. উদাহরণ দিয়ে বুঝিয়ে বলো
৪. বইয়ের অধ্যায়ের রেফারেন্স দাও যখন সম্ভব
৫. উত্তর ৪০০ শব্দের মধ্যে রাখো
৬. জটিল বিষয় সহজভাবে ব্যাখ্যা করো
৭. গণিতের সমস্যা ধাপে ধাপে সমাধান করো
৮. ছাত্র-ছাত্রীদের বয়স ১২-১৬ বছর — সেই অনুযায়ী সহজ ভাষা ব্যবহার করো

প্রসঙ্গ তথ্য (Context):
{context}

উপরের প্রসঙ্গ তথ্য ব্যবহার করে নিচের প্রশ্নের উত্তর দাও। যদি প্রসঙ্গে উত্তর না থাকে, তাহলে বলো যে তুমি নিশ্চিত নও কিন্তু সাধারণ জ্ঞান দিয়ে উত্তর দেওয়ার চেষ্টা করো।`;

export async function searchChunks(
  query: string,
  subjectId: number,
  matchCount: number = 5
): Promise<SearchResult[]> {
  const supabase = getSupabaseAdmin();
  const queryEmbedding = await nimEmbedSingle(query);
  const { data, error } = await supabase.rpc("search_chunks", {
    query_embedding: queryEmbedding,
    match_subject_id: subjectId,
    match_count: matchCount,
  });
  if (error) {
    console.error("Vector search error:", error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    textContent: row.text_content,
    sectionTitle: row.section_title || "",
    pageNumber: row.page_number || 0,
    chapterTitle: row.chapter_title_bn || "",
    similarity: row.similarity || 0,
  }));
}

export async function askQuestion(
  question: string,
  subjectId: number,
  subjectBn: string,
  classLevel: number
): Promise<AskResponse> {
  const sources = await searchChunks(question, subjectId, 5);
  const context = sources
    .slice(0, 3)
    .map((s, i) => `[উৎস ${i + 1}] অধ্যায়: ${s.chapterTitle}\n${s.textContent}`)
    .join("\n\n---\n\n");

  const systemPrompt = SYSTEM_PROMPT_TEMPLATE
    .replace("{class_level}", String(classLevel))
    .replace("{subject_bn}", subjectBn)
    .replace("{context}", context || "কোনো প্রাসঙ্গিক তথ্য পাওয়া যায়নি।");

  const answer = await nimChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    { temperature: 0.3, maxTokens: 1024 }
  );

  return { answer, sources, queryType: sources.length > 0 ? "rag" : "general" };
}

export async function generateLesson(
  topic: string,
  subjectId: number,
  subjectBn: string,
  classLevel: number
): Promise<{ content: string; sources: SearchResult[] }> {
  const sources = await searchChunks(topic, subjectId, 5);
  const context = sources
    .slice(0, 3)
    .map((s, i) => `[উৎস ${i + 1}] অধ্যায়: ${s.chapterTitle}\n${s.textContent}`)
    .join("\n\n---\n\n");

  const lessonPrompt = `তুমি বাংলাদেশের একজন অভিজ্ঞ বিজ্ঞান শিক্ষক। {class_level}ম শ্রেণির {subject_bn} বিষয়ে একটি পূর্ণাঙ্গ পাঠ তৈরি করো।

বিষয়: {topic}

প্রসঙ্গ তথ্য:
{context}

পাঠের কাঠামো:
## ভূমিকা
(বিষয়ের পরিচিতি — ২-৩ বাক্য)

## মূল ব্যাখ্যা
(বিস্তারিত ব্যাখ্যা, উদাহরণ সহ)

## গুরুত্বপূর্ণ সূত্র/সংজ্ঞা
(যদি থাকে)

## উদাহরণ
(১-২টি সমাধানকৃত উদাহরণ)

## অনুশীলনী
(২-৩টি অনুশীলন প্রশ্ন)

## সারসংক্ষেপ
(মূল শিক্ষা — ২-৩ বাক্য)

সম্পূর্ণ বাংলায় লেখো। ছাত্র-ছাত্রীদের বয়স ১২-১৬ বছর।`;

  const filledPrompt = lessonPrompt
    .replace("{class_level}", String(classLevel))
    .replace("{subject_bn}", subjectBn)
    .replace("{topic}", topic)
    .replace("{context}", context || "কোনো প্রাসঙ্গিক তথ্য পাওয়া যায়নি।");

  const content = await nimChat(
    [{ role: "user", content: filledPrompt }],
    { temperature: 0.4, maxTokens: 2048 }
  );

  return { content, sources };
}
