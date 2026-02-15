export const reorderList = <T>(list: T[], startIndex: number, endIndex: number): T[] => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

export const sortListByOrder = <T extends { id: string }>(list: T[], order: string[]): T[] => {
    if (!order || order.length === 0) return list;

    const orderMap = new Map(order.map((id, index) => [id, index]));

    return [...list].sort((a, b) => {
        const indexA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const indexB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return indexA - indexB;
    });
};
