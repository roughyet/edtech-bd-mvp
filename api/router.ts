import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getSupabaseAdmin } from "./services/supabase";
import { searchChunks, askQuestion, generateLesson } from "./services/rag";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  subjects: createRouter({
    list: publicQuery
      .input(z.object({ classLevel: z.number().min(9).max(10).optional() }).optional())
      .query(async ({ input }) => {
        const supabase = getSupabaseAdmin();
        let query = supabase.from("subjects").select("*").order("class_level").order("name_en");
        if (input?.classLevel) query = query.eq("class_level", input.classLevel);
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data || [];
      }),
  }),

  chapters: createRouter({
    list: publicQuery
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ input }) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from("chapters").select("*").eq("subject_id", input.subjectId).order("chapter_number");
        if (error) throw new Error(error.message);
        return data || [];
      }),
  }),

  search: createRouter({
    query: publicQuery
      .input(z.object({ query: z.string().min(1).max(500), subjectId: z.number(), limit: z.number().min(1).max(10).default(5) }))
      .query(async ({ input }) => {
        return await searchChunks(input.query, input.subjectId, input.limit);
      }),
  }),

  ask: createRouter({
    question: publicQuery
      .input(z.object({ question: z.string().min(1).max(1000), subjectId: z.number(), subjectBn: z.string(), classLevel: z.number().min(9).max(10) }))
      .mutation(async ({ input }) => {
        const result = await askQuestion(input.question, input.subjectId, input.subjectBn, input.classLevel);
        const supabase = getSupabaseAdmin();
        await supabase.from("query_logs").insert({ query_text: input.question, query_type: "ask", subject_id: input.subjectId });
        return result;
      }),
  }),

  lessons: createRouter({
    list: publicQuery
      .input(z.object({ subjectId: z.number().optional(), status: z.enum(["pending", "approved", "rejected"]).default("approved"), limit: z.number().min(1).max(50).default(20), offset: z.number().min(0).default(0) }))
      .query(async ({ input }) => {
        const supabase = getSupabaseAdmin();
        let query = supabase.from("lessons").select("*, subjects(name_bn, name_en)").eq("status", input.status).order("created_at", { ascending: false }).range(input.offset, input.offset + input.limit - 1);
        if (input.subjectId) query = query.eq("subject_id", input.subjectId);
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data || [];
      }),

    get: publicQuery
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from("lessons").select("*, subjects(name_bn, name_en)").eq("id", input.id).single();
        if (error) throw new Error(error.message);
        await supabase.from("lessons").update({ view_count: (data.view_count || 0) + 1 }).eq("id", input.id);
        return data;
      }),

    generate: publicQuery
      .input(z.object({ topic: z.string().min(1).max(255), subjectId: z.number(), subjectBn: z.string(), classLevel: z.number().min(9).max(10) }))
      .mutation(async ({ input }) => {
        const { content } = await generateLesson(input.topic, input.subjectId, input.subjectBn, input.classLevel);
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from("lessons").insert({ subject_id: input.subjectId, title_bn: input.topic, content_bn: content, lesson_type: "explanation", status: "pending" }).select().single();
        if (error) throw new Error(error.message);
        return data;
      }),

    updateStatus: publicQuery
      .input(z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected"]) }))
      .mutation(async ({ input }) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from("lessons").update({ status: input.status }).eq("id", input.id).select().single();
        if (error) throw new Error(error.message);
        return data;
      }),
  }),

  gaps: createRouter({
    list: publicQuery
      .input(z.object({ status: z.enum(["open", "in_progress", "resolved"]).default("open"), limit: z.number().min(1).max(50).default(20) }))
      .query(async ({ input }) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from("content_gaps").select("*").eq("status", input.status).order("search_count", { ascending: false }).limit(input.limit);
        if (error) throw new Error(error.message);
        return data || [];
      }),

    report: publicQuery
      .input(z.object({ queryText: z.string().min(1).max(500) }))
      .mutation(async ({ input }) => {
        const supabase = getSupabaseAdmin();
        const { data: existing } = await supabase.from("content_gaps").select("*").eq("query_text", input.queryText).eq("status", "open").single();
        if (existing) {
          await supabase.from("content_gaps").update({ search_count: existing.search_count + 1, last_seen: new Date().toISOString() }).eq("id", existing.id);
        } else {
          await supabase.from("content_gaps").insert({ query_text: input.queryText });
        }
        return { success: true };
      }),
  }),

  analytics: createRouter({
    overview: publicQuery.query(async () => {
      const supabase = getSupabaseAdmin();
      const [{ count: tq }, { count: tl }, { count: pl }, { count: tg }] = await Promise.all([
        supabase.from("query_logs").select("*", { count: "exact", head: true }),
        supabase.from("lessons").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("lessons").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("content_gaps").select("*", { count: "exact", head: true }).eq("status", "open"),
      ]);
      return { totalQueries: tq || 0, totalLessons: tl || 0, pendingLessons: pl || 0, totalGaps: tg || 0 };
    }),

    recentQueries: publicQuery
      .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
      .query(async ({ input }) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from("query_logs").select("*").order("created_at", { ascending: false }).limit(input.limit);
        if (error) throw new Error(error.message);
        return data || [];
      }),
  }),
});

export type AppRouter = typeof appRouter;
