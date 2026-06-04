import { useState, useEffect, useMemo } from 'react';
import { X, Heart, ExternalLink, Edit2, Trash2, BookOpen, User, Calendar, Tag, FileText, CalendarPlus, BookCheck, ChevronDown } from 'lucide-react';
import { useEntryStore } from '../store/useEntryStore';
import { TYPE_COLORS, STATUS_COLORS, READ_STATUS_COLORS, TAG_COLORS, CUSTOM_TAG_COLORS, READ_STATUSES } from '../types';
import type { ReadStatus } from '../types';

export const DetailModal = () => {
  const isDetailOpen = useEntryStore((s) => s.isDetailOpen);
  const detailEntry = useEntryStore((s) => {
    if (!s.detailEntryId) return null;
    return s.entries.find((e) => e.id === s.detailEntryId) || null;
  });
  const closeDetail = useEntryStore((s) => s.closeDetail);
  const toggleFavorite = useEntryStore((s) => s.toggleFavorite);
  const updateReadStatus = useEntryStore((s) => s.updateReadStatus);
  const openForm = useEntryStore((s) => s.openForm);
  const deleteEntry = useEntryStore((s) => s.deleteEntry);
  const customTags = useEntryStore((s) => s.customTags);
  const addToPlan = useEntryStore((s) => s.addToPlan);
  const removeFromPlan = useEntryStore((s) => s.removeFromPlan);
  const readingPlan = useEntryStore((s) => s.readingPlan);

  const [isAnimating, setIsAnimating] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [readStatusDropdown, setReadStatusDropdown] = useState(false);

  useEffect(() => {
    if (isDetailOpen) {
      setIsAnimating(true);
    }
  }, [isDetailOpen]);

  const isInPlan = useMemo(() => {
    if (!detailEntry) return false;
    return readingPlan.some((item) => item.entryId === detailEntry.id);
  }, [detailEntry, readingPlan]);

  if (!isDetailOpen || !detailEntry) return null;

  const entryCustomTags = customTags.filter((tag) =>
    detailEntry.customTags?.includes(tag.id)
  );

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(closeDetail, 200);
  };

  const handleFavorite = () => {
    setHeartAnimating(true);
    toggleFavorite(detailEntry.id);
    setTimeout(() => setHeartAnimating(false), 600);
  };

  const handleReadStatusChange = (status: ReadStatus) => {
    updateReadStatus(detailEntry.id, status);
    setReadStatusDropdown(false);
  };

  const handleTogglePlan = () => {
    if (isInPlan) {
      removeFromPlan(detailEntry.id);
    } else {
      addToPlan(detailEntry.id);
    }
  };

  const handleDelete = () => {
    if (confirm(`确定要删除「${detailEntry.workName} - ${detailEntry.cpName}」吗？`)) {
      deleteEntry(detailEntry.id);
      handleClose();
    }
  };

  const handleEdit = () => {
    openForm(detailEntry);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      <div
        className={`relative glass-panel w-full max-w-lg max-h-[90vh] overflow-hidden transition-all duration-300 ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-purple-500 px-6 py-5 text-white z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-display font-bold mb-1">{detailEntry.workName}</h2>
              <div className="flex items-center gap-2 text-white/80">
                <BookOpen size={16} />
                <span className="font-medium">{detailEntry.cpName}</span>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-6 pt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleFavorite}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-display font-semibold transition-all ${
                heartAnimating ? 'animate-heartbeat' : ''
              } ${
                detailEntry.favorite
                  ? 'bg-accent-peach text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Heart size={14} fill={detailEntry.favorite ? 'currentColor' : 'none'} />
              {detailEntry.favorite ? '已收藏' : '收藏'}
            </button>

            <div className="relative">
              <button
                onClick={() => setReadStatusDropdown(!readStatusDropdown)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-display font-semibold transition-all ${READ_STATUS_COLORS[detailEntry.readStatus]}`}
              >
                <BookCheck size={14} />
                {detailEntry.readStatus}
                <ChevronDown size={12} className={`transition-transform ${readStatusDropdown ? 'rotate-180' : ''}`} />
              </button>
              {readStatusDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setReadStatusDropdown(false)} />
                  <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[100px]">
                    {READ_STATUSES.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleReadStatusChange(status)}
                        className={`w-full px-3 py-1.5 text-left text-sm font-display transition-colors ${
                          detailEntry.readStatus === status
                            ? 'bg-primary-50 text-primary-600 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleTogglePlan}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-display font-semibold transition-all ${
                isInPlan
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              <CalendarPlus size={14} />
              {isInPlan ? '已加入计划' : '今日计划'}
            </button>

            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-display font-semibold bg-primary-100 text-primary-600 hover:bg-primary-200 transition-all"
            >
              <Edit2 size={14} />
              编辑
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="flex flex-wrap gap-2 mb-5">
            <span className={`btn-tag ${TYPE_COLORS[detailEntry.type]}`}>
              {detailEntry.type}
            </span>
            <span className={`btn-tag ${STATUS_COLORS[detailEntry.status]}`}>
              {detailEntry.status}
            </span>
            <span className={`btn-tag ${READ_STATUS_COLORS[detailEntry.readStatus]}`}>
              {detailEntry.readStatus}
            </span>
          </div>

          {detailEntry.tags.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Tag size={14} />
                <span className="font-display font-medium">虐甜标签</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {detailEntry.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`btn-tag text-xs ${TAG_COLORS[tag]}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {entryCustomTags.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Tag size={14} />
                <span className="font-display font-medium">自定义标签</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entryCustomTags.map((tag) => (
                  <span
                    key={tag.id}
                    className={`btn-tag text-xs ${CUSTOM_TAG_COLORS[tag.color] || 'bg-gray-100 text-gray-700'}`}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {detailEntry.author && (
            <div className="mb-5">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <User size={14} />
                <span className="font-display font-medium">作者</span>
              </div>
              <div className="text-gray-800 font-medium pl-6">{detailEntry.author}</div>
            </div>
          )}

          {detailEntry.link && (
            <div className="mb-5">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <ExternalLink size={14} />
                <span className="font-display font-medium">链接</span>
              </div>
              <a
                href={detailEntry.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-primary-600 hover:text-primary-700 underline pl-6 break-all inline-block"
              >
                {detailEntry.link}
              </a>
            </div>
          )}

          {detailEntry.notes && (
            <div className="mb-5">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <FileText size={14} />
                <span className="font-display font-medium">个人备注</span>
              </div>
              <div className="bg-primary-50/70 border border-primary-100 rounded-xl p-4 text-gray-700 whitespace-pre-wrap">
                {detailEntry.notes}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Calendar size={14} />
            <span>创建于 {new Date(detailEntry.createdAt).toLocaleString('zh-CN')}</span>
            {detailEntry.updatedAt !== detailEntry.createdAt && (
              <span className="ml-2">
                · 更新于 {new Date(detailEntry.updatedAt).toLocaleString('zh-CN')}
              </span>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {detailEntry.link && (
              <a
                href={detailEntry.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-display font-semibold bg-primary-100 text-primary-700 hover:bg-primary-200 transition-all"
              >
                <ExternalLink size={18} />
                打开链接
              </a>
            )}
            <button
              onClick={handleDelete}
              className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all"
              title="删除"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
