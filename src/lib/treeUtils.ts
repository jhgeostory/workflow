import type { ExecutionItem } from "../types";

export function buildItemTree(items: ExecutionItem[]): ExecutionItem[] {
    const itemMap = new Map<string, ExecutionItem>();
    const roots: ExecutionItem[] = [];

    // 1. Create a shallow copy of all items to avoid mutating store directly
    //    and initialize children array
    items.forEach(item => {
        itemMap.set(item.id, { ...item, children: [] });
    });

    // 2. Build tree
    items.forEach(item => {
        const node = itemMap.get(item.id)!;
        if (item.parentId && itemMap.has(item.parentId)) {
            const parent = itemMap.get(item.parentId)!;
            parent.children!.push(node);
        } else {
            roots.push(node);
        }
    });

    // 3. Sort by sortOrder
    const sortFn = (a: ExecutionItem, b: ExecutionItem) => (a.sortOrder || 0) - (b.sortOrder || 0);

    roots.sort(sortFn);
    itemMap.forEach(node => {
        if (node.children) node.children.sort(sortFn);
    });

    return roots;
}

/**
 * Flattens a tree back to a list (if needed, or for debugging)
 */
export function flattenItemTree(roots: ExecutionItem[]): ExecutionItem[] {
    const result: ExecutionItem[] = [];

    function traverse(nodes: ExecutionItem[]) {
        nodes.forEach(node => {
            result.push(node);
            if (node.children) traverse(node.children);
        });
    }

    traverse(roots);
    return result;
}
