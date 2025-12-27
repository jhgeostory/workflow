import { useState } from 'react';
import type { Issue, IssueStatus, IssuePriority } from '../types';
import { useProjectStore } from '../store/useProjectStore';
import { Plus, Trash2, CheckCircle, AlertCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface IssueListProps {
    projectId: string;
}

export function IssueList({ projectId }: IssueListProps) {
    const { projects, addIssue, updateIssue, deleteIssue } = useProjectStore();
    const project = projects.find(p => p.id === projectId);
    const issues = project?.issues || [];

    const [isAdding, setIsAdding] = useState(false);
    const [newIssue, setNewIssue] = useState<Partial<Issue>>({
        title: '',
        status: 'Open',
        priority: 'Medium',
        description: '',
        assignee: ''
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newIssue.title) return;

        addIssue(projectId, {
            id: crypto.randomUUID(),
            projectId,
            title: newIssue.title,
            status: newIssue.status as IssueStatus,
            priority: newIssue.priority as IssuePriority,
            description: newIssue.description,
            assignee: newIssue.assignee,
            createdAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
        } as Issue);

        setNewIssue({ title: '', status: 'Open', priority: 'Medium', description: '', assignee: '' });
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('이 이슈를 삭제하시겠습니까?')) {
            deleteIssue(projectId, id);
        }
    };

    const handleResolve = (issue: Issue) => {
        if (issue.status === 'Resolved') {
            updateIssue(projectId, issue.id, { status: 'InProgress', resolvedAt: undefined });
        } else {
            updateIssue(projectId, issue.id, {
                status: 'Resolved',
                resolvedAt: format(new Date(), 'yyyy-MM-dd HH:mm')
            });
        }
    };

    const getPriorityColor = (p: IssuePriority) => {
        switch (p) {
            case 'Critical': return 'text-red-600 bg-red-50 border-red-200';
            case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'Low': return 'text-slate-600 bg-slate-50 border-slate-200';
            default: return 'text-slate-600';
        }
    };

    const getStatusColor = (s: IssueStatus) => {
        switch (s) {
            case 'Resolved': return 'text-green-600 bg-green-50 border-green-200';
            case 'InProgress': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'Open': return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">이슈 관리</h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
                >
                    <Plus size={16} /> 이슈 등록
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAdd} className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">제목</label>
                            <input
                                type="text"
                                required
                                value={newIssue.title}
                                onChange={e => setNewIssue(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="이슈 제목을 입력하세요"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">상태</label>
                            <select
                                value={newIssue.status}
                                onChange={e => setNewIssue({ ...newIssue, status: e.target.value as IssueStatus })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Open">Open</option>
                                <option value="InProgress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">우선순위</label>
                            <select
                                value={newIssue.priority}
                                onChange={e => setNewIssue({ ...newIssue, priority: e.target.value as IssuePriority })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">설명</label>
                            <textarea
                                value={newIssue.description || ''}
                                onChange={e => setNewIssue({ ...newIssue, description: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                                placeholder="상세 내용을 입력하세요..."
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">담당자</label>
                            <input
                                type="text"
                                value={newIssue.assignee || ''}
                                onChange={e => setNewIssue({ ...newIssue, assignee: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="담당자 이름"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 text-sm"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                            저장
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {issues.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        등록된 이슈가 없습니다.
                    </div>
                ) : (
                    issues.map(issue => (
                        <div key={issue.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-start gap-3">
                                    <div className={cn("mt-1", issue.status === 'Resolved' ? "text-green-500" : "text-red-500")}>
                                        {issue.status === 'Resolved' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <div>
                                        <h4 className={cn("text-base font-semibold text-slate-900", issue.status === 'Resolved' && "line-through text-slate-500")}>
                                            {issue.title}
                                        </h4>
                                        <div className="text-sm text-slate-500 mt-1 flex items-center gap-3">
                                            <span>{issue.createdAt}</span>
                                            {issue.assignee && (
                                                <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                                                    <User size={12} /> {issue.assignee}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border", getPriorityColor(issue.priority))}>
                                        {issue.priority}
                                    </span>
                                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border", getStatusColor(issue.status))}>
                                        {issue.status}
                                    </span>
                                </div>
                            </div>

                            {issue.description && (
                                <p className="text-sm text-slate-600 ml-8 mb-3 whitespace-pre-wrap">{issue.description}</p>
                            )}

                            <div className="flex justify-end gap-2 ml-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleResolve(issue)}
                                    className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                                >
                                    {issue.status === 'Resolved' ? '재오픈' : '해결 완료'}
                                </button>
                                <button
                                    onClick={() => handleDelete(issue.id)}
                                    className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center gap-1"
                                >
                                    <Trash2 size={12} /> 삭제
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
