import { useState, useEffect } from 'react';
import { Sparkles, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useEntryStore } from '../store/useEntryStore';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { EntryList } from '../components/EntryList';
import { EntryForm } from '../components/EntryForm';
import { DetailModal } from '../components/DetailModal';
import { BatchImport } from '../components/BatchImport';
import { TagManager } from '../components/TagManager';
import { ReadingPlan } from '../components/ReadingPlan';
import { DuplicateChecker } from '../components/DuplicateChecker';
import { KanbanView } from '../components/KanbanView';
import { LinkManager } from '../components/LinkManager';
import { MigrationNotice } from '../components/MigrationNotice';
import { loadSampleDataIfEmpty } from '../utils/sampleData';

export default function Home() {
  const [showFilters, setShowFilters] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const { addEntry, entries } = useEntryStore();

  useEffect(() => {
    loadSampleDataIfEmpty(addEntry, entries.length);
  }, [addEntry, entries.length]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen">
      <MigrationNotice />
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-400 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.3)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.2)_0%,transparent_40%)]" />
        
        <div className="relative container py-8 px-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sparkles className="text-yellow-200 animate-float" size={28} />
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white tracking-wide">
              同人CP粮单整理
            </h1>
            <Sparkles className="text-yellow-200 animate-float" size={28} style={{ animationDelay: '1.5s' }} />
          </div>
          <p className="text-center text-white/80 font-display">
            记录你的宝藏同人文库 · 多维度筛选 · 快速检索
          </p>
        </div>
      </header>

      <main className={`container px-4 py-6 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <SearchBar />

        <div className="mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-display font-medium text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Filter size={16} />
            <span>{showFilters ? '收起筛选器' : '展开筛选器'}</span>
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showFilters && <FilterPanel />}

        <EntryList />
      </main>

      <footer className="py-6 text-center text-sm text-gray-400 font-display">
        <p>数据保存在浏览器本地，请定期备份重要数据 ✨</p>
      </footer>

      <EntryForm />
      <DetailModal />
      <BatchImport />
      <TagManager />
      <ReadingPlan />
      <DuplicateChecker />
      <KanbanView />
      <LinkManager />
    </div>
  );
}
