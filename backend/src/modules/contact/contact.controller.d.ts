import { ContactService } from './contact.service.js';
export declare class ContactFormDto {
    firstName: string;
    lastName: string;
    email: string;
    intent: string;
    message: string;
    query?: string;
}
export declare class ContactController {
    private readonly contactService;
    constructor(contactService: ContactService);
    submit(body: ContactFormDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
