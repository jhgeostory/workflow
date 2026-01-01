import { useMemo } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { differenceInDays, parseISO, isBefore, addDays } from 'date-fns';

export type NotificationType = 'deadline' | 'overdue' | 'issue' | 'info';

export interface Notification {
    id: string;
    projectId: string;
    projectName: string;
    message: string;
    type: NotificationType;
    date: string; // Relevant date (deadline, etc.)
    link?: string;
}

export function useNotifications() {
    const { projects } = useProjectStore();

    const notifications = useMemo(() => {
        const list: Notification[] = [];
        const today = new Date();
        const sevenDaysLater = addDays(today, 7);

        projects.forEach(project => {
            // 1. Project Deadline approaching (7 days)
            if (project.endDate && project.status === 'Execution') {
                const end = parseISO(project.endDate);
                if (isBefore(end, sevenDaysLater) && isBefore(today, end)) {
                    list.push({
                        id: `proj-${project.id}-end`,
                        projectId: project.id,
                        projectName: project.name,
                        message: `프로젝트 종료가 ${differenceInDays(end, today)}일 남았습니다.`,
                        type: 'deadline',
                        date: project.endDate,
                        link: `/projects/${project.id}`
                    });
                }
            }

            // 2. Critical/High Issues
            project.issues.forEach(issue => {
                if (issue.status !== 'Resolved' && (issue.priority === 'Critical' || issue.priority === 'High')) {
                    list.push({
                        id: `issue-${issue.id}`,
                        projectId: project.id,
                        projectName: project.name,
                        message: `[${issue.priority}] 이슈: ${issue.title}`,
                        type: 'issue',
                        date: issue.createdAt,
                        link: `/projects/${project.id}` // Ideally link to issue tab?
                    });
                }
            });

            // 3. Overdue Items (In Progress but past Plan End Date, or Plan but past Plan Start Date?)
            // Let's focus on delayed finishing.
            project.items.forEach(item => {
                if (item.status !== 'Complete' && item.planEndDate) {
                    const planEnd = parseISO(item.planEndDate);
                    if (isBefore(planEnd, today)) {
                        const delay = differenceInDays(today, planEnd);
                        if (delay > 0) {
                            list.push({
                                id: `item-${item.id}-overdue`,
                                projectId: project.id,
                                projectName: project.name,
                                message: `항목 지연: ${item.name} (${delay}일 지연)`,
                                type: 'overdue',
                                date: item.planEndDate,
                                link: `/projects/${project.id}`
                            });
                        }
                    }
                }
            });
        });

        // Sort by urgency? Or date?
        // Let's sort issues/overdue first.
        return list.sort((a, b) => {
            const priority = { issue: 0, overdue: 1, deadline: 2, info: 3 };
            return priority[a.type] - priority[b.type];
        });
    }, [projects]);

    return notifications;
}
