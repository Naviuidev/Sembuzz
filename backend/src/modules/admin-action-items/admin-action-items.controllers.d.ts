import { AdminActionItemsService } from './admin-action-items.service';
export declare class SchoolAdminActionItemsController {
    private readonly service;
    constructor(service: AdminActionItemsService);
    list(req: {
        user: {
            schoolId: string;
        };
    }): Promise<import("./admin-action-items.types").AdminActionItemsResponse>;
}
export declare class CategoryAdminActionItemsController {
    private readonly service;
    constructor(service: AdminActionItemsService);
    list(req: {
        user: {
            sub: string;
            schoolId: string;
        };
    }): Promise<import("./admin-action-items.types").AdminActionItemsResponse>;
}
export declare class SubCategoryAdminActionItemsController {
    private readonly service;
    constructor(service: AdminActionItemsService);
    list(req: {
        user: {
            sub: string;
        };
    }): Promise<import("./admin-action-items.types").AdminActionItemsResponse>;
}
export declare class SuperAdminActionItemsController {
    private readonly service;
    constructor(service: AdminActionItemsService);
    list(): Promise<import("./admin-action-items.types").AdminActionItemsResponse>;
}
export declare class AdsAdminActionItemsController {
    private readonly service;
    constructor(service: AdminActionItemsService);
    list(): Promise<import("./admin-action-items.types").AdminActionItemsResponse>;
}
