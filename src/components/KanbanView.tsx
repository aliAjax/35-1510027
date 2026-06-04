import { useState, useMemo, useCallback } from 'react';
import {
  X,
  ChevronDown,
  ChevronRight,
  Heart,
  Edit2,
  BookOpen,
  LayoutGrid,
  Users,
  BookMarked,
  Eye,
  Layers,
  ChevronsDown,
  ChevronsUp,
} from 'lucide-react';
import { useEntryStore } from '../store/useEntryStore';
import {
  TYPE_COLORS,
  STATUS_COLORS,
  READ_STATUS_COLORS,
  TAG_COLORS,
  CUSTOM_TAG_COLORS,
  READ_STATUSES,
  ENTRY_TYPES,
} from '../types';
import type { Entry, KanbanViewMode } from '../types';

const VIEW_MODES: { key: KanbanViewMode; label: string; icon: React.ReactNode }[] = [
  { key: 'cp', label: '按CP分组', icon: <Users size={16} /> },
  { key: 'work', label: '按作品分组', icon: <BookMarked size={16} /> },
  { key: 'readStatus', label: '按阅读状态', icon: <Eye size={16} /> },
  { key: 'type', label: '按类型分组', icon: <Layers size={16} /> },
];

const READ_STATUS_ORDER: Record<string, number> = {
  '未读': 0,
  '在读': 1,
  '已读': 2,
  '弃坑': 3,
};

