import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { type Project, type ExecutionItem, type Issue } from '../types';

interface ProjectState {
    projects: Project[];
    isLoading: boolean;
    error: string | null;

    fetchProjects: () => Promise<void>;
    addProject: (project: Omit<Project, 'id'>) => Promise<void>;
    updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;

    addItem: (projectId: string, item: Omit<ExecutionItem, 'id'>) => Promise<void>;
    updateItem: (projectId: string, itemId: string, updates: Partial<ExecutionItem>) => Promise<void>;
    deleteItem: (projectId: string, itemId: string) => Promise<void>;

    addIssue: (projectId: string, issue: Omit<Issue, 'id'>) => Promise<void>;
    updateIssue: (projectId: string, issueId: string, updates: Partial<Issue>) => Promise<void>;
    deleteIssue: (projectId: string, issueId: string) => Promise<void>;

    migrateFromLocal: (localProjects: Project[]) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    isLoading: false,
    error: null,

    fetchProjects: async () => {
        set({ isLoading: true, error: null });
        try {
            // Fetch Projects
            const { data: projectsData, error: pError } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: true });

            if (pError) throw pError;

            // Fetch Items
            const { data: itemsData, error: iError } = await supabase
                .from('items')
                .select('*');

            if (iError) throw iError;

            // Fetch Issues
            const { data: issuesData, error: isError } = await supabase
                .from('issues')
                .select('*');

            if (isError) throw isError;

            // Transform and combine
            const projects = projectsData.map((p: any) => ({
                id: p.id,
                name: p.name,
                status: p.status,
                startDate: p.start_date,
                endDate: p.end_date,
                items: itemsData.filter((i: any) => i.project_id === p.id).map((i: any) => ({
                    id: i.id,
                    projectId: i.project_id,
                    parentId: i.parent_id,
                    name: i.name,
                    status: i.status,
                    weight: i.weight,
                    planStartDate: i.plan_start_date,
                    planEndDate: i.plan_end_date,
                    actualStartDate: i.actual_start_date,
                    actualEndDate: i.actual_end_date,
                    plannedQuantity: 0, // DB schema needs update? or just omit
                    actualQuantity: 0,
                    depth: i.depth
                })),
                issues: issuesData.filter((is: any) => is.project_id === p.id).map((is: any) => ({
                    id: is.id,
                    projectId: is.project_id,
                    title: is.title,
                    status: is.status,
                    priority: is.priority,
                    createdAt: is.created_at, // timestamp
                    // other fields
                }))
            }));

