import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, BorderStyle, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import type { Project, ExecutionItem } from '../types';
import { calculateProgress } from './progress';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, getWeekOfMonth } from 'date-fns';

// ... imports

/**
 * Common styles for consistency
 */
const BORDER_STYLE = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: "000000",
};

const TABLE_BORDERS = {
    top: BORDER_STYLE,
    bottom: BORDER_STYLE,
    left: BORDER_STYLE,
    right: BORDER_STYLE,
    insideHorizontal: BORDER_STYLE,
    insideVertical: BORDER_STYLE,
};

function createHeader(text: string, level: any = HeadingLevel.HEADING_1) {
    // ...
    return new Paragraph({
        text: text,
        heading: level,
        spacing: { after: 200, before: 200 },
    });
}

function createText(text: string, bold: boolean = false) {
    return new TextRun({
        text: text,
        bold: bold,
        size: 24, // 12pt
        font: "Malgun Gothic", // Good for Korean text
    });
}

/**
 * Section: Project Progress Summary Table
 */
function createProjectSummaryTable(projects: Project[]) {
    const headerRow = new TableRow({
        children: [
            new TableCell({ children: [new Paragraph({ children: [createText("프로젝트명", true)], alignment: AlignmentType.CENTER })], width: { size: 50, type: WidthType.PERCENTAGE }, shading: { fill: "E0E0E0" } }),
            new TableCell({ children: [new Paragraph({ children: [createText("단계", true)], alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE }, shading: { fill: "E0E0E0" } }),
            new TableCell({ children: [new Paragraph({ children: [createText("공정률(%)", true)], alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE }, shading: { fill: "E0E0E0" } }),
        ],
    });

    const rows = projects.map(p => {
        const progress = calculateProgress(p.items);
        return new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ text: p.name })] }),
                new TableCell({ children: [new Paragraph({ text: p.status, alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ text: `${progress}%`, alignment: AlignmentType.CENTER })] }),
            ],
        });
    });

    return new Table({
        rows: [headerRow, ...rows],
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: TABLE_BORDERS,
    });
}

/**
 * Section: Detailed Task List per Project
 */
function createDetailedTaskTables(projects: Project[], startDate: Date, endDate: Date) {
    const sections: (Paragraph | Table)[] = [];

    if (projects.length === 0) {
        sections.push(new Paragraph({ text: "등록된 프로젝트가 없습니다.", alignment: AlignmentType.CENTER, spacing: { before: 200 } }));
        return sections;
    }

    projects.forEach(p => {
        // 1. Flatten Tree with Depth
        const flatItems: (ExecutionItem & { depth: number })[] = [];
        const traverse = (items: ExecutionItem[], depth: number) => {
            items.forEach(item => {
                flatItems.push({ ...item, depth });
                if (item.children && item.children.length > 0) {
                    traverse(item.children, depth + 1);
                }
            });
        };
        // Ensure p.items is treated as (potentially) roots.
        traverse(p.items, 0);

        // 2. Filter items: Planned OR Completed within the range
        const relevantItems = flatItems.filter(item => {
            const isPlanned = safeIsWithinInterval(item.planEndDate, { start: startDate, end: endDate });
            const isCompleted = safeIsWithinInterval(item.actualEndDate, { start: startDate, end: endDate });
            return isPlanned || isCompleted;
        });

        // Project Header
        sections.push(new Paragraph({
            children: [createText(`[${p.name}] 수행 내역`, true)],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 100 },
        }));

        if (relevantItems.length === 0) {
            sections.push(new Paragraph({ text: "- 해당 기간 내 계획/수행된 업무가 없습니다.", indent: { left: 400 } }));
            return;
        }

        // Table Header
        const headerRow = new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ children: [createText("업무명", true)], alignment: AlignmentType.CENTER })], width: { size: 40, type: WidthType.PERCENTAGE }, shading: { fill: "F5F5F5" } }),
                new TableCell({ children: [new Paragraph({ children: [createText("상태", true)], alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE }, shading: { fill: "F5F5F5" } }),
                new TableCell({ children: [new Paragraph({ children: [createText("계획일", true)], alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE }, shading: { fill: "F5F5F5" } }),
                new TableCell({ children: [new Paragraph({ children: [createText("완료일", true)], alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE }, shading: { fill: "F5F5F5" } }),
                new TableCell({ children: [new Paragraph({ children: [createText("가중치", true)], alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE }, shading: { fill: "F5F5F5" } }),
            ],
        });

        const rows = relevantItems.map(item => {
            // Add indentation visual
            const indentPrefix = item.depth > 0 ? "  ".repeat(item.depth) + "- " : "";

            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: indentPrefix + item.name })] }),
                    new TableCell({ children: [new Paragraph({ text: item.status, alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: item.planEndDate, alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: item.actualEndDate || "-", alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: String(item.weight || 1), alignment: AlignmentType.CENTER })] }),
                ],
            });
        });

        sections.push(new Table({
            rows: [headerRow, ...rows],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: TABLE_BORDERS,
        }));
    });

    return sections;
}

/**
 * Main Generator Function
 */
async function generateReport(title: string, projects: Project[], startDate: Date, endDate: Date, filename: string) {
    try {
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    createHeader(title),
                    new Paragraph({
                        text: `기간: ${format(startDate, 'yyyy-MM-dd')} ~ ${format(endDate, 'yyyy-MM-dd')}`,
                        alignment: AlignmentType.RIGHT,
                        spacing: { after: 300 },
                    }),

                    createHeader("1. 프로젝트별 공정률 현황", HeadingLevel.HEADING_2),
                    createProjectSummaryTable(projects),

                    createHeader("2. 프로젝트별 세부 업무 내역", HeadingLevel.HEADING_2),
                    ...createDetailedTaskTables(projects, startDate, endDate),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, filename);
    } catch (error) {
        console.error("Report Generation Error:", error);
        alert(`보고서 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
    }
}

function safeIsWithinInterval(dateStr: string | undefined, interval: { start: Date; end: Date }): boolean {
    if (!dateStr) return false;
    try {
        const date = parseISO(dateStr);
        // Check if date is valid
        if (isNaN(date.getTime())) return false;
        return isWithinInterval(date, interval);
    } catch (e) {
        return false;
    }
}

// --- Public Handlers ---

export function generateWeeklyReport(projects: Project[]) {
    try {
        const today = new Date();
        const startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const endDate = endOfWeek(today, { weekStartsOn: 1 });   // Sunday
        const weekNum = getWeekOfMonth(today);
        const title = `주간 업무 보고서 (${format(today, 'yyyy년 M월')} ${weekNum}주차)`;
        const filename = `주간업무보고_${format(today, 'yyyyMMdd')}.docx`;

        generateReport(title, projects, startDate, endDate, filename);
    } catch (e) {
        alert("보고서 생성 중 오류 발생: " + e);
    }
}

export function generateMonthlyReport(projects: Project[]) {
    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);
    const title = `월간 업무 보고서 (${format(today, 'yyyy년 M월')})`;
    const filename = `월간업무보고_${format(today, 'yyyyMM')}.docx`;

    generateReport(title, projects, startDate, endDate, filename);
}
