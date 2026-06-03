import { useMemo } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { useEntryStore } from '../store/useEntryStore';
import { EntryCard } from './EntryCard';

export const EntryList = () => {
  const { getFilteredEntries, entries } = useEntryStore();
  const filteredEntries = useMemo(() => getFilteredEntries(), [entries, getFilteredEntries]);

  if (filteredEntries.length === 0) {
    return (
      <div className="glass-panel p-12 text-center animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center text-primary-400">
          <BookOpen size={36} />
        </div>
        <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">
          {entries.length === 0 ? '还没有收藏的粮哦 ✨' : '没有找到匹配的条目'}
        </h3>
        <p className="text-gray-500 mb-4">
          {entries.length === 0
            ? '点击上方「添加新粮」按钮，开始记录你的宝藏同人文库吧！'
            : '试试调整筛选条件，或者清除筛选重新搜索~'}
        </p>
        {entries.length === 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Sparkles size={14} className="animate-pulse" />
            <span>支持录入作品、CP、类型、链接、作者、完成状态、虐甜标签、阅读状态和个人备注</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500 font-display">
          找到 <span className="font-semibold text-primary-600">{filteredEntries.length}</span> 条
          {filteredEntries.length !== entries.length && (
            <span className="text-gray-400"> / 共 {entries.length} 条</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEntries.map((entry, index) => (
          <EntryCard key={entry.id} entry={entry} index={index} />
        ))}
      </div>
    </div>
  );
};
