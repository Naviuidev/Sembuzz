export interface AdminActionItem {
    id: string;
    kind: string;
    title: string;
    summary: string;
    href: string;
    count: number;
    createdAt?: string;
}
export interface AdminActionItemsResponse {
    totalCount: number;
    items: AdminActionItem[];
}
