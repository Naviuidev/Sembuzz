export declare class RegisterDto {
    registrationMethod: 'school_domain' | 'gmail';
    firstName: string;
    lastName: string;
    profilePicUrl?: string;
    schoolId: string;
    email: string;
    password: string;
    /** Required for gmail/public domain: URL of uploaded school doc (ID card, fee receipt, etc.) */
    verificationDocUrl?: string;
}
