import { useProjectStore } from '../store/useProjectStore';
import { Download } from 'lucide-react';

export const BackupService = () => {
    const store = useProjectStore();

    const handleExport = () => {
        const data = {
            projects: store.projects,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pm-dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 text-xs font-medium transition-colors"
                title="데이터 내보내기"
            >
                <Download size={14} /> 백업 (JSON)
            </button>
            <button
                onClick={() => {
                    if (confirm('로컬 스토리지의 데이터를 DB로 전송하시겠습니까? (중복 데이터는 건너뜁니다)')) {
                        const localData = localStorage.getItem('pm-storage');
                        if (localData) {
                            try {
                                const parsed = JSON.parse(localData);
                                if (parsed.state && parsed.state.projects) {
                                    store.migrateFromLocal(parsed.state.projects);
                                } else {
                                    alert('유효한 로컬 데이터가 없습니다.');
                                }
                            } catch (e) { alert('로컬 데이터 읽기 실패'); }
                        } else {
                            alert('로컬 데이터가 없습니다.');
                        }
                    }
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 text-xs font-medium transition-colors"
                title="로컬 데이터 DB로 전송"
            >
                DB 마이그레이션
            </button>
        </div>
    );
};
