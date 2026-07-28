import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
export declare class GoogleAuthController {
    private config;
    constructor(config: ConfigService);
    auth(res: Response): void | Response<any, Record<string, any>>;
    callback(code: string, error: string, res: Response): Promise<Response<any, Record<string, any>>>;
}
