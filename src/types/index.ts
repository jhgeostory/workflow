export type ProjectStatus = 'Proposal' | 'Contract' | 'Execution' | 'Termination';

export type ItemStatus = 'Plan' | 'Progress' | 'Complete';

export interface ExecutionItem {
    id: string;
    projectId: string;
    name: string;
    status: ItemStatus;
    planDate: string; // ISO Date string
    completionDate?: string; // ISO Date string
    weight?: number; // Default 1
}

export interface Project {
    id: string;
    name: string;
    status: ProjectStatus;
    startDate: string;
    endDate: string;
    items: ExecutionItem[];
}
