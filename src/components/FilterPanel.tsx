import { Filter, RotateCcw, Heart, Tags, Calendar, X, Star, Clock } from 'lucide-react';
import { useEntryStore } from '../store/useEntryStore';
import { FilterFavorites } from './FilterFavorites';
import {
  ENTRY_TYPES,
  COMPLETION_STATUSES,
  READ_STATUSES,
  FLAVOR_TAGS,
  TYPE_COLORS,
  STATUS_COLORS,
  TAG_COLORS,
  CUSTOM_TAG_COLORS,
} from '../types';
import type { EntryType, CompletionStatus, ReadStatus, FlavorTag, RatingFilter } from '../types';

export const FilterPanel = () => {
  const { filters, setFilters, resetFilters, getUniqueCpNames, customTags, openTagManager } = useEntryStore();
  const cpNames = getUniqueCpNames();

  const hasActiveFilters =
    filters.cpName ||
    filters.type !== 'all' ||
    filters.status !== 'all' ||
    filters.tags.length > 0 ||
    filters.customTags.length > 0 ||
    filters.readStatus !== 'all' ||
    filters.favoriteOnly ||
    filters.rating !== 'all' ||
    filters.hasRevisitDate !== 'all' ||
    filters.revisitDateFrom !== null ||
    filters.revisitDateTo !== null ||
    filters.searchKeyword ||
    filters.dateFrom !== null ||
    filters.dateTo !== null;

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const clearDateFilter = () => {
    setFilters({ dateFrom: null, dateTo: null });
  };

  const toggleTag = (tag: FlavorTag) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    setFilters({ tags: newTags });
  };

  const toggleCustomTag = (tagId: string) => {
    const newCustomTags = filters.customTags.includes(tagId)
      ? filters.customTags.filter((id) => id !== tagId)
      : [...filters.customTags, tagId];
    setFilters({ customTags: newCustomTags });
  };

  return (
    <>
      <FilterFavorites />
      <div className="glass-panel p-5 mb-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-primary-500" />
          <h3 className="font-display font-semibold text-primary-700">筛选条件</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors font-display"
          >
            <RotateCcw size={14} />
            重置筛选
          </button>
        )}
      </div>

      <div className="space-y-4">
        {cpNames.length > 0 && (
          <div>
            <label className="block text-xs font-display font-semibold text-gray-500 uppercase tracking-wide mb-2">
              CP名称
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters({ cpName: '' })}
                className={`btn-tag text-xs ${
                  !filters.cpName
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              {cpNames.map((cp) => (
                <button
                  key={cp}
                  onClick={() => setFilters({ cpName: filters.cpName === cp ? '' : cp })}
                  className={`btn-tag text-xs ${
                    filters.cpName === cp
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                  }`}
                >
                  {cp}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-display font-semibold text-gray-500 uppercase tracking-wide mb-2">
            类型
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilters({ type: 'all' })}
              className={`btn-tag text-xs ${
                filters.type === 'all'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            {ENTRY_TYPES.map((type) => (
              <button
                key={type}
                onClick={() =>
                  setFilters({ type: (filters.type === type ? 'all' : type) as EntryType | 'all' })
                }
                className={`btn-tag text-xs ${
                  filters.type === type
                    ? `${TYPE_COLORS[type]} shadow-md border-current`
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-display font-semibold text-gray-500 uppercase tracking-wide mb-2">
            完成状态
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilters({ status: 'all' })}
              className={`btn-tag text-xs ${
                filters.status === 'all'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            {COMPLETION_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() =>
                  setFilters({
                    status: (filters.status === status ? 'all' : status) as CompletionStatus | 'all',
                  })
                }
                className={`btn-tag text-xs ${
                  filters.status === status
                    ? `${STATUS_COLORS[status]} shadow-md border-current`
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-display font-semibold text-gray-500 uppercase tracking-wide mb-2">
            虐甜标签
          </label>
          <div className="flex flex-wrap gap-2">
            {FLAVOR_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`btn-tag text-xs ${
                  filters.tags.includes(tag)
                    ? `${TAG_COLORS[tag]} shadow-md border-current`
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {customTags.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-display font-semibold text-gray-500 uppercase tracking-wide">
                自定义标签
              </label>
              <button
                onClick={() => openTagManager()}
                className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-display"
              >
                <Tags size={12} />
                管理
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {customTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleCustomTag(tag.id)}
                  className={`btn-tag text-xs ${
                    filters.customTags.includes(tag.id)
                      ? `${CUSTOM_TAG_COLORS[tag.color] || 'bg-gray-100 text-gray-700'} shadow-md border-current`
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-display font-semibold text-gray-500 uppercase tracking-wide mb-2">
              阅读状态
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters({ readStatus: 'all' })}
                className={`btn-tag text-xs ${
                  filters.readStatus === 'all'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              {READ_STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() =>
                    setFilters({
                      readStatus: (filters.readStatus === status ? 'all' : status) as ReadStatus | 'all',
                    })
                  }
                  className={`btn-tag text-xs ${
                    filters.readStatus === status
                      ? 'bg-accent-mint/50 text-emerald-700 shadow-md border-emerald-300'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-display font-semibold text-gray-500 uppercase tracking-wide mb-2">
              收藏
            </label>
            <button
              onClick={() => setFilters({ favoriteOnly: !filters.favoriteOnly })}
              className={`btn-tag text-xs flex items-center gap-1 ${
                filters.favoriteOnly
                  ? 'bg-accent-peach text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heart size={12} fill={filters.favoriteOnly ? 'currentColor' : 'none'} />
              仅看收藏
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-display font-semibold text-gray-500 uppercase tracking-wide mb-2">
            <Star size={12} className="inline mr-1" />
            评分
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilters({ rating: 'all' })}
              className={`btn-tag text-xs ${
                filters.rating === 'all'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilters({ rating: 'rated' })}
              className={`btn-tag text-xs ${
                filters.rating === 'rated'
                  ? 'bg-amber-100 text-amber-700 shadow-md border-amber-300'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              已评分
            </button>
            <button
              onClick={() => setFilters({ rating: 'unrated' })}
              className={`btn-tag text-xs ${
                filters.rating === 'unrated'
                  ? 'bg-gray-200 text-gray-700 shadow-md'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              未评分
            </button>
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() =>
                  setFilters({
                    rating: (filters.rating === star ? 'all' : star) as RatingFilter,
                  })
                }
                className={`btn-tag text-xs ${
                  filters.rating === star
                    ? 'bg-amber-100 text-amber-700 shadow-md border-amber-300'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {'⭐'.repeat(star)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-display font-semibold text-gray-500 uppercase tracking-wide mb-2">
            <Clock size={12} className="inline mr-1" />
            重温日期
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setFilters({ hasRevisitDate: 'all' })}
              className={`btn-tag text-xs ${
                filters.hasRevisitDate === 'all'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilters({ hasRevisitDate: filters.hasRevisitDate === true ? 'all' : true })}
              className={`btn-tag text-xs ${
                filters.hasRevisitDate === true
                  ? 'bg-purple-100 text-purple-700 shadow-md border-purple-300'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              有重温计划
            </button>
            <button
              onClick={() => setFilters({ hasRevisitDate: filters.hasRevisitDate === false ? 'all' : false })}
              className={`btn-tag text-xs ${
                filters.hasRevisitDate === false
                  ? 'bg-gray-200 text-gray-700 shadow-md'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              无重温计划
            </button>
            <div className="flex items-center gap-1 ml-2">
              <input
                type="date"
                value={filters.revisitDateFrom ? new Date(filters.revisitDateFrom).toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const date = new Date(e.target.value);
                    setFilters({ revisitDateFrom: date.getTime() });
                  } else {
                    setFilters({ revisitDateFrom: null });
                  }
                }}
                className="input-field text-xs py-1 w-32"
                placeholder="开始日期"
              />
              <span className="text-gray-400">~</span>
              <input
                type="date"
                value={filters.revisitDateTo ? new Date(filters.revisitDateTo).toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const date = new Date(e.target.value);
                    setFilters({ revisitDateTo: date.getTime() });
                  } else {
                    setFilters({ revisitDateTo: null });
                  }
                }}
                className="input-field text-xs py-1 w-32"
                placeholder="结束日期"
              />
            </div>
          </div>
        </div>

        {(filters.dateFrom !== null || filters.dateTo !== null) && (
          <div>
            <label className="block text-xs font-display font-semibold text-gray-500 uppercase tracking-wide mb-2">
              创建日期
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg border border-primary-200">
                <Calendar size={14} />
                <span className="text-sm font-display">
                  {filters.dateFrom !== null && formatDate(filters.dateFrom)}
                  {filters.dateFrom !== null && filters.dateTo !== null && ' ~ '}
                  {filters.dateTo !== null && formatDate(filters.dateTo)}
                </span>
                <button
                  onClick={clearDateFilter}
                  className="ml-1 p-0.5 rounded hover:bg-primary-200 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};
