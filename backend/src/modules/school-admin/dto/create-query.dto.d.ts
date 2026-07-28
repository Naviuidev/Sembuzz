export declare class CreateQueryDto {
    type: string;
    meetingType?: string;
    date?: string;
    timeSlot?: string;
    timeZone?: string;
    description?: string;
    /** Custom message text (for type custom_message). Stored in description. */
    customMessage?: string;
    /** Optional document attachment URL */
    attachmentUrl?: string;
}
