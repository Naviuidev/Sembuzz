import { EmailService } from '../super-admin/schools/email.service';
export interface ContactFormPayload {
    firstName: string;
    lastName: string;
    email: string;
    intent: string;
    message: string;
    query?: string;
}
export declare class ContactService {
    private readonly emailService;
    constructor(emailService: EmailService);
    submit(data: ContactFormPayload): Promise<void>;
}
