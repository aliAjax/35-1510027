import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, Download, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { getMigrationInfo, saveMigrationInfo, restoreFromBackup, listBackups, deleteBackup, type MigrationResult } from '../utils/dataMigration';

export const MigrationNotice = () => {
  const [showNotice, setShowNotice] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [backups, setBackups] = useState<string[]>([]);
  const [showBackups, setShowBackups] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [pendingRestore, setPendingRestore] = useState(false);

  useEffect(() => {
    const info = getMigrationInfo();
    const hasMigrationResult = info.lastMigrationResult && (
      info.lastMigrationResult.warnings.length > 0 ||
      !info.lastMigrationResult.success ||
      info.pendingRestore
    );
    
    if (hasMigrationResult) {
      setMigrationResult(info.lastMigrationResult);
      setShowNotice(true);
      setPendingRestore(info.pendingRestore);
      if (info.pendingRestore || !info.lastMigrationResult?.success) {
        setShowBackups(true);
      }
    }
    setBackups(listBackups());
  }, []);

  const handleDismiss = () => {
    if (pendingRestore) {
      const info = getMigrationInfo();
      info.pendingRestore = false;
      saveMigrationInfo(info);
    }
    setShowNotice(false);
  };

  const handleRestore = (backupKey: string) => {
    const success = restoreFromBackup(backupKey);
    if (success) {
      const info = getMigrationInfo();
      info.pendingRestore = false;
      saveMigrationInfo(info);
      setRestoreSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const handleDeleteBackup = (backupKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteBackup(backupKey);
    setBackups(listBackups());
  };

  const formatBackupDate = (key: string) => {
    const timestamp = parseInt(key.split('-').pop() || '0');
    if (timestamp) {
      return new Date(timestamp).toLocaleString('zh-CN');
    }
    return key;
  };

  if (!showNotice || !migrationResult) {
    return null;
  }

  const hasWarnings = migrationResult.warnings.length > 0;
  const hasErrors = migrationResult.errors.length > 0;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in">
      <div
        className={`glass-panel rounded-xl shadow-lg border-l-4 overflow-hidden ${
          hasErrors
            ? 'border-red-500 bg-red-50'
            : hasWarnings
            ? 'border-amber-500 bg-amber-50'
            : 'border-green-500 bg-green-50'
        }`}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-full ${
                hasErrors
                  ? 'bg-red-100 text-red-600'
                  : hasWarnings
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-green-100 text-green-600'
              }`}
            >
              {hasErrors ? (
                <AlertTriangle size={20} />
              ) : hasWarnings ? (
                <AlertTriangle size={20} />
              ) : (
                <CheckCircle size={20} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-800">
                {hasErrors ? '数据迁移失败' : hasWarnings ? '数据迁移完成（含警告）' : '数据迁移成功'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                从版本 {migrationResult.fromVersion} 迁移到 {migrationResult.toVersion}
              </p>
              {migrationResult.backupCreated && (
                <p className={`text-xs mt-1 ${hasErrors ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  {hasErrors ? '⚠️ 迁移失败，建议从下方备份恢复数据' : '已创建备份，可在下方恢复'}
                </p>
              )}
              {pendingRestore && !migrationResult.backupCreated && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  ⚠️ 上一次迁移失败，请从下方备份恢复
                </p>
              )}
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-black/5 rounded transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {hasWarnings && (
            <div className="mt-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-sm text-amber-700 hover:text-amber-800"
              >
                {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showDetails ? '收起详情' : '查看详情'}
              </button>
              {showDetails && (
                <ul className="mt-2 text-sm text-amber-700 space-y-1 max-h-40 overflow-y-auto">
                  {migrationResult.warnings.map((warning, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {hasErrors && (
            <div className="mt-3">
              <ul className="text-sm text-red-700 space-y-1">
                {migrationResult.errors.map((error, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {backups.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => setShowBackups(!showBackups)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
              >
                <Download size={14} />
                {showBackups ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                可用备份 ({backups.length})
              </button>
              {showBackups && (
                <div className="mt-2 space-y-2">
                  {backups.map((backup) => (
                    <div
                      key={backup}
                      className="flex items-center justify-between p-2 bg-white/50 rounded-lg hover:bg-white/80 transition-colors"
                    >
                      <span className="text-sm text-gray-600 truncate flex-1">
                        {formatBackupDate(backup)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRestore(backup)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="恢复此备份"
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteBackup(backup, e)}
                          className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors"
                          title="删除此备份"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {restoreSuccess && (
            <div className="mt-3 p-2 bg-green-100 rounded-lg text-center text-green-700 text-sm">
              恢复成功，页面即将刷新...
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
