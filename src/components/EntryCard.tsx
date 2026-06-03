import { useState } from 'react';
import { Heart, ExternalLink, Edit2, Trash2, BookOpen } from 'lucide-react';
import { useEntryStore } from '../store/useEntryStore';
import { TYPE_COLORS, STATUS_COLORS, READ_STATUS_COLORS, TAG_COLORS, CUSTOM_TAG_COLORS } from '../types';
import type { Entry } from '../types';

interface EntryCardProps {
  entry: Entry;
  index: number;
}

export const EntryCard = ({ entry, index }: EntryCardProps) => {
  const { toggleFavorite, openForm, openDetail, deleteEntry, customTags } = useEntryStore();

  const entryCustomTags = customTags.filter((tag) =>
    entry.customTags?.includes(tag.id)
  );
  const [showActions, setShowActions] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimating(true);
    toggleFavorite(entry.id);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要删除「${entry.workName} - ${entry.cpName}」吗？`)) {
      deleteEntry(entry.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    openForm(entry);
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (entry.link) {
      window.open(entry.link, '_blank', 'noopener,noreferrer');
    }
  };

  const animationDelay = `${Math.min(index * 0.05, 0.5)}s`;

  return (
    <div
      className="card p-5 cursor-pointer group relative overflow-hidden animate-slide-up"
      style={{ animationDelay }}
      onClick={() => openDetail(entry)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {entry.favorite && (
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
          <div className="absolute -right-8 -top-8 w-16 h-16 bg-gradient-to-br from-accent-peach to-pink-400 rotate-45" />
          <Heart
            size={14}
            className="absolute top-2 right-2 text-white fill-white"
          />
        </div>
      )}

      <div className="absolute top-3 right-3 flex gap-1.5 transition-all duration-200">
        <button
          onClick={handleFavoriteClick}
          className={`p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all hover:scale-110 ${
            isAnimating ? 'animate-heartbeat' : ''
          } ${entry.favorite ? 'text-accent-peach' : 'text-gray-400 hover:text-accent-peach'}`}
        >
          <Heart size={16} fill={entry.favorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className={`absolute top-3 left-3 flex gap-1.5 transition-all duration-200 ${
        showActions ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}>
        {entry.link && (
          <button
            onClick={handleOpenLink}
            className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md text-gray-500 hover:text-primary-600 transition-all hover:scale-110"
            title="打开链接"
          >
            <ExternalLink size={14} />
          </button>
        )}
        <button
          onClick={handleEdit}
          className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md text-gray-500 hover:text-primary-600 transition-all hover:scale-110"
          title="编辑"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={handleDelete}
          className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md text-gray-500 hover:text-red-500 transition-all hover:scale-110"
          title="删除"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="pt-8">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-display font-bold text-lg text-gray-800 group-hover:text-primary-600 transition-colors pr-16">
            {entry.workName}
          </h3>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={14} className="text-primary-400" />
          <span className="font-display font-semibold text-primary-600">
            {entry.cpName}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`btn-tag text-xs ${TYPE_COLORS[entry.type]}`}>
            {entry.type}
          </span>
          <span className={`btn-tag text-xs ${STATUS_COLORS[entry.status]}`}>
            {entry.status}
          </span>
          <span className={`btn-tag text-xs ${READ_STATUS_COLORS[entry.readStatus]}`}>
            {entry.readStatus}
          </span>
        </div>

        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className={`btn-tag text-xs ${TAG_COLORS[tag]}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {entryCustomTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {entryCustomTags.map((tag) => (
              <span
                key={tag.id}
                className={`btn-tag text-xs ${CUSTOM_TAG_COLORS[tag.color] || 'bg-gray-100 text-gray-700'}`}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {entry.author && (
          <div className="text-sm text-gray-500 mb-2">
            <span className="font-medium">作者：</span>{entry.author}
          </div>
        )}

        {entry.notes && (
          <div className="text-sm text-gray-600 bg-primary-50/50 rounded-lg p-2.5 border border-primary-100 max-h-16 overflow-hidden">
            {entry.notes}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>
            创建于 {new Date(entry.createdAt).toLocaleDateString('zh-CN')}
          </span>
          <span className="text-primary-400 font-display font-medium group-hover:translate-x-1 transition-transform">
            查看详情 →
          </span>
        </div>
      </div>
    </div>
  );
};