export const KanbanView = () => {
  const {
    isKanbanOpen,
    closeKanban,
    kanbanViewMode,
    setKanbanViewMode,
    expandedKanbanGroups,
    toggleKanbanGroup,
    expandAllKanbanGroups,
    collapseAllKanbanGroups,
    getFilteredEntries,
    entries,
    filters,
    toggleFavorite,
    openForm,
    openDetail,
    customTags,
  } = useEntryStore();

  const [isAnimating, setIsAnimating] = useState(false);

  const filteredEntries = useMemo(
    () => getFilteredEntries(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, filters]
  );

  const grouped = useMemo(() => {
    const groups = new Map<string, Entry[]>();

    filteredEntries.forEach((entry) => {
      let key = '';
      switch (kanbanViewMode) {
        case 'cp':
          key = entry.cpName || '未指定CP';
          break;
        case 'work':
          key = entry.workName || '未命名作品';
          break;
        case 'readStatus':
          key = entry.readStatus;
          break;
        case 'type':
          key = entry.type;
          break;
      }
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    });

    return groups;
  }, [filteredEntries, kanbanViewMode]);

  const sortedGroupKeys = useMemo(() => {
    const keys = Array.from(grouped.keys());
    switch (kanbanViewMode) {
      case 'readStatus':
        keys.sort((a, b) => (READ_STATUS_ORDER[a] ?? 99) - (READ_STATUS_ORDER[b] ?? 99));
        break;
      case 'cp':
      case 'work':
        keys.sort((a, b) => {
          const countA = grouped.get(a)!.length;
          const countB = grouped.get(b)!.length;
          return countB - countA;
        });
        break;
      case 'type':
        const typeOrder = ENTRY_TYPES.reduce<Record<string, number>>((acc, t, i) => {
          acc[t] = i;
          return acc;
        }, {});
        keys.sort((a, b) => (typeOrder[a] ?? 99) - (typeOrder[b] ?? 99));
        break;
    }
    return keys;
  }, [grouped, kanbanViewMode]);

  const allExpanded = sortedGroupKeys.length > 0 && sortedGroupKeys.every((k) => expandedKanbanGroups[k]);

  const handleExpandAll = useCallback(() => {
    expandAllKanbanGroups(sortedGroupKeys);
  }, [expandAllKanbanGroups, sortedGroupKeys]);

  if (!isKanbanOpen) return null;

  if (!isAnimating) {
    setIsAnimating(true);
  }

  const closeModal = () => {
    setIsAnimating(false);
    setTimeout(() => {
      closeKanban();
    }, 200);
  };

  const handleFavorite = (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    toggleFavorite(entryId);
  };

  const handleEdit = (e: React.MouseEvent, entry: Entry) => {
    e.stopPropagation();
    openForm(entry);
  };

  const handleDetail = (entry: Entry) => {
    openDetail(entry);
  };

  const getGroupIcon = (key: string) => {
    switch (kanbanViewMode) {
      case 'readStatus': {
        const colorClass = READ_STATUS_COLORS[key as keyof typeof READ_STATUS_COLORS];
        return (
          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${colorClass || 'bg-gray-100 text-gray-600'}`}>
            {(key as string).charAt(0)}
          </span>
        );
      }
      case 'type': {
        const colorClass = TYPE_COLORS[key as keyof typeof TYPE_COLORS];
        return (
          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${colorClass || 'bg-gray-100 text-gray-600'}`}>
            {(key as string).charAt(0)}
          </span>
        );
      }
      case 'cp':
        return <Users size={16} className="text-primary-400" />;
      case 'work':
        return <BookMarked size={16} className="text-primary-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeModal}
      />
      <div
        className={`relative glass-panel w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden transition-all duration-300 flex flex-col ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-primary-100 px-4 sm:px-6 py-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-primary-700 flex items-center gap-2">
              <LayoutGrid size={22} />
              收藏看板
            </h2>
            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-primary-100 text-gray-500 hover:text-primary-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setKanbanViewMode(mode.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-display font-medium whitespace-nowrap transition-all ${
                    kanbanViewMode === mode.key
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {mode.icon}
                  <span className="hidden xs:inline sm:inline">{mode.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-500 font-display">
                {filteredEntries.length} 条
                {filteredEntries.length !== entries.length && (
                  <span className="text-gray-400"> / 共 {entries.length} 条</span>
                )}
              </span>
              <button
                onClick={allExpanded ? collapseAllKanbanGroups : handleExpandAll}
                className="flex items-center gap-1 text-xs font-display font-medium text-primary-600 hover:text-primary-700 transition-colors"
                title={allExpanded ? '全部折叠' : '全部展开'}
              >
                {allExpanded ? <ChevronsUp size={14} /> : <ChevronsDown size={14} />}
                <span className="hidden sm:inline">{allExpanded ? '全部折叠' : '全部展开'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center text-primary-400">
                <BookOpen size={28} />
              </div>
              <p className="text-gray-500 font-display">
                {entries.length === 0 ? '还没有收藏的粮哦' : '当前筛选条件下没有匹配条目'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedGroupKeys.map((groupKey) => {
                const groupEntries = grouped.get(groupKey)!;
                const isExpanded = expandedKanbanGroups[groupKey] !== false;

                return (
                  <div
                    key={groupKey}
                    className="rounded-xl border border-primary-100/60 bg-white/50 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleKanbanGroup(groupKey)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50/50 transition-colors text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-primary-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight size={16} className="text-primary-400 flex-shrink-0" />
                      )}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getGroupIcon(groupKey)}
                        <span className="font-display font-bold text-gray-800 truncate">
                          {groupKey}
                        </span>
                      </div>
                      <span className="flex-shrink-0 text-xs font-display font-medium text-primary-500 bg-primary-50 px-2.5 py-0.5 rounded-full">
                        {groupEntries.length}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-primary-50 px-3 sm:px-4 pb-3 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {groupEntries.map((entry) => {
                            const entryCustomTags = customTags.filter((tag) =>
                              entry.customTags?.includes(tag.id)
                            );

                            return (
                              <div
                                key={entry.id}
                                className="rounded-lg border border-gray-100 bg-white/80 p-3 hover:border-primary-200 hover:shadow-soft transition-all cursor-pointer group"
                                onClick={() => handleDetail(entry)}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      {kanbanViewMode !== 'work' && (
                                        <h5 className="font-display font-bold text-gray-800 text-sm truncate">
                                          {entry.workName}
                                        </h5>
                                      )}
                                      {kanbanViewMode !== 'cp' && (
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <BookOpen size={11} className="text-primary-400" />
                                          <span className="font-display text-primary-600 text-xs font-medium truncate max-w-[80px]">
                                            {entry.cpName}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {kanbanViewMode === 'work' && (
                                      <div className="flex items-center gap-1 mb-1">
                                        <BookOpen size={11} className="text-primary-400" />
                                        <span className="font-display text-primary-600 text-xs font-medium truncate">
                                          {entry.cpName}
                                        </span>
                                      </div>
                                    )}

                                    <div className="flex flex-wrap gap-1 mb-1.5">
                                      {kanbanViewMode !== 'type' && (
                                        <span className={`btn-tag text-[10px] leading-tight px-1.5 py-0.5 ${TYPE_COLORS[entry.type]}`}>
                                          {entry.type}
                                        </span>
                                      )}
                                      <span className={`btn-tag text-[10px] leading-tight px-1.5 py-0.5 ${STATUS_COLORS[entry.status]}`}>
                                        {entry.status}
                                      </span>
                                      {kanbanViewMode !== 'readStatus' && (
                                        <span className={`btn-tag text-[10px] leading-tight px-1.5 py-0.5 ${READ_STATUS_COLORS[entry.readStatus]}`}>
                                          {entry.readStatus}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap gap-1">
                                      {entry.tags.slice(0, 3).map((tag) => (
                                        <span key={tag} className={`btn-tag text-[10px] leading-tight px-1.5 py-0.5 ${TAG_COLORS[tag]}`}>
                                          {tag}
                                        </span>
                                      ))}
                                      {entryCustomTags.slice(0, 2).map((tag) => (
                                        <span
                                          key={tag.id}
                                          className={`btn-tag text-[10px] leading-tight px-1.5 py-0.5 ${CUSTOM_TAG_COLORS[tag.color] || 'bg-gray-100 text-gray-700'}`}
                                        >
                                          {tag.name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-1 flex-shrink-0">
                                    <button
                                      onClick={(e) => handleFavorite(e, entry.id)}
                                      className={`p-1.5 rounded-lg transition-all ${
                                        entry.favorite
                                          ? 'text-accent-peach hover:bg-accent-peach/10'
                                          : 'text-gray-300 hover:text-accent-peach hover:bg-accent-peach/5'
                                      }`}
                                    >
                                      <Heart size={14} fill={entry.favorite ? 'currentColor' : 'none'} />
                                    </button>
                                    <button
                                      onClick={(e) => handleEdit(e, entry)}
                                      className="p-1.5 rounded-lg text-gray-300 hover:text-primary-600 hover:bg-primary-50 transition-all"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
