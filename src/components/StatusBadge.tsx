import { type ProjectStatus, type ItemStatus } from '../types';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
    status: ProjectStatus | ItemStatus;
    type?: 'project' | 'item';
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const styles: Record<string, string> = {
        // Project Statuses
        Proposal: 'bg-blue-50 text-blue-700 border-blue-200',
        Contract: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        Execution: 'bg-green-50 text-green-700 border-green-200',
        Termination: 'bg-slate-100 text-slate-700 border-slate-200',

        // Item Statuses
        Plan: 'bg-gray-100 text-gray-600 border-gray-200',
        Progress: 'bg-amber-50 text-amber-700 border-amber-200',
        Complete: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };

    const labels: Record<string, string> = {
        Proposal: '제안',
        Contract: '계약',
        Execution: '수행',
        Termination: '종료',
        Plan: '계획',
        Progress: '진행',
        Complete: '완료',
    };

    return (
        <span className={cn(
            "px-2.5 py-0.5 rounded-full text-xs font-medium border",
            styles[status] || 'bg-gray-100 text-gray-800'
        )}>
            {labels[status] || status}
        </span>
    );
}
