import { Routes, Route } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Ask from "./pages/Ask";
import SearchPage from "./pages/Search";
import Lessons from "./pages/Lessons";
import LessonView from "./pages/LessonView";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/ask" element={<Ask />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/lessons/:id" element={<LessonView />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  );
}
