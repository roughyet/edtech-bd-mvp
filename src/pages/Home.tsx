import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Atom, FlaskConical, Calculator, Sigma, ChevronRight, Sparkles } from "lucide-react";

const SUBJECT_ICONS: Record<string, any> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Mathematics: Calculator,
  "Higher Mathematics": Sigma,
};

export default function Home() {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState(9);
  const { data: subjects, isLoading } = trpc.subjects.list.useQuery({ classLevel: selectedClass });

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="text-indigo-400" size={20} />
          <span className="text-indigo-400 text-xs font-semibold tracking-wider uppercase">শিখাBD</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">আসসালামু আলাইকুম! 👋</h1>
        <p className="text-gray-400 text-sm">তোমার পড়াশোনায় সাহায্য করতে আমি এখানে আছি</p>
      </div>
      <div className="flex gap-2 mb-6">
        {[9, 10].map((cls) => (
          <button key={cls} onClick={() => setSelectedClass(cls)} className={`flex-1 py-3 rounded-xl text-center font-semibold transition-all ${selectedClass === cls ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-gray-800 text-gray-400 hover:bg-gray-750"}`}>
            {cls}ম শ্রেণি
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button onClick={() => navigate("/ask")} className="bg-gradient-to-br from-indigo-600 to-purple-600 p-4 rounded-2xl text-left hover:scale-[1.02] transition-transform">
          <div className="text-2xl mb-2">💬</div>
          <div className="font-semibold text-white text-sm">প্রশ্ন করো</div>
          <div className="text-indigo-200 text-xs mt-1">AI দিয়ে বুঝে নাও</div>
        </button>
        <button onClick={() => navigate("/search")} className="bg-gradient-to-br from-emerald-600 to-teal-600 p-4 rounded-2xl text-left hover:scale-[1.02] transition-transform">
          <div className="text-2xl mb-2">🔍</div>
          <div className="font-semibold text-white text-sm">বইয়ে খোঁজো</div>
          <div className="text-emerald-200 text-xs mt-1">অধ্যায় খুঁজে বের করো</div>
        </button>
      </div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white mb-3">বিষয়সমূহ</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map((i) => <div key={i} className="bg-gray-800 rounded-2xl p-4 animate-pulse h-28" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {subjects?.map((subject: any) => {
              const Icon = SUBJECT_ICONS[subject.name_en] || Atom;
              return (
                <button key={subject.id} onClick={() => navigate(`/ask?subject=${subject.id}&name=${encodeURIComponent(subject.name_bn)}`)} className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 text-left hover:bg-gray-800 hover:border-gray-600 transition-all group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: subject.color + "20" }}>
                    <Icon size={22} style={{ color: subject.color }} />
                  </div>
                  <div className="font-medium text-white text-sm">{subject.name_bn}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-500 text-xs">{subject.name_en}</span>
                    <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">সাম্প্রতিক পাঠ</h2>
          <button onClick={() => navigate("/lessons")} className="text-indigo-400 text-xs font-medium hover:text-indigo-300">সব দেখো →</button>
        </div>
        <RecentLessons />
      </div>
    </div>
  );
}

function RecentLessons() {
  const navigate = useNavigate();
  const { data: lessons, isLoading } = trpc.lessons.list.useQuery({ status: "approved" as const, limit: 3, offset: 0 });
  if (isLoading) return <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="bg-gray-800/50 rounded-xl p-3 animate-pulse h-16" />)}</div>;
  if (!lessons?.length) return <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4 text-center"><p className="text-gray-500 text-sm">শীঘ্রই নতুন পাঠ যোগ হবে! 📚</p></div>;
  return (
    <div className="space-y-2">
      {lessons.map((lesson: any) => (
        <button key={lesson.id} onClick={() => navigate(`/lessons/${lesson.id}`)} className="w-full bg-gray-800/50 border border-gray-700/30 rounded-xl p-3 text-left hover:bg-gray-800 transition-colors flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center shrink-0"><span className="text-indigo-400 text-sm">📖</span></div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{lesson.title_bn}</div>
            <div className="text-gray-500 text-xs truncate">{lesson.subjects?.name_bn}</div>
          </div>
          <ChevronRight size={16} className="text-gray-600 shrink-0" />
        </button>
      ))}
    </div>
  );
}
