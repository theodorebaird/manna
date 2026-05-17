import { Routes, Route, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import { ScriptureProvider } from './components/ScriptureProvider';
import Home from './pages/Home';
import Read from './pages/Read';
import Learn from './pages/Learn';
import Lesson from './pages/Lesson';
import Memorize from './pages/Memorize';
import Settings from './pages/Settings';
import HowTo from './pages/HowTo';
import Topics from './pages/Topics';
import Pray from './pages/Pray';
import Books from './pages/Books';
import Saved from './pages/Saved';
import Plan from './pages/Plan';

export default function App() {
  return (
    <ScriptureProvider>
      <div className="min-h-full flex flex-col max-w-md mx-auto">
        <main className="flex-1 pb-24 px-4 pt-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/read" element={<Read />} />
            <Route path="/read/:book/:chapter" element={<Read />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/lesson/:id" element={<Lesson />} />
            <Route path="/memorize" element={<Memorize />} />
            <Route path="/pray" element={<Pray />} />
            <Route path="/topics" element={<Topics />} />
            <Route path="/books" element={<Books />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/plan/:id" element={<Plan />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/how-to" element={<HowTo />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </ScriptureProvider>
  );
}
