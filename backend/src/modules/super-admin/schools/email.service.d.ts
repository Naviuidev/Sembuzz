export declare class EmailService {
    private transporter;
    constructor();
    sendOnboardingEmail(adminEmail: string, schoolName: string, refNum: string, tempPassword: string, schoolDetails: {
        country?: string;
        state?: string;
        city: string;
        tenure?: number;
        features: string[];
    }): Promise<void>;
    sendCategoryAdminOnboardingEmail(adminEmail: string, adminName: string, schoolName: string, categoryName: string, tempPassword: string): Promise<void>;
    sendSubCategoryAdminOnboardingEmail(adminEmail: string, adminName: string, schoolName: string, categoryName: string, subCategoryName: string, tempPassword: string): Promise<void>;
    sendUserOtp(toEmail: string, otp: string, schoolName: string): Promise<void>;
    sendDocumentRequestToUser(toEmail: string, userName: string, schoolName: string): Promise<void>;
    sendReuploadRequestToUser(toEmail: string, userName: string, schoolName: string, message: string, type: 'reupload' | 'additional', updateDocLink: string): Promise<void>;
    /** Send "you're approved" email with verify link. User must click link to be allowed to login. */
    sendApprovalEmailWithVerifyLink(toEmail: string, userName: string, schoolName: string, verifyLink: string): Promise<void>;
    /** Send "registration rejected" email to user when school admin rejects their pending signup. */
    sendRejectionEmailToUser(toEmail: string, userName: string, schoolName: string): Promise<void>;
    sendPendingUserToSchoolAdmin(adminEmail: string, userDetails: {
        firstName: string;
        lastName: string;
        email: string;
    }, schoolName: string, userId: string): Promise<void>;
    sendOtpEmail(adminEmail: string, schoolName: string, refNum: string, otp: string): Promise<void>;
    sendCategoryAdminPasswordResetOtp(adminEmail: string, adminName: string, otp: string): Promise<void>;
    sendUserPasswordResetOtp(toEmail: string, userName: string, otp: string, schoolName: string): Promise<void>;
    sendAdsAdminOnboardingEmail(adminEmail: string, adminName: string, schoolName: string, tempPassword: string): Promise<void>;
    sendAdsAdminPasswordResetOtp(adminEmail: string, adminName: string, otp: string): Promise<void>;
    sendSubCategoryAdminPasswordResetOtp(adminEmail: string, adminName: string, otp: string): Promise<void>;
    sendFeatureUpdateEmail(adminEmail: string, schoolName: string, refNum: string, addedFeatures: string[], removedFeatures: string[]): Promise<void>;
    sendCompleteSchoolInfo(adminEmail: string, schoolName: string, refNum: string, schoolDetails: {
        country?: string;
        state?: string;
        city: string;
        tenure?: number;
        features: string[];
        adminName: string;
        adminEmail: string;
    }): Promise<void>;
    sendFeaturesSelected(adminEmail: string, schoolName: string, refNum: string, features: string[]): Promise<void>;
    sendTenureEndsSoon(adminEmail: string, schoolName: string, refNum: string, tenure: number, remainingMonths: number): Promise<void>;
    sendRefNum(adminEmail: string, schoolName: string, refNum: string): Promise<void>;
    sendDeveloperSupportRequest(requestData: {
        type: string;
        description?: string;
        meetingType?: string;
        timeZone?: string;
        timeSlot?: string;
        customMessage?: string;
        meetingLink?: string;
        meetingError?: string;
    }, superAdminEmail?: string): Promise<void>;
    /**
     * Send school admin query to super admin (developer). Used when school admin raises a request.
     */
    sendSchoolAdminQueryToSuperAdmin(schoolAdminName: string, schoolAdminEmail: string, schoolName: string, requestData: {
        type: string;
        description?: string;
        customMessage?: string;
        meetingType?: string;
        timeZone?: string;
        timeSlot?: string;
        attachmentUrl?: string;
        meetingLink?: string;
    }): Promise<void>;
    /** Subcategory admin raised query → notify category admin(s) */
    sendSubCategoryAdminQueryToCategoryAdmin(toEmail: string, subCategoryAdminName: string, subCategoryAdminEmail: string, categoryName: string, subCategoryName: string, requestData: {
        type: string;
        description?: string;
        meetingType?: string;
        timeZone?: string;
        timeSlot?: string;
        attachmentUrl?: string;
        meetingLink?: string;
    }): Promise<void>;
    /** Category admin replied → email subcategory admin */
    sendReplyToSubCategoryAdmin(subCategoryAdminEmail: string, subCategoryAdminName: string, categoryName: string, queryType: string, replyMessage: string): Promise<void>;
    /** Category admin raised query → notify school admin(s) */
    sendCategoryAdminQueryToSchoolAdmin(toEmail: string, categoryAdminName: string, categoryAdminEmail: string, schoolName: string, categoryName: string, requestData: {
        type: string;
        description?: string;
        meetingType?: string;
        timeZone?: string;
        timeSlot?: string;
        attachmentUrl?: string;
        meetingLink?: string;
    }): Promise<void>;
    /** School admin replied → email category admin */
    sendReplyToCategoryAdmin(categoryAdminEmail: string, categoryAdminName: string, schoolName: string, queryType: string, replyMessage: string): Promise<void>;
    sendQueryReply(adminEmail: string, adminName: string, schoolName: string, queryType: string, replyMessage: string): Promise<void>;
    /** Category admin send follow-up on their query raised to super admin */
    sendCategoryAdminFollowUpToSuperAdmin(superAdminEmails: string[], categoryAdminName: string, categoryAdminEmail: string, queryType: string, followUpMessage: string): Promise<void>;
    sendDeveloperQueryReply(developerEmail: string, superAdminName: string, queryType: string, replyMessage: string): Promise<void>;
    sendCategoryAdminCategoriesUpdatedEmail(adminEmail: string, adminName: string, schoolName: string, addedCategories: string[], removedCategories: string[]): Promise<void>;
    /**
     * Send contact form submission to support (and optional auto-reply to user).
     * Uses same Hostinger SMTP as other emails.
     */
    sendContactFormSubmission(data: {
        firstName: string;
        lastName: string;
        email: string;
        intent: string;
        message: string;
        query?: string;
    }): Promise<void>;
    private escapeHtml;
    sendContactFormAutoReply(toEmail: string, firstName: string): Promise<void>;
    sendSubCategoryAdminSubCategoriesUpdatedEmail(adminEmail: string, adminName: string, schoolName: string, categoryName: string, addedSubCategories: string[], removedSubCategories: string[]): Promise<void>;
    sendClubGroupJoinApprovedEmail(toEmail: string, userName: string, schoolName: string, groupName: string, appsUrl: string): Promise<void>;
}
