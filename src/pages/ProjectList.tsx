import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, ArrowRight, Trash2 } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { type Project, type ProjectStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { format } from 'date-fns';

export default function ProjectList() {
    const { projects, addProject, deleteProject } = useProjectStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newProject, setNewProject] = useState<Partial<Project>>({
        name: '',
        status: 'Proposal',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProject.name) return;

        addProject({
            id: crypto.randomUUID(),
            name: newProject.name,
            status: newProject.status as ProjectStatus,
            startDate: newProject.startDate!,
            endDate: newProject.endDate!,
            items: [],
        } as Project);

        setIsCreating(false);
        setNewProject({
            name: '',
            status: 'Proposal',
            startDate: format(new Date(), 'yyyy-MM-dd'),
            endDate: format(new Date(), 'yyyy-MM-dd'),
        });
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('정말 삭제하시겠습니까?')) {
            deleteProject(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">프로젝트 목록</h2>
                    <p className="text-slate-500 mt-1">총 {projects.length}개의 프로젝트가 있습니다.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                >
                    <Plus size={18} />
                    신규 프로젝트
                </button>
            </div>

            {isCreating && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold mb-4">새 프로젝트 생성</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">프로젝트명</label>
                                <input
                                    type="text"
                                    required
                                    value={newProject.name}
                                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="프로젝트 이름을 입력하세요"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">시작일</label>
                                    <input
                                        type="date"
                                        required
                                        value={newProject.startDate}
                                        onChange={e => setNewProject({ ...newProject, startDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">종료일</label>
                                    <input
                                        type="date"
                                        required
                                        value={newProject.endDate}
                                        onChange={e => setNewProject({ ...newProject, endDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">초기 단계</label>
                                <select
                                    value={newProject.status}
                                    onChange={e => setNewProject({ ...newProject, status: e.target.value as ProjectStatus })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Proposal">제안</option>
                                    <option value="Contract">계약</option>
                                    <option value="Execution">수행</option>
                                    <option value="Termination">종료</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium"
                                >
                                    생성하기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <Link
                        key={project.id}
                        to={`/projects/${project.id}`}
                        className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <StatusBadge status={project.status} />
                                <button onClick={(e) => handleDelete(e, project.id)} className="text-slate-400 hover:text-red-500 p-1">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 mb-2 truncate group-hover:text-blue-600 transition-colors">
                                {project.name}
                            </h3>
                            <div className="flex items-center text-slate-500 text-sm gap-2 mb-4">
                                <Calendar size={14} />
                                <span>{project.startDate} ~ {project.endDate}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                            <span className="text-slate-500">
                                항목 {project.items.length}개
                            </span>
                            <span className="flex items-center text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                상세보기 <ArrowRight size={14} className="ml-1" />
                            </span>
                        </div>
                    </Link>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border-dashed border-2 border-slate-200">
                        <p>등록된 프로젝트가 없습니다.</p>
                        <p className="text-sm mt-2">새 프로젝트를 생성하여 관리를 시작하세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
