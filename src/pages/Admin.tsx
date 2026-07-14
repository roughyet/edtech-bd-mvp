import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { BarChart3, BookOpen, Clock, AlertTriangle, CheckCircle, XCircle, RefreshCw, TrendingUp, Eye } from "lucide-react";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<"overview" | "pending" | "gaps" | "queries">("overview");
  const { data: analytics, refetch: refetchAnalytics } = trpc.analytics.overview.useQuery();
  const { data: pendingLessons, refetch: refetchPending } = trpc.lessons.list.useQuery({ status: "pending" as const, limit: 20, offset: 0 });
  const { data: gaps } = trpc.gaps.list.useQuery({ status: "open" as const, limit: 20 });
  const { data: recentQueries } = trpc.analytics.recentQueries.useQuery({ limit: 10 });
  const updateStatus = trpc.lessons.updateStatus.useMutation({
    onSuccess: () => { refetchPending(); refetchAnalytics(); },
  });

  const TABS = [
    { id: "overview" as const, label: "সারসংক্ষেপ", icon: BarChart3 },
    { id: "pending" as const, label: "অপেক্ষমাণ", icon: Clock },
    { id: "gaps" as const, label: "গ্যাপ", icon: AlertTriangle },
    { id: "queries" as const, label: "প্রশ্ন", icon: Eye },
  ];

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">অ্যাডমিন 🛡️</h1>
          <p className="text-gray-400 text-sm">ড্যাশবোর্ড ও ব্যবস্থাপনা</p>
        </div>
        <button onClick={() => refetchAnalytics()} className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-750 transition-colors"><RefreshCw size={16} className="text-gray-400" /></button>
      </div>
      <div className="flex gap-1 mb-6 bg-gray-800/50 rounded-xl p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${activeTab === tab.id ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-300"}`}>
              <Icon size={14} /><span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
      {activeTab === "overview" && analytics && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<TrendingUp size={20} className="text-indigo-400" />} label="মোট প্রশ্ন" value={analytics.totalQueries} />
          <StatCard icon={<BookOpen size={20} className="text-emerald-400" />} label="অনুমোদিত পাঠ" value={analytics.totalLessons} />
          <StatCard icon={<Clock size={20} className="text-amber-400" />} label="অপেক্ষমাণ" value={analytics.pendingLessons} />
          <StatCard icon={<AlertTriangle size={20} className="text-red-400" />} label="কন্টেন্ট গ্যাপ" value={analytics.totalGaps} />
        </div>
      )}
      {activeTab === "pending" && (
        <div className="space-y-3">
          {!pendingLessons?.length ? (
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6 text-center"><CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" /><p className="text-gray-300 text-sm">কোনো অপেক্ষমাণ পাঠ নেই! 🎉</p></div>
          ) : pendingLessons.map((lesson: any) => (
            <div key={lesson.id} className="bg-gray-800/50 border border-gray-700/30 rounded-xl p-4">
              <div className="mb-3">
                <div className="text-white text-sm font-medium mb-1">{lesson.title_bn}</div>
                <div className="text-gray-500 text-xs">{lesson.subjects?.name_bn} · {new Date(lesson.created_at).toLocaleDateString("bn-BD")}</div>
              </div>
              <div className="text-gray-400 text-xs leading-relaxed line-clamp-3 mb-3">{lesson.content_bn}</div>
              <div className="flex gap-2">
                <button onClick={() => updateStatus.mutate({ id: lesson.id, status: "approved" })} className="flex-1 bg-emerald-600/20 border border-emerald-500/30 rounded-xl py-2 text-emerald-400 text-xs font-medium hover:bg-emerald-600/30 transition-colors flex items-center justify-center gap-1"><CheckCircle size={14} />অনুমোদন</button>
                <button onClick={() => updateStatus.mutate({ id: lesson.id, status: "rejected" })} className="flex-1 bg-red-600/20 border border-red-500/30 rounded-xl py-2 text-red-400 text-xs font-medium hover:bg-red-600/30 transition-colors flex items-center justify-center gap-1"><XCircle size={14} />প্রত্যাখ্যান</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {activeTab === "gaps" && (
        <div className="space-y-3">
          {!gaps?.length ? (
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6 text-center"><CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" /><p className="text-gray-300 text-sm">কোনো কন্টেন্ট গ্যাপ নেই!</p></div>
          ) : gaps.map((gap: any) => (
            <div key={gap.id} className="bg-gray-800/50 border border-gray-700/30 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium mb-1">"{gap.query_text}"</div>
                  <div className="flex items-center gap-3 text-gray-500 text-xs"><span>{gap.search_count} বার খোঁজা</span><span>{gap.unique_students} জন ছাত্র</span></div>
                </div>
                <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-medium ${gap.status === "open" ? "bg-red-600/20 text-red-400" : "bg-emerald-600/20 text-emerald-400"}`}>{gap.status === "open" ? "খোলা" : "সমাধান"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {activeTab === "queries" && (
        <div className="space-y-3">
          {!recentQueries?.length ? (
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6 text-center"><p className="text-gray-300 text-sm">এখনো কোনো প্রশ্ন নেই</p></div>
          ) : recentQueries.map((q: any) => (
            <div key={q.id} className="bg-gray-800/50 border border-gray-700/30 rounded-xl p-3">
              <div className="text-white text-sm mb-1">{q.query_text}</div>
              <div className="flex items-center gap-3 text-gray-500 text-xs">
                <span className="bg-gray-700/50 px-2 py-0.5 rounded">{q.query_type}</span>
                <span>{new Date(q.created_at).toLocaleString("bn-BD")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/30 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-700/50 flex items-center justify-center">{icon}</div>
        <div>
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-gray-400 text-xs">{label}</div>
        </div>
      </div>
    </div>
  );
}
