import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Project, type ExecutionItem, type Issue } from '../types';

interface ProjectState {
    projects: Project[];
    addProject: (project: Project) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    addItem: (projectId: string, item: ExecutionItem) => void;
    updateItem: (projectId: string, itemId: string, updates: Partial<ExecutionItem>) => void;
    deleteItem: (projectId: string, itemId: string) => void;
    importData: (data: ProjectState) => void;
    addIssue: (projectId: string, issue: Issue) => void;
    updateIssue: (projectId: string, issueId: string, updates: Partial<Issue>) => void;
    deleteIssue: (projectId: string, issueId: string) => void;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set) => ({
            projects: [],
            importData: (data) => set({ projects: data.projects }),
            addProject: (project) =>
                set((state) => ({ projects: [...state.projects, project] })),
            updateProject: (id, updates) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === id ? { ...p, ...updates } : p
                    ),
                })),
            deleteProject: (id) =>
                set((state) => ({
                    projects: state.projects.filter((p) => p.id !== id),
                })),
            addItem: (projectId, item) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === projectId ? { ...p, items: [...p.items, item] } : p
                    ),
                })),
            updateItem: (projectId, itemId, updates) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === projectId
                            ? {
                                ...p,
                                items: p.items.map((i) =>
                                    i.id === itemId ? { ...i, ...updates } : i
                                ),
                            }
                            : p
                    ),
                })),
            deleteItem: (projectId, itemId) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === projectId
                            ? {
                                ...p,
                                items: p.items.filter((i) => i.id !== itemId),
                            }
                            : p
                    ),
                })),
            addIssue: (projectId, issue) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === projectId ? { ...p, issues: [...(p.issues || []), issue] } : p
                    ),
                })),
            updateIssue: (projectId, issueId, updates) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === projectId
                            ? {
                                ...p,
                                issues: (p.issues || []).map((i) =>
                                    i.id === issueId ? { ...i, ...updates } : i
                                ),
                            }
                            : p
                    ),
                })),
            deleteIssue: (projectId, issueId) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === projectId
                            ? {
                                ...p,
                                issues: (p.issues || []).filter((i) => i.id !== issueId),
                            }
                            : p
                    ),
                })),
        }),
        {
            name: 'pm-storage',
        }
    )
);
