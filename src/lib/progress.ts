import type { ExecutionItem } from "../types";

export function calculateProgress(items: ExecutionItem[]): number {
    if (!items || items.length === 0) return 0;

    let totalWeightedProgress = 0;
    let totalWeight = 0;

    items.forEach(item => {
        const itemProgress = getItemProgress(item);
        const weight = item.weight || 0; // If undefined, 0 (or 1?) - Stick to data.

        totalWeightedProgress += itemProgress * weight;
        totalWeight += weight;
    });

    if (totalWeight === 0) return 0;

    return Math.round((totalWeightedProgress / totalWeight) * 100);
}

function getItemProgress(item: ExecutionItem): number {
    // If has children, calculate weighted average of children
    if (item.children && item.children.length > 0) {
        let childTotalWeightedProgress = 0;
        let childTotalWeight = 0;

        item.children.forEach(child => {
            const childProgress = getItemProgress(child); // Recursive
            const weight = child.weight || 0;
            childTotalWeightedProgress += childProgress * weight;
            childTotalWeight += weight;
        });

        if (childTotalWeight === 0) return 0;
        return childTotalWeightedProgress / childTotalWeight;
    }

    // Leaf item validation
    const planned = item.plannedQuantity || 0;
    const actual = item.actualQuantity || 0;

    if (planned === 0) return actual > 0 ? 1 : 0;

    let ratio = actual / planned;
    if (ratio > 1) ratio = 1;
    return ratio;
}
