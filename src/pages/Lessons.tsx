import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { BookOpen, ChevronRight, Eye, Plus, Loader2 } from "lucide-react";

export default function Lessons() {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState(9);
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>(undefined);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateTopic, setGenerateTopic] = useState("");

  const { data: subjects } = trpc.subjects.list.useQuery({ classLevel: selectedClass });
  const { data: lessons, isLoading, refetch } = trpc.lessons.list.useQuery({ subjectId: selectedSubject, status: "approved" as const, limit: 20, offset: 0 });
  const generateMutation = trpc.lessons.generate.useMutation({
    onSuccess: () => { setShowGenerate(false); setGenerateTopic(""); refetch(); },
  });

  const currentSubject = subjects?.find((s: any) => s.id === selectedSubject);

  const handleGenerate = () => {
    if (!generateTopic.trim() || !currentSubject) return;
    generateMutation.mutate({ topic: generateTopic, subjectId: currentSubject.id, subjectBn: currentSubject.name_bn, classLevel: selectedClass });
  };

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">পাঠ 📚</h1>
          <p className="text-gray-400 text-sm">বিস্তারিত পাঠ ও ব্যাখ্যা</p>
        </div>
        <button onClick={() => setShowGenerate(!showGenerate)} className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-500 transition-colors"><Plus size={20} className="text-white" /></button>
      </div>
      {showGenerate && (
        <div className="bg-gray-800/50 border border-gray-700/30 rounded-xl p-4 mb-6">
          <h3 className="text-white text-sm font-semibold mb-3">নতুন পাঠ তৈরি করো</h3>
          <input type="text" value={generateTopic} onChange={(e) => setGenerateTopic(e.target.value)} placeholder="বিষয় লেখো (যেমন: ওহমের সূত্র)" className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500 mb-3" />
          <button onClick={handleGenerate} disabled={!generateTopic.trim() || !currentSubject || generateMutation.isPending} className="w-full bg-indigo-600 rounded-xl py-2.5 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
            {generateMutation.isPending ? <><Loader2 size={16} className="animate-spin" /><span>তৈরি হচ্ছে...</span></> : "পাঠ তৈরি করো"}
          </button>
        </div>
      )}
      <div className="flex gap-2 mb-4">
        {[9, 10].map((cls) => (
          <button key={cls} onClick={() => { setSelectedClass(cls); setSelectedSubject(undefined); }} className={`flex-1 py-2.5 rounded-xl text-center text-sm font-semibold transition-all ${selectedClass === cls ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400"}`}>{cls}ম শ্রেণি</button>
        ))}
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => setSelectedSubject(undefined)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${!selectedSubject ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400"}`}>সব</button>
        {subjects?.map((s: any) => (
          <button key={s.id} onClick={() => setSelectedSubject(s.id)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedSubject === s.id ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400"}`}>{s.icon} {s.name_bn}</button>
        ))}
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map((i) => <div key={i} className="bg-gray-800/50 rounded-xl p-4 animate-pulse h-20" />)}</div>
      ) : !lessons?.length ? (
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6 text-center">
          <div className="text-3xl mb-3">📖</div>
          <p className="text-gray-300 text-sm font-medium mb-1">এখনো কোনো পাঠ নেই</p>
          <p className="text-gray-500 text-xs">উপরের + বাটনে ক্লিক করে নতুন পাঠ তৈরি করো</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson: any) => (
            <button key={lesson.id} onClick={() => navigate(`/lessons/${lesson.id}`)} className="w-full bg-gray-800/50 border border-gray-700/30 rounded-xl p-4 text-left hover:bg-gray-800 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center shrink-0"><BookOpen size={18} className="text-indigo-400" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium mb-1">{lesson.title_bn}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs">{lesson.subjects?.name_bn}</span>
                    <span className="text-gray-600 text-xs flex items-center gap-1"><Eye size={12} />{lesson.view_count || 0}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-600 shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
