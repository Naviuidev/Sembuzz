import { UserEventsService } from './user-events.service';
export declare class EventCommentController {
    private readonly userEventsService;
    constructor(userEventsService: UserEventsService);
    deleteComment(req: {
        user: {
            sub: string;
        };
    }, commentId: string): Promise<{
        commentCount: number;
    }>;
}
