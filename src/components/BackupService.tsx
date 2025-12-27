import React, { useRef } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { Download, Upload } from 'lucide-react';

export const BackupService = () => {
    const store = useProjectStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (Array.isArray(json.projects)) {
                    if (confirm(`현재 데이터가 ${json.projects.length}개의 프로젝트로 덮어씌워집니다. 진행하시겠습니까?`)) {
                        store.importData(json);
                        alert('데이터 복구가 완료되었습니다.');
                    }
                } else {
                    alert('올바르지 않은 백업 파일 형식입니다.');
                }
            } catch (err) {
                console.error(err);
                alert('파일을 읽는 중 오류가 발생했습니다.');
            }
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 text-xs font-medium transition-colors"
                title="데이터 내보내기"
            >
                <Download size={14} /> 백업
            </button>
            <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 text-xs font-medium transition-colors"
                title="데이터 불러오기"
            >
                <Upload size={14} /> 복구
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                className="hidden"
            />
        </div>
    );
};
