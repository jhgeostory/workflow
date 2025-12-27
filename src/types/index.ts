export type ProjectStatus = 'Proposal' | 'Contract' | 'Execution' | 'Termination';

export type ItemStatus = 'Plan' | 'Progress' | 'Complete';

export interface ExecutionItem {
    id: string;
    projectId: string;
    name: string;
    status: ItemStatus;
    startDate?: string; // ISO Date string
    planDate: string; // ISO Date string
    completionDate?: string; // ISO Date string
    plannedQuantity: number;
    actualQuantity: number;
    weight: number;
    children?: ExecutionItem[];
    parentId?: string;
    sortOrder?: number;
}

export type IssueStatus = 'Open' | 'InProgress' | 'Resolved';
export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Issue {
    id: string;
    projectId: string;
    title: string;
    description?: string;
    status: IssueStatus;
    priority: IssuePriority;
    assignee?: string;
    createdAt: string;
    resolvedAt?: string;
}

export interface Project {
    id: string;
    name: string;
    status: ProjectStatus;
    startDate: string;
    endDate: string;
    items: ExecutionItem[];
    issues: Issue[];
}
