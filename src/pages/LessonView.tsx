import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { ArrowLeft, Eye, Calendar, Share2 } from "lucide-react";

export default function LessonView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lesson, isLoading, error } = trpc.lessons.get.useQuery({ id: id || "" }, { enabled: !!id });

  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded-lg w-3/4" />
          <div className="h-4 bg-gray-800 rounded-lg w-1/4" />
          <div className="space-y-2 mt-8">{[1,2,3,4,5].map((i) => <div key={i} className="h-4 bg-gray-800 rounded-lg" />)}</div>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto text-center py-20">
        <div className="text-4xl mb-4">😕</div>
        <p className="text-gray-300 text-sm mb-4">পাঠটি খুঁজে পাওয়া যায়নি</p>
        <button onClick={() => navigate("/lessons")} className="bg-indigo-600 rounded-xl px-6 py-2.5 text-white text-sm">পাঠ তালিকায় ফিরে যাও</button>
      </div>
    );
  }

  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-bold text-white mt-6 mb-3 flex items-center gap-2"><span className="w-1 h-5 bg-indigo-500 rounded-full" />{line.replace("## ", "")}</h2>;
      if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold text-gray-200 mt-4 mb-2">{line.replace("### ", "")}</h3>;
      if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-white font-semibold text-sm mt-3 mb-1">{line.replace(/\*\*/g, "")}</p>;
      if (line.startsWith("- ") || line.startsWith("* ")) return <div key={i} className="flex gap-2 text-gray-300 text-sm leading-relaxed ml-2"><span className="text-indigo-400 mt-1">•</span><span>{line.replace(/^[-*] /, "")}</span></div>;
      if (/^\d+\./.test(line)) return <div key={i} className="flex gap-2 text-gray-300 text-sm leading-relaxed ml-2"><span className="text-indigo-400 font-medium">{line.match(/^\d+/)?.[0]}.</span><span>{line.replace(/^\d+\.\s*/, "")}</span></div>;
      if (line.trim() === "") return <div key={i} className="h-3" />;
      return <p key={i} className="text-gray-300 text-sm leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="px-4 pt-4 pb-4 max-w-lg mx-auto">
      <button onClick={() => navigate("/lessons")} className="flex items-center gap-2 text-gray-400 text-sm mb-4 hover:text-white transition-colors">
        <ArrowLeft size={16} /><span>পাঠ তালিকা</span>
      </button>
      <div className="bg-gray-800/50 border border-gray-700/30 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-indigo-600/20 text-indigo-400 text-xs font-medium px-2.5 py-1 rounded-full">{lesson.subjects?.name_bn || "পাঠ"}</span>
          {lesson.status === "approved" && <span className="bg-emerald-600/20 text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full">✓ অনুমোদিত</span>}
        </div>
        <h1 className="text-xl font-bold text-white mb-3">{lesson.title_bn}</h1>
        <div className="flex items-center gap-4 text-gray-500 text-xs">
          <span className="flex items-center gap-1"><Eye size={12} />{lesson.view_count || 0} বার দেখা</span>
          <span className="flex items-center gap-1"><Calendar size={12} />{new Date(lesson.created_at).toLocaleDateString("bn-BD")}</span>
        </div>
      </div>
      <div className="prose prose-invert max-w-none">{renderContent(lesson.content_bn)}</div>
      <div className="mt-8 pt-6 border-t border-gray-800">
        <button onClick={() => { if (navigator.share) navigator.share({ title: lesson.title_bn, text: `${lesson.title_bn} — শিখাBD-এ পড়ো`, url: window.location.href }); }} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-750 transition-colors">
          <Share2 size={16} /><span>শেয়ার করো</span>
        </button>
      </div>
    </div>
  );
}
