import { PrismaService } from '../../../prisma/prisma.service';
import { FeaturesService } from '../features/features.service';
import { CreateSchoolDto } from '../dto/create-school.dto';
import { UpdateSchoolDto } from '../dto/update-school.dto';
import { EmailService } from './email.service';
export declare class SchoolsService {
    private prisma;
    private featuresService;
    private emailService;
    constructor(prisma: PrismaService, featuresService: FeaturesService, emailService: EmailService);
    /** Cast so generated delegate (adsAdmin) is accepted; run `npx prisma generate` so runtime client matches. */
    private get client();
    generateRefNum(): Promise<string>;
    generateTemporaryPassword(): Promise<string>;
    create(createSchoolDto: CreateSchoolDto): Promise<{
        school: {
            id: any;
            refNum: any;
            name: any;
            country: any;
            state: any;
            city: any;
            domain: any;
            image: any;
            tenure: any;
            isActive: any;
            createdAt: any;
        };
        admin: {
            id: any;
            name: any;
            email: any;
            password: string;
        };
        enabledFeatures: {
            code: any;
            name: any;
        }[];
        emailSent: boolean;
        emailError: string | null;
        adsEmailSent: boolean | undefined;
        adsEmailError: string | undefined;
        credentials: Record<string, unknown>;
        message: string;
    }>;
    private createInternal;
    findAll(): Promise<any>;
    findOne(id: string): Promise<{
        id: string;
        refNum: string;
        name: string;
        country: string | null;
        state: string | null;
        city: string;
        tenure: number | null;
        isActive: boolean;
        enabledFeatures: {
            code: string;
            name: string;
        }[];
        admin: {
            id: string;
            name: string;
            email: string;
            isActive: boolean;
            createdAt: Date;
        } | null;
        adsAdmin: {
            id: string;
            name: string;
            email: string;
            isActive: boolean;
        } | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateSchoolDto: UpdateSchoolDto): Promise<{
        id: string;
        refNum: string;
        name: string;
        country: string | null;
        state: string | null;
        city: string;
        tenure: number | null;
        isActive: boolean;
        enabledFeatures: {
            code: string;
            name: string;
        }[];
        admin: {
            id: string;
            name: string;
            email: string;
            isActive: boolean;
            createdAt: Date;
        } | null;
        adsAdmin: {
            id: string;
            name: string;
            email: string;
            isActive: boolean;
        } | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    sendEmailToSchool(schoolId: string, emailType: string): Promise<{
        message: string;
    }>;
}
