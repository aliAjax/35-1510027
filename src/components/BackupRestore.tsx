import { useState, useRef } from 'react';
import { Download, Upload, X, AlertTriangle, CheckCircle, Info, Trash2 } from 'lucide-react';
import { useEntryStore } from '../store/useEntryStore';
import type { ImportResult } from '../types';

export const BackupRestore = () => {
  const { exportData, validateAndParseImport, importData, clearAllData, entries } = useEntryStore();
  const [showModal, setShowModal] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [mergeMode, setMergeMode] = useState(true);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    a.download = `cp-grain-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = validateAndParseImport(content);
      setImportResult(result);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!importResult?.data) return;
    importData(importResult.data, mergeMode);
    setImportResult(null);
    setShowModal(false);
  };

  const handleClearAll = () => {
    clearAllData();
    setShowConfirmClear(false);
  };

  const openModal = () => {
    setShowModal(true);
    setImportResult(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-display font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        title="导出数据"
      >
        <Download size={16} />
        <span className="hidden sm:inline">导出</span>
      </button>

      <button
        onClick={openModal}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-display font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        title="导入数据"
      >
        <Upload size={16} />
        <span className="hidden sm:inline">导入</span>
      </button>

      {entries.length > 0 && (
        <button
          onClick={() => setShowConfirmClear(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-display font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="清空数据"
        >
          <Trash2 size={16} />
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="glass-panel w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-gray-800">数据导入</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {!importResult ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  选择之前导出的 JSON 备份文件来恢复数据。
                </p>
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors">
                    <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-sm text-gray-500">点击选择文件或拖拽到此处</p>
                    <p className="text-xs text-gray-400 mt-1">支持 .json 格式</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${importResult.errors.length > 0 ? 'bg-red-50 border border-red-200' : importResult.warnings.length > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-start gap-3">
                    {importResult.errors.length > 0 ? (
                      <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
                    ) : importResult.warnings.length > 0 ? (
                      <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
                    ) : (
                      <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 mb-2">导入预览</p>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-gray-600">待导入条目：</span>
                          <span className="font-semibold text-gray-800">{importResult.entriesCount} 条</span>
                          {importResult.entriesCount !== importResult.validEntriesCount && (
                            <span className="text-red-600 ml-1">（有效 {importResult.validEntriesCount} 条）</span>
                          )}
                        </p>
                        {importResult.currentEntriesCount > 0 && (
                          <p>
                            <span className="text-gray-600">当前已有：</span>
                            <span className="font-semibold text-gray-800">{importResult.currentEntriesCount} 条</span>
                          </p>
                        )}
                        {importResult.duplicateCount > 0 && (
                          <p className="text-amber-700">
                            <Info size={14} className="inline mr-1" />
                            发现 {importResult.duplicateCount} 条重复数据（ID 相同）
                          </p>
                        )}
                        {importResult.currentEntriesCount > 0 && mergeMode && (
                          <p className="text-blue-700">
                            <Info size={14} className="inline mr-1" />
                            合并模式：将跳过 {importResult.duplicateCount} 条重复项，新增约 {importResult.entriesCount - importResult.duplicateCount} 条
                          </p>
                        )}
                        {importResult.currentEntriesCount > 0 && !mergeMode && (
                          <div className="mt-2 p-2 bg-red-100 rounded border border-red-300">
                            <p className="text-red-700 font-medium">
                              <AlertTriangle size={14} className="inline mr-1" />
                              覆盖模式：当前 {importResult.overwriteCount} 条数据将被全部替换！
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-700 mb-2">
                      致命错误（{importResult.errors.length} 项，需修复后才能导入）：
                    </p>
                    <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errors.slice(0, 10).map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li>... 还有 {importResult.errors.length - 10} 项错误</li>
                      )}
                    </ul>
                  </div>
                )}

                {importResult.warnings.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-medium text-amber-700 mb-2">
                      警告信息（{importResult.warnings.length} 项，可忽略）：
                    </p>
                    <ul className="text-xs text-amber-600 space-y-1 max-h-32 overflow-y-auto">
                      {importResult.warnings.slice(0, 8).map((warning, i) => (
                        <li key={i}>• {warning}</li>
                      ))}
                      {importResult.warnings.length > 8 && (
                        <li>... 还有 {importResult.warnings.length - 8} 项警告</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">导入方式：</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={mergeMode}
                        onChange={() => setMergeMode(true)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">合并导入（保留现有数据，跳过重复项）</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!mergeMode}
                        onChange={() => setMergeMode(false)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">覆盖导入（替换所有现有数据）</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setImportResult(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    重新选择
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!importResult.success}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      importResult.success
                        ? 'text-white bg-primary-600 hover:bg-primary-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    确认导入
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="glass-panel w-full max-w-sm p-6 animate-scale-in">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="font-display text-lg font-semibold text-gray-800 mb-2">
                确认清空所有数据？
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                此操作将删除所有 {entries.length} 条粮单记录，且无法恢复。建议先导出备份。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  确认清空
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
