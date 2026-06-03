import { Search, Plus, Heart, BookMarked, BookOpen, Clock, FileSpreadsheet } from 'lucide-react';
import { useEntryStore } from '../store/useEntryStore';
import { BackupRestore } from './BackupRestore';

export const SearchBar = () => {
  const { filters, setFilters, openForm, openBatchImport, getStats } = useEntryStore();
  const stats = getStats();

  return (
    <div className="mb-6">
      <div className="glass-panel p-4 mb-4 animate-fade-in">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={filters.searchKeyword}
              onChange={(e) => setFilters({ searchKeyword: e.target.value })}
              placeholder="搜索作品名、CP、作者、标签、备注..."
              className="input-field pl-11 py-3"
            />
            {filters.searchKeyword && (
              <button
                onClick={() => setFilters({ searchKeyword: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm font-display"
              >
                清除
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <BackupRestore />
            <button
              onClick={() => openBatchImport()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-display font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="批量导入"
            >
              <FileSpreadsheet size={18} />
              <span className="hidden sm:inline">批量导入</span>
            </button>
            <button onClick={() => openForm()} className="btn-primary whitespace-nowrap flex items-center justify-center gap-2">
              <Plus size={18} />
              添加新粮
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-panel p-4 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-500">
              <BookMarked size={20} />
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-gray-800">{stats.total}</div>
              <div className="text-xs text-gray-500 font-medium">总条目</div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-peach/20 flex items-center justify-center text-accent-peach">
              <Heart size={20} fill="currentColor" />
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-gray-800">{stats.favorites}</div>
              <div className="text-xs text-gray-500 font-medium">收藏</div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-mint/20 flex items-center justify-center text-emerald-500">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-gray-800">{stats.read}</div>
              <div className="text-xs text-gray-500 font-medium">已读</div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-gray-800">{stats.unread}</div>
              <div className="text-xs text-gray-500 font-medium">待读</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
