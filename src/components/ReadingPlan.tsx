import { useState, useMemo } from 'react';
import {
  X,
  ChevronUp,
  ChevronDown,
  Check,
  SkipForward,
  Trash2,
  Plus,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Ban,
  BookMarked,
} from 'lucide-react';
import { useEntryStore } from '../store/useEntryStore';
import { TYPE_COLORS, STATUS_COLORS, READ_STATUS_COLORS, TAG_COLORS, CUSTOM_TAG_COLORS } from '../types';
import type { ReadingPlanItem, Entry } from '../types';

type TabKey = 'planned' | 'done' | 'skipped';

export const ReadingPlan = () => {
  const {
    isReadingPlanOpen,
    closeReadingPlan,
    readingPlan,
    entries,
    customTags,
    addToPlan,
    removeFromPlan,
    movePlanItem,
    markPlanDone,
    markPlanSkipped,
    clearPlanCompleted,
  } = useEntryStore();

  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('planned');
  const [showPool, setShowPool] = useState(false);

  const entryMap = useMemo(() => {
    const map = new Map<string, Entry>();
    entries.forEach((e) => map.set(e.id, e));
    return map;
  }, [entries]);

  const planIdSet = useMemo(
    () => new Set(readingPlan.map((item) => item.entryId)),
    [readingPlan]
  );

  const unreadPool = useMemo(
    () => entries.filter((e) => (e.readStatus === '未读' || e.readStatus === '在读') && !planIdSet.has(e.id)),
    [entries, planIdSet]
  );

  const sortedPlan = useMemo(
    () => [...readingPlan].sort((a, b) => a.order - b.order),
    [readingPlan]
  );

  const grouped = useMemo(() => {
    const planned = sortedPlan.filter((i) => i.status === 'planned');
    const done = sortedPlan.filter((i) => i.status === 'done');
    const skipped = sortedPlan.filter((i) => i.status === 'skipped');
    return { planned, done, skipped };
  }, [sortedPlan]);

  const currentList = grouped[activeTab];
  const hasCompleted = grouped.done.length > 0 || grouped.skipped.length > 0;

  if (!isReadingPlanOpen) return null;

  if (!isAnimating) {
    setIsAnimating(true);
  }

  const closeModal = () => {
    setIsAnimating(false);
    setTimeout(() => {
      closeReadingPlan();
      setShowPool(false);
      setActiveTab('planned');
    }, 200);
  };

  const renderPlanItem = (item: ReadingPlanItem) => {
    const entry = entryMap.get(item.entryId);
    if (!entry) return null;
    const entryCustomTags = customTags.filter((tag) => entry.customTags?.includes(tag.id));
    const isPlanned = item.status === 'planned';

    return (
      <div
        key={item.entryId}
        className={`rounded-xl border p-4 transition-all duration-200 ${
          item.status === 'done'
            ? 'bg-emerald-50/60 border-emerald-200'
            : item.status === 'skipped'
            ? 'bg-gray-50/60 border-gray-200'
            : 'bg-white/80 border-primary-100 hover:border-primary-300'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-display font-bold text-gray-800 truncate">
                {entry.workName}
              </h4>
              {item.status === 'done' && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 size={14} />
                </span>
              )}
              {item.status === 'skipped' && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium">
                  <Ban size={14} />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={13} className="text-primary-400" />
              <span className="font-display font-semibold text-primary-600 text-sm">
                {entry.cpName}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mb-1">
              <span className={`btn-tag text-xs ${TYPE_COLORS[entry.type]}`}>{entry.type}</span>
              <span className={`btn-tag text-xs ${STATUS_COLORS[entry.status]}`}>{entry.status}</span>
              <span className={`btn-tag text-xs ${READ_STATUS_COLORS[entry.readStatus]}`}>
                {entry.readStatus}
              </span>
              {entry.tags.slice(0, 3).map((tag) => (
                <span key={tag} className={`btn-tag text-xs ${TAG_COLORS[tag]}`}>{tag}</span>
              ))}
              {entryCustomTags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className={`btn-tag text-xs ${CUSTOM_TAG_COLORS[tag.color] || 'bg-gray-100 text-gray-700'}`}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>

          {isPlanned && (
            <div className="flex flex-col gap-1 flex-shrink-0">
              <div className="flex gap-1">
                <button
                  onClick={() => movePlanItem(item.entryId, 'up')}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-primary-100 text-gray-500 hover:text-primary-600 transition-colors"
                  title="上移"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => movePlanItem(item.entryId, 'down')}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-primary-100 text-gray-500 hover:text-primary-600 transition-colors"
                  title="下移"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => markPlanDone(item.entryId)}
                  className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition-colors"
                  title="标记已读"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => markPlanSkipped(item.entryId)}
                  className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-600 transition-colors"
                  title="暂时跳过"
                >
                  <SkipForward size={14} />
                </button>
              </div>
              <button
                onClick={() => removeFromPlan(item.entryId)}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors self-center"
                title="移除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}

          {!isPlanned && (
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                onClick={() => removeFromPlan(item.entryId)}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                title="移除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPoolItem = (entry: Entry) => {
    const entryCustomTags = customTags.filter((tag) => entry.customTags?.includes(tag.id));

    return (
      <div
        key={entry.id}
        className="rounded-xl border border-gray-200 bg-white/80 p-3 hover:border-primary-300 transition-all"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-display font-bold text-gray-800 truncate text-sm">{entry.workName}</h4>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={12} className="text-primary-400" />
              <span className="font-display font-semibold text-primary-600 text-xs">{entry.cpName}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className={`btn-tag text-xs ${TYPE_COLORS[entry.type]}`}>{entry.type}</span>
              <span className={`btn-tag text-xs ${READ_STATUS_COLORS[entry.readStatus]}`}>
                {entry.readStatus}
              </span>
              {entry.tags.slice(0, 2).map((tag) => (
                <span key={tag} className={`btn-tag text-xs ${TAG_COLORS[tag]}`}>{tag}</span>
              ))}
              {entryCustomTags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className={`btn-tag text-xs ${CUSTOM_TAG_COLORS[tag.color] || 'bg-gray-100 text-gray-700'}`}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => addToPlan(entry.id)}
            className="flex-shrink-0 p-1.5 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-600 transition-colors"
            title="加入今日计划"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeModal}
      />
      <div
        className={`relative glass-panel w-full max-w-2xl max-h-[90vh] overflow-hidden transition-all duration-300 flex flex-col ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-primary-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-display font-bold text-primary-700 flex items-center gap-2">
            <CalendarCheck size={22} />
            今日阅读计划
          </h2>
          <button
            onClick={closeModal}
            className="p-2 rounded-full hover:bg-primary-100 text-gray-500 hover:text-primary-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setActiveTab('planned')}
              className={`btn-tag text-sm ${
                activeTab === 'planned'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              待看 {grouped.planned.length > 0 && `(${grouped.planned.length})`}
            </button>
            <button
              onClick={() => setActiveTab('done')}
              className={`btn-tag text-sm ${
                activeTab === 'done'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              已读 {grouped.done.length > 0 && `(${grouped.done.length})`}
            </button>
            <button
              onClick={() => setActiveTab('skipped')}
              className={`btn-tag text-sm ${
                activeTab === 'skipped'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              已跳过 {grouped.skipped.length > 0 && `(${grouped.skipped.length})`}
            </button>
          </div>

          {hasCompleted && activeTab === 'planned' && (
            <button
              onClick={clearPlanCompleted}
              className="mb-4 text-xs text-gray-500 hover:text-red-500 transition-colors font-display flex items-center gap-1"
            >
              <Trash2 size={12} />
              清除已读和已跳过的记录
            </button>
          )}

          {currentList.length > 0 ? (
            <div className="space-y-3">
              {currentList.map(renderPlanItem)}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center text-primary-400">
                <BookMarked size={28} />
              </div>
              <p className="text-gray-500 font-display">
                {activeTab === 'planned' ? '还没有待看条目' : activeTab === 'done' ? '还没有已读条目' : '还没有跳过的条目'}
              </p>
            </div>
          )}

          {activeTab === 'planned' && (
            <div className="mt-6 pt-4 border-t border-primary-100">
              <button
                onClick={() => setShowPool(!showPool)}
                className="flex items-center gap-2 text-sm font-display font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                <Plus size={16} />
                {showPool ? '收起待看池' : `从待看池中添加（${unreadPool.length} 条未读/在读）`}
              </button>

              {showPool && (
                <div className="mt-4 space-y-2">
                  {unreadPool.length > 0 ? (
                    unreadPool.map(renderPoolItem)
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4 font-display">
                      没有未读或在读的条目可添加
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
