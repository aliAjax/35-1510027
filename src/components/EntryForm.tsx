import { useState, useEffect } from 'react';
import { X, Tags } from 'lucide-react';
import { useEntryStore } from '../store/useEntryStore';
import {
  ENTRY_TYPES,
  COMPLETION_STATUSES,
  READ_STATUSES,
  FLAVOR_TAGS,
  TYPE_COLORS,
  TAG_COLORS,
  CUSTOM_TAG_COLORS,
} from '../types';
import type { EntryType, CompletionStatus, ReadStatus, FlavorTag } from '../types';

interface FormData {
  workName: string;
  cpName: string;
  type: EntryType;
  link: string;
  author: string;
  status: CompletionStatus;
  tags: FlavorTag[];
  customTags: string[];
  readStatus: ReadStatus;
  notes: string;
  favorite: boolean;
}

const defaultFormData: FormData = {
  workName: '',
  cpName: '',
  type: '同人文',
  link: '',
  author: '',
  status: '已完结',
  tags: [],
  customTags: [],
  readStatus: '未读',
  notes: '',
  favorite: false,
};

export const EntryForm = () => {
  const { isFormOpen, editingEntry, closeForm, addEntry, updateEntry, customTags, openTagManager } = useEntryStore();
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isFormOpen) {
      setIsAnimating(true);
      if (editingEntry) {
        setFormData({
          workName: editingEntry.workName,
          cpName: editingEntry.cpName,
          type: editingEntry.type,
          link: editingEntry.link,
          author: editingEntry.author,
          status: editingEntry.status,
          tags: [...editingEntry.tags],
          customTags: [...(editingEntry.customTags || [])],
          readStatus: editingEntry.readStatus,
          notes: editingEntry.notes,
          favorite: editingEntry.favorite,
        });
      } else {
        setFormData(defaultFormData);
      }
    }
  }, [isFormOpen, editingEntry]);

  if (!isFormOpen) return null;

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(closeForm, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workName.trim() || !formData.cpName.trim()) {
      return;
    }
    if (editingEntry) {
      updateEntry(editingEntry.id, formData);
    } else {
      addEntry(formData);
    }
    handleClose();
  };

  const toggleTag = (tag: FlavorTag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const toggleCustomTag = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      customTags: prev.customTags.includes(tagId)
        ? prev.customTags.filter((id) => id !== tagId)
        : [...prev.customTags, tagId],
    }));
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
        className={`relative glass-panel w-full max-w-2xl max-h-[90vh] overflow-hidden transition-all duration-300 ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-primary-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-display font-bold text-primary-700">
            {editingEntry ? '✏️ 编辑条目' : '✨ 添加新粮'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-primary-100 text-gray-500 hover:text-primary-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1.5">
                作品名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.workName}
                onChange={(e) => setFormData({ ...formData, workName: e.target.value })}
                placeholder="例如：原神"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1.5">
                CP名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.cpName}
                onChange={(e) => setFormData({ ...formData, cpName: e.target.value })}
                placeholder="例如：散枫"
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1.5">
                类型
              </label>
              <div className="flex flex-wrap gap-2">
                {ENTRY_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type })}
                    className={`btn-tag border-2 ${
                      formData.type === type
                        ? `${TYPE_COLORS[type]} border-current shadow-md`
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1.5">
                完成状态
              </label>
              <div className="flex flex-wrap gap-2">
                {COMPLETION_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ ...formData, status })}
                    className={`btn-tag border-2 ${
                      formData.status === status
                        ? 'bg-primary-100 text-primary-700 border-primary-300 shadow-md'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1.5">
                链接
              </label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://..."
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1.5">
                作者
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="作者ID/昵称"
                className="input-field"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-display font-semibold text-gray-700 mb-1.5">
              阅读状态
            </label>
            <div className="flex flex-wrap gap-2">
              {READ_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({ ...formData, readStatus: status })}
                  className={`btn-tag border-2 ${
                    formData.readStatus === status
                      ? 'bg-accent-mint/30 text-emerald-700 border-emerald-300 shadow-md'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-display font-semibold text-gray-700 mb-1.5">
              虐甜标签
            </label>
            <div className="flex flex-wrap gap-2">
              {FLAVOR_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`btn-tag border-2 ${
                    formData.tags.includes(tag)
                      ? `${TAG_COLORS[tag]} border-current shadow-md`
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-display font-semibold text-gray-700">
                自定义标签
              </label>
              <button
                type="button"
                onClick={() => openTagManager()}
                className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-display"
              >
                <Tags size={12} />
                管理标签
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {customTags.length === 0 ? (
                <span className="text-sm text-gray-400 italic">
                  暂无自定义标签，点击上方按钮创建
                </span>
              ) : (
                customTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleCustomTag(tag.id)}
                    className={`btn-tag border-2 ${
                      formData.customTags.includes(tag.id)
                        ? `${CUSTOM_TAG_COLORS[tag.color] || 'bg-gray-100 text-gray-700'} border-current shadow-md`
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-display font-semibold text-gray-700 mb-1.5">
              个人备注
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="记录你的感想、避雷点、剧透提醒等..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-primary-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.favorite}
                onChange={(e) => setFormData({ ...formData, favorite: e.target.checked })}
                className="w-5 h-5 rounded border-primary-300 text-primary-500 focus:ring-primary-400"
              />
              <span className="text-sm font-display font-medium text-gray-600">
                ❤️ 标记为收藏
              </span>
            </label>
            <div className="flex gap-3">
              <button type="button" onClick={handleClose} className="btn-secondary">
                取消
              </button>
              <button type="submit" className="btn-primary">
                {editingEntry ? '保存修改' : '添加条目'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
