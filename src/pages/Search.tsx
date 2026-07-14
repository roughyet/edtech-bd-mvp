import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Search as SearchIcon, BookOpen, Loader2 } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState(9);
  const [hasSearched, setHasSearched] = useState(false);

  const { data: subjects } = trpc.subjects.list.useQuery({ classLevel: selectedClass });
  const searchMutation = trpc.search.query.useQuery(
    { query, subjectId: selectedSubject || 0, limit: 5 },
    { enabled: false }
  );
  const gapReport = trpc.gaps.report.useMutation();

  const handleSearch = () => {
    if (!query.trim() || !selectedSubject) return;
    setHasSearched(true);
    searchMutation.refetch();
  };

  const results = searchMutation.data;
  const isLoading = searchMutation.isFetching;

  if (hasSearched && !isLoading && results && results.length === 0 && query.trim()) {
    gapReport.mutate({ queryText: query });
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">বইয়ে খোঁজো 🔍</h1>
        <p className="text-gray-400 text-sm">NCTB বইয়ে যেকোনো বিষয় খুঁজে বের করো</p>
      </div>
      <div className="flex gap-2 mb-4">
        {[9, 10].map((cls) => (
          <button key={cls} onClick={() => setSelectedClass(cls)} className={`flex-1 py-2.5 rounded-xl text-center text-sm font-semibold transition-all ${selectedClass === cls ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400"}`}>{cls}ম শ্রেণি</button>
        ))}
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {subjects?.map((s: any) => (
          <button key={s.id} onClick={() => setSelectedSubject(s.id)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedSubject === s.id ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-750"}`}>{s.icon} {s.name_bn}</button>
        ))}
      </div>
      <div className="relative mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="যেমন: ওহমের সূত্র, রাসায়নিক বন্ধন..." className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-11 pr-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors placeholder-gray-500" />
          </div>
          <button onClick={handleSearch} disabled={!query.trim() || !selectedSubject || isLoading} className="bg-indigo-600 rounded-xl px-5 py-3 text-white font-medium text-sm hover:bg-indigo-500 disabled:opacity-40 transition-colors shrink-0">
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : "খোঁজো"}
          </button>
        </div>
      </div>
      {isLoading && <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="bg-gray-800/50 rounded-xl p-4 animate-pulse h-24" />)}</div>}
      {hasSearched && !isLoading && results && results.length === 0 && (
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6 text-center">
          <div className="text-3xl mb-3">🔎</div>
          <p className="text-gray-300 text-sm font-medium mb-1">কোনো ফলাফল পাওয়া যায়নি</p>
          <p className="text-gray-500 text-xs">অন্যভাবে লিখে চেষ্টা করো অথবা "প্রশ্ন" ট্যাবে AI-কে জিজ্ঞেস করো</p>
        </div>
      )}
      {results && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-gray-400 text-xs">{results.length}টি ফলাফল পাওয়া গেছে</p>
          {results.map((result: any, i: number) => (
            <div key={i} className="bg-gray-800/50 border border-gray-700/30 rounded-xl p-4 hover:bg-gray-800 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={14} className="text-indigo-400 shrink-0" />
                    <span className="text-indigo-400 text-xs font-medium truncate">{result.chapterTitle}</span>
                    {result.pageNumber > 0 && <span className="text-gray-600 text-xs shrink-0">পৃ. {result.pageNumber}</span>}
                  </div>
                  {result.sectionTitle && <div className="text-white text-sm font-medium mb-1">{result.sectionTitle}</div>}
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">{result.textContent}</p>
                </div>
                <div className="shrink-0">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: result.similarity > 0.8 ? "#10b981" : result.similarity > 0.6 ? "#f59e0b" : "#6b7280" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!hasSearched && (
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6 text-center">
          <div className="text-3xl mb-3">📚</div>
          <p className="text-gray-300 text-sm font-medium mb-1">বিষয় বাছাই করে খোঁজো</p>
          <p className="text-gray-500 text-xs">উপরে শ্রেণি ও বিষয় নির্বাচন করো, তারপর খোঁজার বিষয় লেখো</p>
        </div>
      )}
    </div>
  );
}
