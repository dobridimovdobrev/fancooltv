export interface ApiResponse<T> {
    data: T;
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        path: string;
        per_page: number;
        to: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
}

export interface PaginationParams {
    page: number;
    q?: string;           // per la ricerca
    category?: string;    // per il filtro categoria
    year?: string;        // per il filtro anno
}
