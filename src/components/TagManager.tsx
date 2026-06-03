import { useState, useEffect } from 'react';
import { X, Plus, Tag, Edit2, Trash2, Check } from 'lucide-react';
import { useEntryStore } from '../store/useEntryStore';
import { CUSTOM_TAG_COLORS, CUSTOM_TAG_PRESET_COLORS } from '../types';
import type { CustomTag } from '../types';

export const TagManager = () => {
  const { isTagManagerOpen, customTags, closeTagManager, addCustomTag, updateCustomTag, deleteCustomTag, getEntriesWithTag } = useEntryStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTag, setEditingTag] = useState<CustomTag | null>(null);
  const [tagName, setTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState('purple');
  const [deleteConfirmTag, setDeleteConfirmTag] = useState<CustomTag | null>(null);

  useEffect(() => {
    if (isTagManagerOpen) {
      setIsAnimating(true);
      resetForm();
    }
  }, [isTagManagerOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(closeTagManager, 200);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingTag(null);
    setTagName('');
    setSelectedColor('purple');
    setDeleteConfirmTag(null);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingTag(null);
    setTagName('');
    setSelectedColor('purple');
  };

  const startEdit = (tag: CustomTag) => {
    setIsAdding(false);
    setEditingTag(tag);
    setTagName(tag.name);
    setSelectedColor(tag.color);
  };

  const handleSubmit = () => {
    if (!tagName.trim()) return;

    if (editingTag) {
      updateCustomTag(editingTag.id, {
        name: tagName.trim(),
        color: selectedColor,
      });
    } else {
      addCustomTag(tagName.trim(), selectedColor);
    }
    resetForm();
  };

  const handleDeleteClick = (tag: CustomTag) => {
    setDeleteConfirmTag(tag);
  };

  const confirmDelete = () => {
    if (deleteConfirmTag) {
      deleteCustomTag(deleteConfirmTag.id);
      setDeleteConfirmTag(null);
    }
  };

  if (!isTagManagerOpen) return null;

  const entriesWithTag = deleteConfirmTag ? getEntriesWithTag(deleteConfirmTag.id) : [];

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
        <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-purple-500 px-6 py-5 text-white z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-display font-bold mb-1">标签管理</h2>
              <p className="text-white/80 text-sm">创建和管理你的自定义标签</p>
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
          <div className="mb-6">
            <button
              onClick={startAdd}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-display font-medium"
            >
              <Plus size={18} />
              新建标签
            </button>
          </div>

          {(isAdding || editingTag) && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
              <h3 className="font-display font-semibold text-primary-700 mb-3">
                {editingTag ? '编辑标签' : '新建标签'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    标签名称
                  </label>
                  <input
                    type="text"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    placeholder="输入标签名称"
                    className="input-field"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    选择颜色
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CUSTOM_TAG_PRESET_COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color.id)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          selectedColor === color.id
                            ? 'border-primary-500 ring-2 ring-primary-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color.color }}
                        title={color.name}
                      >
                        {selectedColor === color.id && (
                          <Check size={14} className="text-white mx-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={!tagName.trim()}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-display font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingTag ? '保存修改' : '创建标签'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-display font-medium"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {customTags.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Tag size={48} className="mx-auto mb-3 opacity-50" />
              <p className="font-display">还没有自定义标签</p>
              <p className="text-sm">点击上方按钮创建你的第一个标签</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-primary-200 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full ${CUSTOM_TAG_COLORS[tag.color] || 'bg-gray-100'}`}
                    />
                    <span className="font-medium text-gray-700">{tag.name}</span>
                    <span className="text-xs text-gray-400">
                      {getEntriesWithTag(tag.id).length} 个条目
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(tag)}
                      className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                      title="编辑"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(tag)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteConfirmTag && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-display font-bold text-gray-800 mb-3">
              确认删除标签
            </h3>
            <p className="text-gray-600 mb-4">
              确定要删除标签「<span className="font-semibold text-primary-600">{deleteConfirmTag.name}</span>」吗？
            </p>
            {entriesWithTag.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-700">
                  ⚠️ 此操作将从以下 {entriesWithTag.length} 个条目中移除该标签：
                </p>
                <div className="mt-2 max-h-32 overflow-y-auto">
                  {entriesWithTag.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="text-sm text-amber-600 py-1">
                      · {entry.workName} - {entry.cpName}
                    </div>
                  ))}
                  {entriesWithTag.length > 5 && (
                    <div className="text-sm text-amber-600 py-1">
                      ...还有 {entriesWithTag.length - 5} 个条目
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmTag(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-display font-medium"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-display font-medium"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
