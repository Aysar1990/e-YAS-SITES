import { useState, useEffect } from 'react';
import './SyncIndicator.css';

function SyncIndicator() {
  const [status, setStatus] = useState({
    syncing: false,
    lastUpdate: null,
    rowCount: 0,
    message: ''
  });

  useEffect(() => {
    // Listener للتغيير في Excel
    window.electron.onExcelChanged((data) => {
      console.log('📊 Excel file changed');
      setStatus({
        syncing: true,
        message: 'جاري تحديث البيانات...',
        lastUpdate: data.timestamp,
        rowCount: 0
      });
    });

    // Listener للتحديث المكتمل
    window.electron.onDataRefreshed((data) => {
      console.log('✅ Data refreshed:', data.rowCount, 'sites');
      setStatus({
        syncing: false,
        message: `تم تحديث ${data.rowCount} موقع`,
        lastUpdate: data.timestamp,
        rowCount: data.rowCount
      });

      // تحديث الصفحة تلقائياً بعد ثانية
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });

    // Listener للأخطاء
    window.electron.onSyncError((data) => {
      console.error('❌ Sync error:', data.error);
      setStatus({
        syncing: false,
        message: 'خطأ في التحديث: ' + data.error,
        lastUpdate: new Date().toISOString(),
        rowCount: 0
      });
    });

    // Cleanup
    return () => {
      window.electron.removeAllSyncListeners();
    };
  }, []);

  // لا تعرض شيء إذا لم يكن هناك نشاط
  if (!status.syncing && !status.lastUpdate) {
    return null;
  }

  return (
    <div className={`sync-indicator ${status.syncing ? 'syncing' : 'synced'}`}>
      {status.syncing ? (
        <>
          <span className="sync-spinner">⟳</span>
          <span>{status.message}</span>
        </>
      ) : (
        <>
          <span className="sync-check">✓</span>
          <span>{status.message}</span>
          {status.lastUpdate && (
            <small className="sync-time">
              {new Date(status.lastUpdate).toLocaleTimeString('ar-JO')}
            </small>
          )}
        </>
      )}
    </div>
  );
}

export default SyncIndicator;
