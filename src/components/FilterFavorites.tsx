import { useState } from 'react';
import { BookmarkPlus, Bookmark, Pencil, Trash2, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useEntryStore } from '../store/useEntryStore';
import type { FilterFavorite } from '../types';

export const FilterFavorites = () => {
  const {
    filterFavorites,
    filters,
    addFilterFavorite,
    updateFilterFavorite,
    deleteFilterFavorite,
    applyFilterFavorite,
  } = useEntryStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const isFiltersMatch = (fav: FilterFavorite): boolean => {
    return (
      fav.filters.cpName === filters.cpName &&
      fav.filters.type === filters.type &&
      fav.filters.status === filters.status &&
      fav.filters.readStatus === filters.readStatus &&
      fav.filters.favoriteOnly === filters.favoriteOnly &&
      fav.filters.searchKeyword === filters.searchKeyword &&
      fav.filters.tags.length === filters.tags.length &&
      fav.filters.tags.every((t) => filters.tags.includes(t)) &&
      fav.filters.customTags.length === filters.customTags.length &&
      fav.filters.customTags.every((t) => filters.customTags.includes(t))
    );
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    addFilterFavorite(newName.trim(), filters);
    setNewName('');
    setIsCreating(false);
  };

  const handleStartEdit = (fav: FilterFavorite) => {
    setEditingId(fav.id);
    setEditingName(fav.name);
  };

  const handleSaveEdit = () => {
    if (!editingName.trim() || !editingId) return;
    updateFilterFavorite(editingId, { name: editingName.trim() });
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div className="glass-panel p-5 mb-6 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:text-primary-600 transition-colors"
        >
          <Bookmark size={18} className="text-primary-500" />
          <h3 className="font-display font-semibold text-primary-700">智能收藏夹</h3>
          {isExpanded ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </button>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600 transition-colors font-display"
          >
            <BookmarkPlus size={14} />
            保存当前筛选
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {isCreating && (
            <div className="flex items-center gap-2 p-3 bg-primary-50 rounded-lg">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="输入收藏夹名称，如：散枫已完结甜文"
                className="input-field text-sm py-2 flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewName('');
                  }
                }}
              />
              <button
                onClick={handleCreate}
                className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                title="保存"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewName('');
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="取消"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {filterFavorites.length === 0 && !isCreating ? (
            <div className="text-center py-6 text-gray-400 text-sm font-display">
              <Bookmark size={32} className="mx-auto mb-2 opacity-50" />
              暂无收藏夹，点击上方按钮保存当前筛选条件
            </div>
          ) : (
            <div className="space-y-2">
              {filterFavorites.map((fav) => (
                <div
                  key={fav.id}
                  className={`group flex items-center gap-2 p-3 rounded-lg transition-all ${
                    isFiltersMatch(fav)
                      ? 'bg-primary-100 border border-primary-300'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {editingId === fav.id ? (
                    <>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="input-field text-sm py-1.5 flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="p-1.5 text-primary-500 hover:bg-primary-100 rounded transition-colors"
                        title="保存"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1.5 text-gray-500 hover:bg-gray-200 rounded transition-colors"
                        title="取消"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => applyFilterFavorite(fav.id)}
                        className="flex-1 flex items-center gap-2 text-left"
                      >
                        <Bookmark
                          size={16}
                          className={
                            isFiltersMatch(fav)
                              ? 'text-primary-500 fill-primary-500'
                              : 'text-gray-400'
                          }
                        />
                        <span
                          className={`text-sm font-display ${
                            isFiltersMatch(fav)
                              ? 'text-primary-700 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {fav.name}
                        </span>
                      </button>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleStartEdit(fav)}
                          className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                          title="重命名"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deleteFilterFavorite(fav.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
