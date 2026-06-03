import { useState, useEffect } from 'react';
import { X, Heart, ExternalLink, Edit2, Trash2, BookOpen, User, Calendar, Tag, FileText } from 'lucide-react';
import { useEntryStore } from '../store/useEntryStore';
import { TYPE_COLORS, STATUS_COLORS, READ_STATUS_COLORS, TAG_COLORS, CUSTOM_TAG_COLORS } from '../types';

export const DetailModal = () => {
  const { isDetailOpen, detailEntry, closeDetail, toggleFavorite, openForm, deleteEntry, customTags } = useEntryStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);

  useEffect(() => {
    if (isDetailOpen) {
      setIsAnimating(true);
    }
  }, [isDetailOpen]);

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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
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
            <button
              onClick={handleFavorite}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-display font-semibold transition-all ${
                heartAnimating ? 'animate-heartbeat' : ''
              } ${
                detailEntry.favorite
                  ? 'bg-accent-peach text-white shadow-lg shadow-accent-peach/30'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heart size={18} fill={detailEntry.favorite ? 'currentColor' : 'none'} />
              {detailEntry.favorite ? '已收藏' : '收藏'}
            </button>
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
              onClick={handleEdit}
              className="p-2.5 rounded-xl bg-primary-100 text-primary-600 hover:bg-primary-200 transition-all"
              title="编辑"
            >
              <Edit2 size={18} />
            </button>
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
