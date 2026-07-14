import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { Send, Bot, User, BookOpen, Loader2, ChevronDown } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: any[];
}

export default function Ask() {
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get("subject");
  const initialName = searchParams.get("name");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<number | null>(initialSubject ? parseInt(initialSubject) : null);
  const [selectedClass, setSelectedClass] = useState(9);
  const [showSubjectPicker, setShowSubjectPicker] = useState(!initialSubject);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: subjects } = trpc.subjects.list.useQuery({ classLevel: selectedClass });

  const askMutation = trpc.ask.question.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer, sources: data.sources }]);
    },
    onError: (error) => {
      setMessages((prev) => [...prev, { role: "assistant", content: `দুঃখিত, একটি সমস্যা হয়েছে। আবার চেষ্টা করো।\n\nত্রুটি: ${error.message}` }]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, askMutation.isPending]);

  const handleSend = () => {
    if (!input.trim() || askMutation.isPending) return;
    const subject = subjects?.find((s: any) => s.id === selectedSubject);
    if (!subject) { setShowSubjectPicker(true); return; }
    const question = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    askMutation.mutate({ question, subjectId: subject.id, subjectBn: subject.name_bn, classLevel: selectedClass });
  };

  const currentSubject = subjects?.find((s: any) => s.id === selectedSubject);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-lg mx-auto">
      <div className="bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-semibold text-sm">AI শিক্ষক</h1>
            <p className="text-gray-400 text-xs">যেকোনো প্রশ্ন করো বাংলায়</p>
          </div>
          <button onClick={() => setShowSubjectPicker(!showSubjectPicker)} className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2 hover:bg-gray-750 transition-colors">
            <span className="text-sm text-gray-300">{currentSubject?.name_bn || initialName || "বিষয় বাছাই"}</span>
            <ChevronDown size={14} className="text-gray-500" />
          </button>
        </div>
        {showSubjectPicker && (
          <div className="mt-3 bg-gray-800 rounded-xl p-3 border border-gray-700">
            <div className="flex gap-2 mb-3">
              {[9, 10].map((cls) => (
                <button key={cls} onClick={() => setSelectedClass(cls)} className={`flex-1 py-2 rounded-lg text-center text-sm font-medium ${selectedClass === cls ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-400"}`}>{cls}ম</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {subjects?.map((s: any) => (
                <button key={s.id} onClick={() => { setSelectedSubject(s.id); setShowSubjectPicker(false); }} className={`p-2 rounded-lg text-sm text-left transition-colors ${selectedSubject === s.id ? "bg-indigo-600/20 border border-indigo-500/30 text-white" : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"}`}>
                  {s.icon} {s.name_bn}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !askMutation.isPending && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-4"><Bot size={32} className="text-indigo-400" /></div>
            <h2 className="text-white font-semibold mb-2">প্রশ্ন করো, উত্তর পাও! 🤖</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">পদার্থবিজ্ঞান, রসায়ন, গণিত বা উচ্চতর গণিত — যেকোনো বিষয়ে প্রশ্ন করো</p>
            <div className="space-y-2 w-full max-w-xs">
              {["ওহমের সূত্র ব্যাখ্যা করো", "রাসায়নিক বন্ধন কী?", "দ্বিঘাত সমীকরণ সমাধান করো", "সেট ও ফাংশন কী?"].map((q) => (
                <button key={q} onClick={() => setInput(q)} className="w-full text-left bg-gray-800/50 border border-gray-700/30 rounded-xl px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-colors">{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
        {askMutation.isPending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0"><Bot size={16} className="text-indigo-400" /></div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 size={14} className="animate-spin" /><span>ভাবছি...</span></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="bg-gray-900/80 backdrop-blur-lg border-t border-gray-800 px-4 py-3 shrink-0">
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-gray-800 rounded-2xl border border-gray-700 focus-within:border-indigo-500 transition-colors">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="প্রশ্ন লেখো এখানে..." rows={1} className="w-full bg-transparent text-white text-sm px-4 py-3 outline-none resize-none placeholder-gray-500" />
          </div>
          <button onClick={handleSend} disabled={!input.trim() || askMutation.isPending} className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? "bg-emerald-600/20" : "bg-indigo-600/20"}`}>
        {isUser ? <User size={16} className="text-emerald-400" /> : <Bot size={16} className="text-indigo-400" />}
      </div>
      <div className={`flex-1 min-w-0 ${isUser ? "max-w-[80%]" : ""}`}>
        <div className={`rounded-2xl px-4 py-3 ${isUser ? "bg-emerald-600/20 rounded-tr-sm ml-auto" : "bg-gray-800 rounded-tl-sm"}`}>
          <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{message.content}</div>
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2">
            <button onClick={() => setShowSources(!showSources)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
              <BookOpen size={12} /><span>{message.sources.length}টি উৎস {showSources ? "লুকাও" : "দেখো"}</span>
            </button>
            {showSources && (
              <div className="mt-2 space-y-2">
                {message.sources.map((src: any, i: number) => (
                  <div key={i} className="bg-gray-800/50 border border-gray-700/30 rounded-xl p-3">
                    <div className="text-xs text-indigo-400 font-medium mb-1">📚 {src.chapterTitle} {src.pageNumber ? `· পৃষ্ঠা ${src.pageNumber}` : ""}</div>
                    <div className="text-xs text-gray-400 line-clamp-3">{src.textContent}</div>
                    {src.similarity && <div className="text-xs text-gray-600 mt-1">মিল: {(src.similarity * 100).toFixed(0)}%</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