            set({ projects });
        } catch (err: any) {
            console.error('Fetch error:', err);
            set({ error: err.message });
        } finally {
            set({ isLoading: false });
        }
    },

    addProject: async (project) => {
        try {
            const { data: newProject, error } = await supabase
                .from('projects')
                .insert([{
                    name: project.name,
                    status: project.status,
                    start_date: project.startDate,
                    end_date: project.endDate
                }])
                .select()
                .single();

            if (error) throw error;

            if (project.items && project.items.length > 0) {
                const itemsToInsert = project.items.map((i) => ({
                    project_id: newProject.id,
                    name: i.name,
                    status: i.status,
                    weight: i.weight,
                    plan_start_date: i.planStartDate,
                    plan_end_date: i.planEndDate,
                    depth: (i as any).depth || 0
                }));

                const { error: iError } = await supabase.from('items').insert(itemsToInsert);
                if (iError) throw iError;
            }

            get().fetchProjects();
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    updateProject: async (id, updates) => {
        try {
            const dbUpdates: any = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.status) dbUpdates.status = updates.status;
            if (updates.startDate) dbUpdates.start_date = updates.startDate;
            if (updates.endDate) dbUpdates.end_date = updates.endDate;

            const { error } = await supabase
                .from('projects')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;
            get().fetchProjects();
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    deleteProject: async (id) => {
        try {
            const { error } = await supabase.from('projects').delete().eq('id', id);
            if (error) throw error;
            get().fetchProjects();
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    addItem: async (projectId, item) => {
        try {
            const { error } = await supabase.from('items').insert([{
                project_id: projectId,
                parent_id: item.parentId,
                name: item.name,
                status: item.status,
                plan_start_date: item.planStartDate,
                plan_end_date: item.planEndDate,
                depth: (item as any).depth || 0 // item interface might need depth
            }]);
            if (error) throw error;
            get().fetchProjects();
        } catch (err: any) { set({ error: err.message }); }
    },

    updateItem: async (_projectId, itemId, updates) => {
        try {
            const dbUpdates: any = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.status) dbUpdates.status = updates.status;
            if (updates.planStartDate) dbUpdates.plan_start_date = updates.planStartDate;
            if (updates.planEndDate) dbUpdates.plan_end_date = updates.planEndDate;
            if (updates.actualStartDate) dbUpdates.actual_start_date = updates.actualStartDate;
            if (updates.actualEndDate) dbUpdates.actual_end_date = updates.actualEndDate;

            const { error } = await supabase.from('items').update(dbUpdates).eq('id', itemId);
            if (error) throw error;
            get().fetchProjects();
        } catch (err: any) { set({ error: err.message }); }
    },

    deleteItem: async (_projectId, itemId) => {
        try {
            const { error } = await supabase.from('items').delete().eq('id', itemId);
            if (error) throw error;
            get().fetchProjects();
        } catch (err: any) { set({ error: err.message }); }
    },

    addIssue: async (projectId, issue) => {
        try {
            const { error } = await supabase.from('issues').insert([{
                project_id: projectId,
                title: issue.title,
                status: issue.status,
                priority: issue.priority
            }]);
            if (error) throw error;
            get().fetchProjects();
        } catch (err: any) { set({ error: err.message }); }
    },

    updateIssue: async (_projectId, _issueId, _updates) => {
        // Implement similarly
        get().fetchProjects();
    },

    deleteIssue: async (_projectId, issueId) => {
        try {
            const { error } = await supabase.from('issues').delete().eq('id', issueId);
            if (error) throw error;
            get().fetchProjects();
        } catch (err: any) { set({ error: err.message }); }
    },

    migrateFromLocal: async (localProjects) => {
        set({ isLoading: true, error: null });
        try {
            for (const p of localProjects) {
                // Insert Project
                const { error: pError } = await supabase.from('projects').insert({
                    id: p.id,
                    name: p.name,
                    status: p.status,
                    start_date: p.startDate,
                    end_date: p.endDate
                });

                if (pError) {
                    console.warn(`Project ${p.name} insert failed:`, pError.message);
                    continue;
                }

                // Flatten Items
                const flatItems: any[] = [];
                const flatten = (items: any[], parentId: string | null) => {
                    items.forEach(i => {
                        flatItems.push({ ...i, parentId });
                        if (i.children) flatten(i.children, i.id);
                    });
                };
                flatten(p.items || [], null);

                // Insert Items
                for (const item of flatItems) {
                    const { error: iError } = await supabase.from('items').insert({
                        id: item.id,
                        project_id: p.id,
                        parent_id: item.parentId,
                        name: item.name,
                        status: item.status,
                        weight: item.weight || 0,
                        plan_start_date: item.planStartDate,
                        plan_end_date: item.planEndDate,
                        actual_start_date: item.actualStartDate,
                        actual_end_date: item.actualEndDate,
                        depth: item.depth || 0
                    });
                    if (iError) console.warn(`Item ${item.name} insert failed:`, iError.message);
                }

                // Insert Issues
                if (p.issues) {
                    for (const issue of p.issues) {
                        await supabase.from('issues').insert({
                            id: issue.id,
                            project_id: p.id,
                            title: issue.title,
                            status: issue.status,
                            priority: issue.priority,
                            created_at: issue.createdAt
                        });
                    }
                }
            }
            await get().fetchProjects();
            alert("Migration Complete!");
        } catch (err: any) {
            set({ error: err.message });
        } finally {
            set({ isLoading: false });
        }
    }
}));
