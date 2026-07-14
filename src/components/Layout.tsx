import { Outlet, useLocation, Link } from "react-router";
import { Home, Search, MessageCircleQuestion, BookOpen, Shield } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "হোম" },
  { path: "/search", icon: Search, label: "খোঁজ" },
  { path: "/ask", icon: MessageCircleQuestion, label: "প্রশ্ন" },
  { path: "/lessons", icon: BookOpen, label: "পাঠ" },
  { path: "/admin", icon: Shield, label: "অ্যাডমিন" },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100">
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} className={`flex flex-col items-center justify-center gap-1 w-full py-1 transition-colors ${isActive ? "text-indigo-400" : "text-gray-500 hover:text-gray-300"}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
