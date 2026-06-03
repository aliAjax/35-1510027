import { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Merge,
  EyeOff,
  AlertTriangle,
  RefreshCw,
  Check,
  User,
  Link2,
  BookOpen,
  Heart,
} from 'lucide-react';
import { useEntryStore } from '../store/useEntryStore';
import { TYPE_COLORS, STATUS_COLORS, READ_STATUS_COLORS, TAG_COLORS, CUSTOM_TAG_COLORS } from '../types';
import type { Entry, DuplicateGroup } from '../types';

export const DuplicateChecker = () => {
  const {
    isDuplicateCheckerOpen,
    closeDuplicateChecker,
    duplicateGroups,
    findDuplicates,
    ignoreDuplicateGroup,
    keepEntry,
    mergeEntries,
    entries,
    customTags,
  } = useEntryStore();

  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isDuplicateCheckerOpen) {
      findDuplicates();
    }
  }, [isDuplicateCheckerOpen, findDuplicates]);

  const activeGroups = duplicateGroups.filter((g) => !g.ignored);

  if (!isDuplicateCheckerOpen) return null;

  if (!isAnimating) {
    setIsAnimating(true);
  }

  const closeModal = () => {
    setIsAnimating(false);
    setTimeout(() => {
      closeDuplicateChecker();
      setSelectedEntries({});
    }, 200);
  };

  const handleSelectEntry = (groupId: string, entryId: string) => {
    setSelectedEntries((prev) => ({
      ...prev,
      [groupId]: entryId,
    }));
  };

  const handleKeepEntry = (groupId: string) => {
    const entryId = selectedEntries[groupId];
    if (entryId) {
      keepEntry(groupId, entryId);
      setSelectedEntries((prev) => {
        const { [groupId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleMergeEntries = (groupId: string) => {
    const entryId = selectedEntries[groupId];
    if (entryId) {
      mergeEntries(groupId, entryId);
      setSelectedEntries((prev) => {
        const { [groupId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const renderEntryCard = (entry: Entry, groupId: string, isSelected: boolean) => {
    const entryCustomTags = customTags.filter((tag) => entry.customTags?.includes(tag.id));

    return (
      <div
        key={entry.id}
        onClick={() => handleSelectEntry(groupId, entry.id)}
        className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'bg-primary-50 border-primary-400 ring-2 ring-primary-300 shadow-md'
            : 'bg-white/80 border-gray-200 hover:border-primary-300'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-display font-bold text-gray-800 truncate">
                {entry.workName}
              </h4>
              {isSelected && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 text-white flex-shrink-0">
                  <Check size={12} />
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mb-2 text-sm text-gray-500 flex-wrap">
              {entry.cpName && (
                <span className="flex items-center gap-1">
                  <BookOpen size={13} className="text-primary-400" />
                  <span className="font-display font-semibold text-primary-600">
                    {entry.cpName}
                  </span>
                </span>
              )}
              {entry.author && (
                <span className="flex items-center gap-1">
                  <User size={13} className="text-gray-400" />
                  <span>{entry.author}</span>
                </span>
              )}
            </div>
            {entry.link && (
              <div className="flex items-center gap-1 mb-2 text-sm text-gray-500">
                <Link2 size={13} className="text-gray-400" />
                <span className="truncate max-w-xs">{entry.link}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              <span className={`btn-tag text-xs ${TYPE_COLORS[entry.type]}`}>
                {entry.type}
              </span>
              <span className={`btn-tag text-xs ${STATUS_COLORS[entry.status]}`}>
                {entry.status}
              </span>
              <span className={`btn-tag text-xs ${READ_STATUS_COLORS[entry.readStatus]}`}>
                {entry.readStatus}
              </span>
              {entry.tags.slice(0, 3).map((tag) => (
                <span key={tag} className={`btn-tag text-xs ${TAG_COLORS[tag]}`}>
                  {tag}
                </span>
              ))}
              {entryCustomTags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className={`btn-tag text-xs ${
                    CUSTOM_TAG_COLORS[tag.color] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {tag.name}
                </span>
              ))}
            </div>
            {entry.favorite && (
              <div className="mt-2 flex items-center gap-1 text-xs text-amber-500">
                <Heart size={12} fill="currentColor" />
                <span>已收藏</span>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                isSelected
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300 bg-white'
              }`}
            >
              {isSelected && <Check size={12} className="text-white" />}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGroup = (group: DuplicateGroup) => {
    const selectedId = selectedEntries[group.id];

    return (
      <div key={group.id} className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <span className="font-display font-semibold text-gray-700">
              疑似重复（{group.entries.length} 条）
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {group.matchReasons.map((reason) => (
              <span
                key={reason}
                className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-display"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {group.entries.map((entry) =>
            renderEntryCard(entry, group.id, selectedId === entry.id)
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleKeepEntry(group.id)}
            disabled={!selectedId}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-display text-sm transition-colors ${
              selectedId
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Check size={14} />
            保留选中，删除其他
          </button>
          <button
            onClick={() => handleMergeEntries(group.id)}
            disabled={!selectedId}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-display text-sm transition-colors ${
              selectedId
                ? 'bg-primary-500 text-white hover:bg-primary-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Merge size={14} />
            合并到选中
          </button>
          <button
            onClick={() => ignoreDuplicateGroup(group.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-display text-sm transition-colors"
          >
            <EyeOff size={14} />
            忽略
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
        className={`relative glass-panel w-full max-w-3xl max-h-[90vh] overflow-hidden transition-all duration-300 flex flex-col ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-primary-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-display font-bold text-primary-700 flex items-center gap-2">
            <Copy size={22} />
            重复检查
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => findDuplicates()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-primary-600 font-display text-sm transition-colors"
            >
              <RefreshCw size={14} />
              重新检查
            </button>
            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-primary-100 text-gray-500 hover:text-primary-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {entries.length < 2 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <Copy size={28} />
              </div>
              <p className="text-gray-500 font-display">
                至少需要 2 条记录才能进行重复检查
              </p>
            </div>
          ) : activeGroups.length > 0 ? (
            <div>
              <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700 font-display">
                  发现 {activeGroups.length} 组疑似重复的记录，请选择保留哪一条
                </p>
              </div>
              {activeGroups.map(renderGroup)}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500">
                <Check size={28} />
              </div>
              <p className="text-gray-500 font-display">
                太棒了！没有发现重复记录 🎉
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
