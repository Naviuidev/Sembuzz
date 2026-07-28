export declare enum SupportRequestType {
    RAISE_ISSUE = "raise_issue",
    INTEGRATE_FEATURE = "integrate_feature",
    UI_CHANGE = "ui_change",
    UPSCALE_PLATFORM = "upscale_platform",
    CUSTOM_MESSAGE = "custom_message",
    SCHEDULE_MEETING = "schedule_meeting"
}
export declare enum MeetingType {
    GOOGLE_MEET = "google_meet",
    ZOOM = "zoom"
}
export declare enum TimeZone {
    US = "US",
    INDIA = "India"
}
export declare class SupportRequestDto {
    type: string;
    description?: string;
    meetingType?: string;
    meetingDate?: string;
    timeZone?: string;
    timeSlot?: string;
    customMessage?: string;
}
