import { useState, useRef } from 'react';
import { X, Upload, FileText, AlertTriangle, CheckCircle, Info, ClipboardPaste, ChevronDown, ChevronUp } from 'lucide-react';
import { useEntryStore } from '../store/useEntryStore';
import type { BatchImportResult, ParsedBatchEntry, ImportStrategy } from '../types';
import { TYPE_COLORS, STATUS_COLORS, READ_STATUS_COLORS, TAG_COLORS, CUSTOM_TAG_COLORS } from '../types';

type ImportMode = 'text' | 'csv';

const STRATEGY_LABELS: Record<ImportStrategy, { label: string; desc: string }> = {
  skip: { label: '跳过', desc: '不导入重复条目' },
  overwrite: { label: '覆盖', desc: '用新数据替换已有条目' },
  merge: { label: '合并', desc: '合并标签和备注' },
};

export const BatchImport = () => {
  const { isBatchImportOpen, closeBatchImport, parseBatchText, parseBatchCSV, batchImportEntries, customTags } = useEntryStore();
  const [importMode, setImportMode] = useState<ImportMode>('text');
  const [inputText, setInputText] = useState('');
  const [importResult, setImportResult] = useState<BatchImportResult | null>(null);
  const [entryStrategies, setEntryStrategies] = useState<Map<number, ImportStrategy>>(new Map());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customTagMap = new Map(customTags.map((t) => [t.id, t]));

  const getEntryStrategy = (entry: ParsedBatchEntry): ImportStrategy => {
    return entryStrategies.get(entry.rowNumber) ?? entry.importStrategy;
  };

  const setEntryStrategy = (rowNumber: number, strategy: ImportStrategy) => {
    setEntryStrategies((prev) => new Map(prev).set(rowNumber, strategy));
  };

  const setAllDuplicatesStrategy = (strategy: ImportStrategy) => {
    if (!importResult) return;
    const newStrategies = new Map(entryStrategies);
    importResult.entries.forEach((entry) => {
      if (entry.duplicates.length > 0 && entry.isValid) {
        newStrategies.set(entry.rowNumber, strategy);
      }
    });
    setEntryStrategies(newStrategies);
  };

  const toggleRowExpand = (rowNumber: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) {
        next.delete(rowNumber);
      } else {
        next.add(rowNumber);
      }
      return next;
    });
  };

  const openModal = () => {
    setIsAnimating(true);
    setImportResult(null);
    setInputText('');
  };

  const closeModal = () => {
    setIsAnimating(false);
    setTimeout(() => {
      closeBatchImport();
      setImportResult(null);
      setInputText('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 200);
  };

  const handleParseText = () => {
    if (!inputText.trim()) return;
    const result = parseBatchText(inputText);
    setImportResult(result);
    setEntryStrategies(new Map());
    setExpandedRows(new Set());
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseBatchCSV(content);
      setImportResult(result);
      setEntryStrategies(new Map());
      setExpandedRows(new Set());
    };
    reader.readAsText(file);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch {
      // clipboard API 失败时不做处理
    }
  };

  const handleConfirmImport = () => {
    if (!importResult || importResult.validRows === 0) return;
    const entriesWithStrategy = importResult.entries.map((entry) => ({
      ...entry,
      importStrategy: getEntryStrategy(entry),
    }));
    batchImportEntries(entriesWithStrategy);
  };

  const handleReset = () => {
    setImportResult(null);
    setInputText('');
    setEntryStrategies(new Map());
    setExpandedRows(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isBatchImportOpen) return null;

  if (!isAnimating) {
    openModal();
  }

  const getRowStatusColor = (entry: ParsedBatchEntry) => {
    if (entry.errors.length > 0) return 'bg-red-50 border-red-200';
    if (entry.duplicates.length > 0) return 'bg-orange-50 border-orange-200';
    if (entry.warnings.length > 0) return 'bg-amber-50 border-amber-200';
    return 'bg-green-50 border-green-200';
  };

  const duplicateCount = importResult?.entries.filter((e) => e.duplicates.length > 0 && e.isValid).length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeModal}
      />
      <div
        className={`relative glass-panel w-full max-w-7xl max-h-[90vh] overflow-hidden transition-all duration-300 flex flex-col ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-primary-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-display font-bold text-primary-700 flex items-center gap-2">
            <FileText size={22} />
            批量导入
          </h2>
          <button
            onClick={closeModal}
            className="p-2 rounded-full hover:bg-primary-100 text-gray-500 hover:text-primary-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!importResult ? (
            <div className="space-y-6">
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => {
                    setImportMode('text');
                    setInputText('');
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg font-display font-medium transition-all ${
                    importMode === 'text'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ClipboardPaste size={18} className="inline mr-2" />
                  粘贴文本
                </button>
                <button
                  onClick={() => {
                    setImportMode('csv');
                    setInputText('');
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg font-display font-medium transition-all ${
                    importMode === 'csv'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Upload size={18} className="inline mr-2" />
                  上传 CSV
                </button>
              </div>

              {importMode === 'text' ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700 mb-2">
                      <Info size={16} className="inline mr-1" />
                      格式说明：每行一条数据，字段用逗号或制表符分隔，顺序为：
                    </p>
                    <code className="block text-xs bg-blue-100 p-2 rounded text-blue-800">
                      作品名, CP名, 类型, 链接, 作者, 状态, 标签, 自定义标签, 阅读状态, 备注, 收藏, 评分, 重温日期
                    </code>
                    <p className="text-xs text-blue-600 mt-2">
                      类型可选：同人文、同人漫、视频、音频、图、其他 | 状态可选：连载中、已完结、暂停、坑 | 标签用空格或顿号分隔 | 自定义标签需先在标签管理中创建 | 评分：1-5数字 | 重温日期：YYYY-MM-DD格式
                    </p>
                  </div>
                  <div className="relative">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="粘贴数据...

示例：
原神,散枫,同人文,https://example.com,作者A,已完结,甜 HE,,已读,很好看,true
原神,知妙,同人漫,,作者B,连载中,虐,神作 推荐,在读,,false"
                      className="input-field w-full h-64 resize-none font-mono text-sm"
                    />
                    <button
                      onClick={handlePaste}
                      className="absolute top-3 right-3 px-3 py-1.5 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
                    >
                      <ClipboardPaste size={14} className="inline mr-1" />
                      粘贴
                    </button>
                  </div>
                  <button
                    onClick={handleParseText}
                    disabled={!inputText.trim()}
                    className={`w-full py-3 rounded-lg font-display font-medium transition-all ${
                      inputText.trim()
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    解析预览
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700 mb-2">
                      <Info size={16} className="inline mr-1" />
                      CSV 文件格式要求：
                    </p>
                    <ul className="text-xs text-blue-600 space-y-1">
                      <li>• 第一行为表头（可选）：作品名,CP名,类型,链接,作者,状态,标签,自定义标签,阅读状态,备注,收藏,评分,重温日期</li>
                      <li>• 标签字段多个标签用空格或顿号分隔</li>
                      <li>• 自定义标签需先在标签管理中创建，通过名称匹配</li>
                      <li>• 收藏字段：true/是/yes/1 表示收藏</li>
                      <li>• 评分字段：1-5 的数字</li>
                      <li>• 重温日期字段：YYYY-MM-DD 格式的日期</li>
                    </ul>
                  </div>
                  <label className="block">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors">
                      <Upload className="mx-auto text-gray-400 mb-3" size={40} />
                      <p className="text-lg font-display font-medium text-gray-600">点击选择 CSV 文件</p>
                      <p className="text-sm text-gray-400 mt-2">支持 .csv 格式</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg border ${
                  importResult.invalidRows > 0
                    ? 'bg-red-50 border-red-200'
                    : duplicateCount > 0
                    ? 'bg-orange-50 border-orange-200'
                    : importResult.entries.some((e) => e.warnings.length > 0)
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {importResult.invalidRows > 0 ? (
                    <AlertTriangle className="text-red-500 flex-shrink-0" size={22} />
                  ) : duplicateCount > 0 ? (
                    <AlertTriangle className="text-orange-500 flex-shrink-0" size={22} />
                  ) : importResult.entries.some((e) => e.warnings.length > 0) ? (
                    <AlertTriangle className="text-amber-500 flex-shrink-0" size={22} />
                  ) : (
                    <CheckCircle className="text-green-500 flex-shrink-0" size={22} />
                  )}
                  <div className="flex-1">
                    <p className="font-display font-semibold text-gray-800 mb-2">导入预览</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span>
                        共 <strong className="text-gray-800">{importResult.totalRows}</strong> 条
                      </span>
                      <span className="text-green-600">
                        ✅ 有效 <strong>{importResult.validRows}</strong> 条
                      </span>
                      {importResult.invalidRows > 0 && (
                        <span className="text-red-600">
                          ❌ 无效 <strong>{importResult.invalidRows}</strong> 条
                        </span>
                      )}
                      {duplicateCount > 0 && (
                        <span className="text-orange-600">
                          ⚠️ 疑似重复 <strong>{duplicateCount}</strong> 条
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {duplicateCount > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-800 mb-3 font-medium">
                    检测到 <strong>{duplicateCount}</strong> 条疑似重复条目，请选择处理策略：
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(['skip', 'overwrite', 'merge'] as ImportStrategy[]).map((strategy) => (
                      <button
                        key={strategy}
                        onClick={() => setAllDuplicatesStrategy(strategy)}
                        className="px-3 py-1.5 text-sm rounded-lg border transition-colors hover:bg-orange-100 border-orange-300 text-orange-700"
                      >
                        全部{STRATEGY_LABELS[strategy].label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-orange-600 mt-2">
                    也可以在下方表格中为每条单独选择策略
                  </p>
                </div>
              )}

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-display font-semibold text-gray-700 w-12"></th>
                      <th className="px-3 py-2 text-left font-display font-semibold text-gray-700 w-16">行号</th>
                      <th className="px-3 py-2 text-left font-display font-semibold text-gray-700">作品名</th>
                      <th className="px-3 py-2 text-left font-display font-semibold text-gray-700">CP名</th>
                      <th className="px-3 py-2 text-left font-display font-semibold text-gray-700">类型</th>
                      <th className="px-3 py-2 text-left font-display font-semibold text-gray-700">链接</th>
                      <th className="px-3 py-2 text-left font-display font-semibold text-gray-700">作者</th>
                      <th className="px-3 py-2 text-left font-display font-semibold text-gray-700">状态</th>
                      <th className="px-3 py-2 text-left font-display font-semibold text-gray-700">标签</th>
                      <th className="px-3 py-2 text-left font-display font-semibold text-gray-700">自定义标签</th>
                      <th className="px-3 py-2 text-left font-display font-semibold text-gray-700">阅读状态</th>
                      <th className="px-3 py-2 text-left font-display font-semibold text-gray-700">备注</th>
                      <th className="px-3 py-2 text-left font-display font-semibold text-gray-700 w-16">收藏</th>
                      <th className="px-3 py-2 text-left font-display font-semibold text-gray-700 w-16">评分</th>
                      <th className="px-3 py-2 text-left font-display font-semibold text-gray-700">重温日期</th>
                      <th className="px-3 py-2 text-left font-display font-semibold text-gray-700">导入策略</th>
                      <th className="px-3 py-2 text-left font-display font-semibold text-gray-700">问题</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.entries.map((entry) => (
                      <>
                        <tr
                          key={entry.rowNumber}
                          className={`border-t border-gray-100 ${getRowStatusColor(entry)}`}
                        >
                          <td className="px-2 py-2">
                            {entry.duplicates.length > 0 && (
                              <button
                                onClick={() => toggleRowExpand(entry.rowNumber)}
                                className="p-1 hover:bg-white/50 rounded transition-colors"
                                title="展开查看重复条目"
                              >
                                {expandedRows.has(entry.rowNumber) ? (
                                  <ChevronUp size={14} className="text-orange-600" />
                                ) : (
                                  <ChevronDown size={14} className="text-orange-600" />
                                )}
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono text-gray-500">{entry.rowNumber}</td>
                          <td className="px-3 py-2">
                            <span className={entry.errors.includes('缺少作品名') ? 'text-red-500' : 'text-gray-800'}>
                              {entry.workName || <span className="text-gray-400 italic">（空）</span>}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={entry.errors.includes('缺少CP名') ? 'text-red-500' : 'text-gray-800'}>
                              {entry.cpName || <span className="text-gray-400 italic">（空）</span>}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                entry.errors.some((e) => e.includes('类型'))
                                  ? 'bg-red-100 text-red-700'
                                  : TYPE_COLORS[entry.type]
                              }`}
                            >
                              {entry.type}
                            </span>
                          </td>
                          <td className="px-3 py-2 max-w-[200px] truncate text-gray-500" title={entry.link}>
                            {entry.link ? (
                              <a href={entry.link} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600 hover:underline">
                                🔗 链接
                              </a>
                            ) : (
                              <span className="text-gray-400 italic">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {entry.author || <span className="text-gray-400 italic">-</span>}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                entry.errors.some((e) => e.includes('状态'))
                                  ? 'bg-red-100 text-red-700'
                                  : STATUS_COLORS[entry.status]
                              }`}
                            >
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {entry.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={`inline-block px-1.5 py-0.5 rounded text-xs ${TAG_COLORS[tag]}`}
                                >
                                  {tag}
                                </span>
                              ))}
                              {entry.errors.some((e) => e.includes('标签不合法')) && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-600">
                                  ⚠️ 含非法标签
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {entry.customTags.map((tagId) => {
                                const tag = customTagMap.get(tagId);
                                return tag ? (
                                  <span
                                    key={tagId}
                                    className={`inline-block px-1.5 py-0.5 rounded text-xs ${CUSTOM_TAG_COLORS[tag.color] || 'bg-gray-100 text-gray-700'}`}
                                  >
                                    {tag.name}
                                  </span>
                                ) : null;
                              })}
                              {entry.warnings.some((w) => w.includes('自定义标签未找到')) && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700">
                                  ⚠️ 含未匹配标签
                                </span>
                              )}
                              {entry.customTags.length === 0 && !entry.warnings.some((w) => w.includes('自定义标签未找到')) && (
                                <span className="text-gray-400 italic text-xs">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                entry.errors.some((e) => e.includes('阅读状态'))
                                  ? 'bg-red-100 text-red-700'
                                  : READ_STATUS_COLORS[entry.readStatus]
                              }`}
                            >
                              {entry.readStatus}
                            </span>
                          </td>
                          <td className="px-3 py-2 max-w-[200px] truncate text-gray-600" title={entry.notes}>
                            {entry.notes || <span className="text-gray-400 italic">-</span>}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {entry.favorite ? (
                              <span className="text-red-500">❤️</span>
                            ) : (
                              <span className="text-gray-300">🤍</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {(entry.rating ?? 0) > 0 ? (
                              <span className="text-amber-500">{'⭐'.repeat(entry.rating ?? 0)}</span>
                            ) : (
                              <span className="text-gray-400 italic text-xs">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {entry.revisitDate ? (
                              <span className="text-purple-600">
                                {new Date(entry.revisitDate).toLocaleDateString('zh-CN')}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-xs">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {entry.isValid && entry.duplicates.length > 0 ? (
                              <select
                                value={getEntryStrategy(entry)}
                                onChange={(e) => setEntryStrategy(entry.rowNumber, e.target.value as ImportStrategy)}
                                className="text-xs px-2 py-1 rounded border border-orange-300 bg-white text-orange-700 focus:outline-none focus:ring-1 focus:ring-orange-400"
                              >
                                {(['skip', 'overwrite', 'merge'] as ImportStrategy[]).map((strategy) => (
                                  <option key={strategy} value={strategy}>
                                    {STRATEGY_LABELS[strategy].label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 max-w-xs">
                            {entry.errors.length > 0 && (
                              <div className="text-red-600 text-xs mb-1">
                                ❌ {entry.errors.join('；')}
                              </div>
                            )}
                            {entry.duplicates.length > 0 && (
                              <div className="text-orange-600 text-xs mb-1">
                                ⚠️ 发现 {entry.duplicates.length} 条疑似重复
                              </div>
                            )}
                            {entry.warnings.length > 0 && (
                              <div className="text-amber-600 text-xs">
                                ⚠️ {entry.warnings.join('；')}
                              </div>
                            )}
                            {entry.errors.length === 0 && entry.warnings.length === 0 && entry.duplicates.length === 0 && (
                              <span className="text-green-600 text-xs">✅ 正常</span>
                            )}
                          </td>
                        </tr>
                        {expandedRows.has(entry.rowNumber) && entry.duplicates.length > 0 && (
                          <tr className="bg-orange-100/50 border-t-0">
                            <td colSpan={15} className="px-4 py-3">
                              <div className="text-xs text-orange-800 font-medium mb-2">
                                命中的已有条目（共 {entry.duplicates.length} 条）：
                              </div>
                              <div className="space-y-2">
                                {entry.duplicates.map((dup) => (
                                  <div
                                    key={dup.entry.id}
                                    className="bg-white rounded-lg p-3 border border-orange-200"
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-800">
                                          {dup.entry.workName} / {dup.entry.cpName}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          作者：{dup.entry.author || '-'} | 状态：{dup.entry.status} | 阅读：{dup.entry.readStatus}
                                        </div>
                                        {dup.entry.notes && (
                                          <div className="text-xs text-gray-500 mt-1 truncate max-w-md">
                                            备注：{dup.entry.notes}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <div className="text-xs text-orange-600 font-medium">
                                          匹配度：{dup.matchScore}
                                        </div>
                                        <div className="text-xs text-orange-500 mt-1">
                                          {dup.matchReasons.join('、')}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2.5 text-sm font-display font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  重新输入
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={importResult.validRows === 0}
                  className={`flex-1 px-4 py-2.5 text-sm font-display font-medium rounded-lg transition-colors ${
                    importResult.validRows > 0
                      ? 'text-white bg-primary-600 hover:bg-primary-700'
                      : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                  }`}
                >
                  确认导入 {importResult.validRows} 条
                  {duplicateCount > 0 && `（${duplicateCount} 条重复待处理）`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
