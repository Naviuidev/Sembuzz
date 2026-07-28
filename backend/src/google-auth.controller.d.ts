import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
export declare class GoogleAuthController {
    private readonly config;
    constructor(config: ConfigService);
    auth(res: Response): void | Response<any, Record<string, any>>;
    callback(code: string, error: string, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * User "Add to Google Calendar" flow: redirect to Google sign-in so the event is added to the account they choose.
     * Query: returnUrl, title, description (optional), start (ISO), end (ISO).
     */
    calendarAddAuth(returnUrl: string, title: string, start: string, end: string, description: string | undefined, req: Request, res: Response): void | Response<any, Record<string, any>>;
    /**
     * OAuth callback for "Add to Google Calendar": exchange code, insert event into user's calendar, redirect back to app.
     */
    calendarAddCallback(code: string, stateStr: string, error: string, req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
}
