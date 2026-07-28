"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolsService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
let SchoolsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SchoolsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SchoolsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        featuresService;
        emailService;
        constructor(prisma, featuresService, emailService) {
            this.prisma = prisma;
            this.featuresService = featuresService;
            this.emailService = emailService;
        }
        /** Cast so generated delegate (adsAdmin) is accepted; run `npx prisma generate` so runtime client matches. */
        get client() {
            return this.prisma;
        }
        async generateRefNum() {
            // Generate unique reference number: SB-YYYYMMDD-XXXXXX
            const prefix = 'SB';
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const random = crypto.randomBytes(3).toString('hex').toUpperCase();
            const refNum = `${prefix}-${date}-${random}`;
            // Check if it exists (very unlikely but check anyway)
            const exists = await this.prisma.school.findUnique({
                where: { refNum },
            });
            if (exists) {
                // Recursively try again if collision
                return this.generateRefNum();
            }
            return refNum;
        }
        async generateTemporaryPassword() {
            // Generate a random password
            return crypto.randomBytes(8).toString('hex');
        }
        async create(createSchoolDto) {
            try {
                return await this.createInternal(createSchoolDto);
            }
            catch (err) {
                if (err instanceof common_1.BadRequestException || err instanceof common_1.NotFoundException || err instanceof common_1.HttpException) {
                    throw err;
                }
                const message = err instanceof Error ? err.message : String(err);
                console.error('[SchoolsService] create error:', message, err);
                throw new common_1.HttpException({ statusCode: 500, message: 'Failed to create school. Check server logs for details.', error: message }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async createInternal(createSchoolDto) {
            const { schoolName, country, state, city, domain, image, selectedFeatures, adminEmail, adsAdminEmail, tenure } = createSchoolDto;
            const hasAdsFeature = selectedFeatures.includes('ADS');
            // When Ads feature is selected, Ads Admin email is required
            if (hasAdsFeature && (!adsAdminEmail || !adsAdminEmail.trim())) {
                throw new common_1.BadRequestException('Ads Admin email is required when the Ads feature is selected.');
            }
            // Validate state is provided for US
            if (country === 'US' && !state) {
                throw new common_1.BadRequestException('State is required for US schools');
            }
            // Validate that admin email domain matches the domain field (normalize: strip leading @ from domain)
            const emailDomain = adminEmail.split('@')[1]?.toLowerCase().trim();
            const normalizedDomain = (domain || '').replace(/^@?\.?/, '').toLowerCase().trim();
            if (!emailDomain || emailDomain !== normalizedDomain) {
                throw new common_1.BadRequestException(`Admin email domain (${emailDomain || 'invalid'}) must match the school domain (${domain})`);
            }
            // Check if admin email already exists
            const existingAdmin = await this.client.schoolAdmin.findUnique({
                where: { email: adminEmail },
            });
            if (existingAdmin) {
                throw new common_1.BadRequestException('Admin email already exists');
            }
            // If Ads feature: check Ads Admin email is not already used
            if (hasAdsFeature && adsAdminEmail) {
                const existingAdsAdmin = await this.client.adsAdmin.findUnique({
                    where: { email: adsAdminEmail.trim() },
                });
                if (existingAdsAdmin) {
                    throw new common_1.BadRequestException('Ads Admin email is already in use.');
                }
                const existingSchoolAdminWithAdsEmail = await this.client.schoolAdmin.findUnique({
                    where: { email: adsAdminEmail.trim() },
                });
                if (existingSchoolAdminWithAdsEmail) {
                    throw new common_1.BadRequestException('Ads Admin email cannot be the same as an existing School Admin.');
                }
            }
            // Validate features
            const features = await Promise.all(selectedFeatures.map(async (featureCode) => {
                const feature = await this.featuresService.findByCode(featureCode);
                if (!feature) {
                    throw new common_1.BadRequestException(`Feature with code ${featureCode} not found`);
                }
                return feature;
            }));
            // Generate ref number
            const refNum = await this.generateRefNum();
            // Generate temporary password for school admin
            const tempPassword = await this.generateTemporaryPassword();
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            // If Ads feature: generate temp password for Ads Admin
            let adsTempPassword = null;
            let hashedAdsPassword = null;
            if (hasAdsFeature && adsAdminEmail) {
                adsTempPassword = await this.generateTemporaryPassword();
                hashedAdsPassword = await bcrypt.hash(adsTempPassword, 10);
            }
            // Extract admin name from email (or use email as name)
            const adminName = adminEmail.split('@')[0] || 'School Admin';
            const adsAdminName = (hasAdsFeature && adsAdminEmail) ? adsAdminEmail.split('@')[0] || 'Ads Admin' : null;
            // Create school and admin in transaction
            let result;
            try {
                result = await this.prisma.$transaction(async (tx) => {
                    // Build school data object - conditionally include domain/image
                    const schoolData = {
                        refNum,
                        name: schoolName,
                        country,
                        state: country === 'US' ? state : null,
                        city,
                        tenure,
                        isActive: true,
                    };
                    if (domain) {
                        schoolData.domain = domain;
                    }
                    if (image) {
                        schoolData.image = image;
                    }
                    // Create school
                    const school = await tx.school.create({
                        data: schoolData,
                    });
                    // Create school admin
                    const admin = await tx.schoolAdmin.create({
                        data: {
                            name: adminName,
                            email: adminEmail,
                            password: hashedPassword,
                            schoolId: school.id,
                            isActive: true,
                        },
                    });
                    // Create school-feature mappings
                    await Promise.all(features.map((feature) => tx.schoolFeature.create({
                        data: {
                            schoolId: school.id,
                            featureId: feature.id,
                            isEnabled: true,
                        },
                    })));
                    // If Ads feature: create Ads Admin for this school
                    let adsAdmin = undefined;
                    if (hasAdsFeature && adsAdminEmail && hashedAdsPassword) {
                        adsAdmin = await tx.adsAdmin.create({
                            data: {
                                name: adsAdminName,
                                email: adsAdminEmail.trim(),
                                password: hashedAdsPassword,
                                schoolId: school.id,
                                isActive: true,
                            },
                        });
                    }
                    return {
                        school,
                        admin,
                        tempPassword,
                        features,
                        ...(adsAdmin ? { adsAdmin, adsTempPassword: adsTempPassword } : {}),
                    };
                }, { timeout: 60000, maxWait: 10000 });
            }
            catch (error) {
                const errorMessage = error?.message || '';
                const errorCode = error?.code || '';
                // Missing columns on schools table (run add_school_domain_and_image.sql and add-school-fields.sql)
                if (errorMessage.includes("Unknown column") ||
                    errorMessage.includes('column "domain"') ||
                    errorMessage.includes('column "image"') ||
                    errorCode === '42703') {
                    console.error('[SchoolsService] Database schema mismatch:', errorMessage);
                    throw new common_1.BadRequestException('Database schema is missing columns. On the server run: ' +
                        'ALTER TABLE schools ADD COLUMN country VARCHAR(255) NULL, ADD COLUMN state VARCHAR(50) NULL, ADD COLUMN tenure INT NULL; ' +
                        'ALTER TABLE schools ADD COLUMN domain VARCHAR(255) NULL, ADD COLUMN image TEXT NULL; ' +
                        'Or run prisma/migrations/add_school_domain_and_image.sql and add-school-fields.sql in phpMyAdmin.');
                }
                // Table ads_admins missing (run migrations)
                if (errorMessage.includes('ads_admins') || errorMessage.includes('adsAdmin')) {
                    console.error('[SchoolsService] ads_admins table missing or error:', errorMessage);
                    throw new common_1.BadRequestException('Ads admin table is missing. Run: npx prisma migrate deploy');
                }
                // Unique constraint on ads admin email (e.g. same email in ads_admins)
                if (errorCode === 'P2002' && (errorMessage.includes('ads_admins') || errorMessage.includes('adsAdmin') || errorMessage.includes('email'))) {
                    throw new common_1.BadRequestException('Ads Admin email is already in use by another Ads Admin.');
                }
                // Transaction timeout
                if (errorMessage.includes('Transaction') && errorMessage.includes('closed')) {
                    console.error('[SchoolsService] Transaction timeout or closed:', errorMessage);
                    throw new common_1.HttpException({ statusCode: 500, message: 'Create took too long. Please try again.', error: errorMessage }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                }
                console.error('[SchoolsService] Transaction error:', errorMessage, error?.stack);
                throw error;
            }
            // Send onboarding email with credentials (non-blocking - don't fail school creation if email fails)
            let emailSent = false;
            let emailError = null;
            try {
                await this.emailService.sendOnboardingEmail(adminEmail, schoolName, refNum, result.tempPassword, {
                    country,
                    state: country === 'US' ? state : undefined,
                    city,
                    tenure,
                    features: features.map((f) => f.name),
                });
                emailSent = true;
            }
            catch (error) {
                console.error('[SchoolsService] Email sending failed, but school was created successfully:', error);
                emailError = error.message || 'Unknown error';
            }
            // If Ads Admin was created: send Ads Admin onboarding email
            let adsEmailSent = false;
            let adsEmailError = null;
            if (result.adsAdmin && result.adsTempPassword && adsAdminEmail) {
                try {
                    await this.emailService.sendAdsAdminOnboardingEmail(adsAdminEmail.trim(), adsAdminName, schoolName, result.adsTempPassword);
                    adsEmailSent = true;
                }
                catch (error) {
                    console.error('[SchoolsService] Ads Admin email sending failed:', error);
                    adsEmailError = error.message || 'Unknown error';
                }
            }
            const credentials = {
                refNum,
                tempPassword: result.tempPassword,
                adminEmail,
                schoolAdminEmailSent: emailSent,
                ...(emailError ? { schoolAdminEmailError: emailError } : {}),
            };
            if (result.adsAdmin && result.adsTempPassword && adsAdminEmail) {
                credentials.adsAdminEmail = adsAdminEmail.trim();
                credentials.adsTempPassword = result.adsTempPassword;
                credentials.adsAdminEmailSent = adsEmailSent;
                credentials.adsEmailSent = adsEmailSent; // frontend compatibility
                if (adsEmailError)
                    credentials.adsAdminEmailError = adsEmailError;
                if (adsEmailError)
                    credentials.adsEmailError = adsEmailError; // frontend compatibility
            }
            const hasAds = !!(result.adsAdmin && adsAdminEmail);
            let message;
            if (emailSent && (!hasAds || adsEmailSent)) {
                message = hasAds
                    ? 'School created successfully. Onboarding emails sent to School Admin and Ads Admin.'
                    : 'School created successfully. Onboarding email sent to School Admin.';
            }
            else if (emailSent && !adsEmailSent) {
                message = `School created successfully. School Admin email sent. Ads Admin email could not be sent${adsEmailError ? `: ${adsEmailError}` : '.'}`;
            }
            else if (!emailSent && hasAds && adsEmailSent) {
                message = `School created successfully. Ads Admin email sent. School Admin email could not be sent${emailError ? `: ${emailError}` : '.'}`;
            }
            else {
                message = 'School created successfully, but onboarding email(s) could not be sent. Please check SMTP settings and credentials below.';
                if (emailError)
                    message += ` School Admin: ${emailError}.`;
                if (adsEmailError)
                    message += ` Ads Admin: ${adsEmailError}.`;
            }
            return {
                school: {
                    id: result.school.id,
                    refNum: result.school.refNum,
                    name: result.school.name,
                    country: result.school.country,
                    state: result.school.state,
                    city: result.school.city,
                    domain: result.school.domain || null,
                    image: result.school.image || null,
                    tenure: result.school.tenure,
                    isActive: result.school.isActive,
                    createdAt: result.school.createdAt,
                },
                admin: {
                    id: result.admin.id,
                    name: result.admin.name,
                    email: result.admin.email,
                    password: result.tempPassword,
                },
                enabledFeatures: result.features.map((f) => ({
                    code: f.code,
                    name: f.name,
                })),
                emailSent,
                emailError,
                adsEmailSent: hasAds ? adsEmailSent : undefined,
                adsEmailError: hasAds && adsEmailError ? adsEmailError : undefined,
                credentials,
                message,
            };
        }
        async findAll() {
            try {
                const schools = await this.client.school.findMany({
                    include: {
                        admins: {
                            where: { isActive: true },
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                isActive: true,
                                createdAt: true,
                            },
                        },
                        features: {
                            where: { isEnabled: true },
                            include: {
                                feature: {
                                    select: {
                                        id: true,
                                        code: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                });
                return schools.map((school) => ({
                    id: school.id,
                    refNum: school.refNum,
                    name: school.name,
                    country: school.country,
                    state: school.state,
                    city: school.city,
                    tenure: school.tenure,
                    isActive: school.isActive,
                    enabledFeatures: school.features.map((sf) => ({
                        code: sf.feature.code,
                        name: sf.feature.name,
                    })),
                    admin: school.admins[0] || null,
                    createdAt: school.createdAt,
                }));
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error('[SuperAdmin Schools] findAll error:', message, err);
                throw new common_1.HttpException({ statusCode: 500, message: 'Failed to load schools list' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async findOne(id) {
            try {
                const school = await this.prisma.school.findUnique({
                    where: { id },
                    select: {
                        id: true,
                        refNum: true,
                        name: true,
                        country: true,
                        state: true,
                        city: true,
                        tenure: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });
                if (!school) {
                    throw new common_1.NotFoundException(`School with ID ${id} not found`);
                }
                let admin = null;
                try {
                    const admins = await this.prisma.schoolAdmin.findMany({
                        where: { schoolId: id },
                        take: 1,
                        select: { id: true, name: true, email: true, isActive: true, createdAt: true },
                        orderBy: { createdAt: 'asc' },
                    });
                    admin = admins[0] || null;
                }
                catch (e) {
                    console.warn('[SuperAdmin Schools] findOne: could not load admins for school', id, e);
                }
                let enabledFeatures = [];
                try {
                    const schoolFeatures = await this.prisma.schoolFeature.findMany({
                        where: { schoolId: id, isEnabled: true },
                        select: { featureId: true },
                    });
                    for (const sf of schoolFeatures) {
                        const feature = await this.prisma.feature.findUnique({
                            where: { id: sf.featureId },
                            select: { code: true, name: true },
                        });
                        if (feature)
                            enabledFeatures.push({ code: feature.code, name: feature.name });
                    }
                }
                catch (featErr) {
                    console.warn('[SuperAdmin Schools] findOne: could not load features for school', id, featErr);
                }
                const hasAds = enabledFeatures.some((f) => f.code === 'ADS');
                let adsAdmin = null;
                if (hasAds) {
                    try {
                        const ads = await this.prisma.adsAdmin.findMany({
                            where: { schoolId: id },
                            take: 1,
                            select: { id: true, name: true, email: true, isActive: true },
                            orderBy: { createdAt: 'asc' },
                        });
                        adsAdmin = ads[0] || null;
                    }
                    catch (e) {
                        console.warn('[SuperAdmin Schools] findOne: could not load adsAdmin for school', id, e);
                    }
                }
                return {
                    id: school.id,
                    refNum: school.refNum,
                    name: school.name,
                    country: school.country,
                    state: school.state,
                    city: school.city,
                    tenure: school.tenure,
                    isActive: school.isActive,
                    enabledFeatures,
                    admin,
                    adsAdmin,
                    createdAt: school.createdAt,
                    updatedAt: school.updatedAt,
                };
            }
            catch (err) {
                if (err instanceof common_1.NotFoundException)
                    throw err;
                const message = err instanceof Error ? err.message : String(err);
                console.error('[SuperAdmin Schools] findOne error:', message, err);
                throw new common_1.HttpException({ statusCode: 500, message: 'Failed to load school', error: message }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async update(id, updateSchoolDto) {
            const school = await this.prisma.school.findUnique({
                where: { id },
            });
            if (!school) {
                throw new common_1.NotFoundException(`School with ID ${id} not found`);
            }
            const { schoolName, country, state, city, tenure, selectedFeatures, adminEmail, isActive, resetAdminPassword } = updateSchoolDto;
            await this.prisma.$transaction(async (tx) => {
                // Update school basic information
                const schoolUpdateData = {};
                if (schoolName !== undefined)
                    schoolUpdateData.name = schoolName;
                if (country !== undefined)
                    schoolUpdateData.country = country;
                if (state !== undefined)
                    schoolUpdateData.state = state;
                if (city !== undefined)
                    schoolUpdateData.city = city;
                if (tenure !== undefined)
                    schoolUpdateData.tenure = tenure;
                if (isActive !== undefined)
                    schoolUpdateData.isActive = isActive;
                if (Object.keys(schoolUpdateData).length > 0) {
                    await tx.school.update({
                        where: { id },
                        data: schoolUpdateData,
                    });
                }
                // Update features if provided
                if (selectedFeatures) {
                    // Get all features
                    const allFeatures = await tx.feature.findMany();
                    const featureMap = new Map(allFeatures.map((f) => [f.code, f]));
                    const currentSchoolFeatures = (await tx.schoolFeature.findMany({
                        where: { schoolId: id },
                        include: { feature: true },
                    }));
                    // Get currently enabled feature codes for comparison
                    const currentEnabledCodes = currentSchoolFeatures
                        .filter((sf) => sf.isEnabled)
                        .map((sf) => sf.feature.code);
                    // Track changes for email
                    const addedFeatureNames = [];
                    const removedFeatureNames = [];
                    // Process each requested feature - enable it
                    for (const featureCode of selectedFeatures) {
                        const feature = featureMap.get(featureCode);
                        if (!feature)
                            continue;
                        const existingFeature = currentSchoolFeatures.find((sf) => sf.feature.code === featureCode);
                        // Enable the feature (create if doesn't exist, update if disabled)
                        await tx.schoolFeature.upsert({
                            where: {
                                schoolId_featureId: {
                                    schoolId: id,
                                    featureId: feature.id,
                                },
                            },
                            update: { isEnabled: true },
                            create: {
                                schoolId: id,
                                featureId: feature.id,
                                isEnabled: true,
                            },
                        });
                        // Track if this was newly enabled (wasn't enabled before)
                        if (!currentEnabledCodes.includes(featureCode)) {
                            addedFeatureNames.push(feature.name);
                        }
                    }
                    // Disable features that are not in the requested list
                    for (const schoolFeature of currentSchoolFeatures) {
                        const featureCode = schoolFeature.feature.code;
                        // If feature is currently enabled but not in requested list, disable it
                        if (schoolFeature.isEnabled && !selectedFeatures.includes(featureCode)) {
                            await tx.schoolFeature.updateMany({
                                where: {
                                    schoolId: id,
                                    featureId: schoolFeature.featureId,
                                },
                                data: { isEnabled: false },
                            });
                            removedFeatureNames.push(schoolFeature.feature.name);
                        }
                    }
                    // Send email notification if features were changed
                    if (addedFeatureNames.length > 0 || removedFeatureNames.length > 0) {
                        const admin = await tx.schoolAdmin.findFirst({
                            where: { schoolId: id },
                        });
                        if (admin) {
                            // Send email asynchronously (don't wait for it)
                            this.emailService
                                .sendFeatureUpdateEmail(admin.email, school.name, school.refNum, addedFeatureNames, removedFeatureNames)
                                .catch((error) => {
                                console.error('[SchoolsService] Failed to send feature update email:', error);
                            });
                        }
                    }
                }
                // Update admin email if provided
                if (adminEmail) {
                    const admin = await tx.schoolAdmin.findFirst({
                        where: { schoolId: id },
                    });
                    if (admin) {
                        // Check if email is already taken by another admin
                        const emailExists = await tx.schoolAdmin.findFirst({
                            where: {
                                email: adminEmail,
                                id: { not: admin.id },
                            },
                        });
                        if (emailExists) {
                            throw new common_1.BadRequestException('Admin email already exists');
                        }
                        await tx.schoolAdmin.update({
                            where: { id: admin.id },
                            data: { email: adminEmail },
                        });
                    }
                }
                // Reset admin password if requested
                if (resetAdminPassword) {
                    const admin = await tx.schoolAdmin.findFirst({
                        where: { schoolId: id },
                    });
                    if (admin) {
                        const tempPassword = await this.generateTemporaryPassword();
                        const hashedPassword = await bcrypt.hash(tempPassword, 10);
                        await tx.schoolAdmin.update({
                            where: { id: admin.id },
                            data: { password: hashedPassword },
                        });
                        // TODO: Send password reset email
                        // await this.sendPasswordResetEmail(admin, tempPassword);
                    }
                }
            });
            // Return updated school data after transaction completes
            return this.findOne(id);
        }
        async remove(id) {
            const school = await this.prisma.school.findUnique({
                where: { id },
            });
            if (!school) {
                throw new common_1.NotFoundException(`School with ID ${id} not found`);
            }
            // Delete school and all related data in dependency order (works even if DB FKs lack CASCADE)
            try {
                await this.prisma.$transaction(async (tx) => {
                    const db = tx; // transactional client with full delegate access
                    // 1) Event-related child tables (must delete before events)
                    const eventIds = (await db.event.findMany({ where: { schoolId: id }, select: { id: true } })).map((e) => e.id);
                    if (eventIds.length > 0) {
                        await db.eventLike.deleteMany({ where: { eventId: { in: eventIds } } });
                        await db.eventComment.deleteMany({ where: { eventId: { in: eventIds } } });
                        await db.userSavedEvent.deleteMany({ where: { eventId: { in: eventIds } } });
                    }
                    // 2) BannerAd and SponsoredAd child tables (must delete before parent)
                    const bannerAdIds = (await db.bannerAd.findMany({ where: { schoolId: id }, select: { id: true } })).map((b) => b.id);
                    if (bannerAdIds.length > 0) {
                        await db.bannerAdEvent.deleteMany({ where: { bannerAdId: { in: bannerAdIds } } });
                    }
                    const sponsoredAdIds = (await db.sponsoredAd.findMany({ where: { schoolId: id }, select: { id: true } })).map((s) => s.id);
                    if (sponsoredAdIds.length > 0) {
                        await db.sponsoredAdEvent.deleteMany({ where: { sponsoredAdId: { in: sponsoredAdIds } } });
                    }
                    // 3) Direct school-scoped data
                    await db.userHelpQuery.deleteMany({ where: { schoolId: id } });
                    await db.schoolSocialAccount.deleteMany({ where: { schoolId: id } });
                    await db.upcomingPost.deleteMany({ where: { schoolId: id } });
                    await db.bannerAd.deleteMany({ where: { schoolId: id } });
                    await db.sponsoredAd.deleteMany({ where: { schoolId: id } });
                    await db.user.deleteMany({ where: { schoolId: id } });
                    await db.schoolFeature.deleteMany({ where: { schoolId: id } });
                    await db.categoryAdminQuery.deleteMany({ where: { schoolId: id } });
                    await db.schoolAdminToCategoryAdminQuery.deleteMany({ where: { schoolId: id } });
                    await db.schoolAdminToSubCategoryAdminQuery.deleteMany({ where: { schoolId: id } });
                    await db.subCategoryAdminToSchoolAdminQuery.deleteMany({ where: { schoolId: id } });
                    await db.event.deleteMany({ where: { schoolId: id } });
                    // 2) SubCategoryAdmins and their dependent rows (then CategoryAdmins)
                    const subCatAdminIds = (await db.subCategoryAdmin.findMany({ where: { schoolId: id }, select: { id: true } })).map((a) => a.id);
                    if (subCatAdminIds.length > 0) {
                        await db.subCategoryAdminSubCategory.deleteMany({ where: { subCategoryAdminId: { in: subCatAdminIds } } });
                        await db.subCategoryAdminPasswordResetOtp.deleteMany({ where: { subCategoryAdminId: { in: subCatAdminIds } } });
                        await db.subCategoryAdminToSuperAdminQuery.deleteMany({ where: { subCategoryAdminId: { in: subCatAdminIds } } });
                    }
                    await db.subCategoryAdmin.deleteMany({ where: { schoolId: id } });
                    const categoryAdminIds = (await db.categoryAdmin.findMany({ where: { schoolId: id }, select: { id: true } })).map((a) => a.id);
                    if (categoryAdminIds.length > 0) {
                        await db.categoryAdminCategory.deleteMany({ where: { categoryAdminId: { in: categoryAdminIds } } });
                        await db.categoryAdminPasswordResetOtp.deleteMany({ where: { categoryAdminId: { in: categoryAdminIds } } });
                        await db.categoryAdminToSubCategoryAdminQuery.deleteMany({ where: { categoryAdminId: { in: categoryAdminIds } } });
                        await db.categoryAdminToSuperAdminQuery.deleteMany({ where: { categoryAdminId: { in: categoryAdminIds } } });
                    }
                    await db.categoryAdmin.deleteMany({ where: { schoolId: id } });
                    // 3) Categories and subcategories (posts/news)
                    const categoryIds = (await db.category.findMany({ where: { schoolId: id }, select: { id: true } })).map((c) => c.id);
                    if (categoryIds.length > 0) {
                        await db.subCategory.deleteMany({ where: { categoryId: { in: categoryIds } } });
                    }
                    await db.category.deleteMany({ where: { schoolId: id } });
                    // 4) School admins and their dependent rows, then Ads admins
                    const schoolAdminIds = (await db.schoolAdmin.findMany({ where: { schoolId: id }, select: { id: true } })).map((a) => a.id);
                    if (schoolAdminIds.length > 0) {
                        await db.query.deleteMany({ where: { schoolAdminId: { in: schoolAdminIds } } });
                        await db.passwordResetOtp.deleteMany({ where: { schoolAdminId: { in: schoolAdminIds } } });
                    }
                    await db.schoolAdmin.deleteMany({ where: { schoolId: id } });
                    const adsAdminIds = (await db.adsAdmin.findMany({ where: { schoolId: id }, select: { id: true } })).map((a) => a.id);
                    if (adsAdminIds.length > 0) {
                        await db.adsAdminPasswordResetOtp.deleteMany({ where: { adsAdminId: { in: adsAdminIds } } });
                    }
                    await db.adsAdmin.deleteMany({ where: { schoolId: id } });
                    // 5) School
                    await db.school.delete({ where: { id } });
                }, { timeout: 60000, maxWait: 10000 });
            }
            catch (err) {
                const message = err?.message || String(err);
                const cause = err?.cause?.message ?? err?.meta?.cause ?? '';
                console.error('[SchoolsService] remove error:', message, cause || err);
                throw new common_1.HttpException(message.includes('Foreign key') || message.includes('foreign key') || message.includes('a foreign key')
                    ? 'Cannot delete school: related data could not be removed. You may need to remove linked records first.'
                    : `Failed to delete school: ${message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return { message: 'School deleted successfully' };
        }
        async sendEmailToSchool(schoolId, emailType) {
            const school = await this.client.school.findUnique({
                where: { id: schoolId },
                include: {
                    admins: {
                        where: { isActive: true },
                        take: 1,
                    },
                    features: {
                        where: { isEnabled: true },
                        include: {
                            feature: true,
                        },
                    },
                },
            });
            if (!school) {
                throw new common_1.NotFoundException(`School with ID ${schoolId} not found`);
            }
            const admin = school.admins[0];
            if (!admin) {
                throw new common_1.NotFoundException('No active admin found for this school');
            }
            const enabledFeatures = school.features.map((sf) => sf.feature.name);
            switch (emailType) {
                case 'complete_info':
                    await this.emailService.sendCompleteSchoolInfo(admin.email, school.name, school.refNum, {
                        country: school.country || undefined,
                        state: school.state || undefined,
                        city: school.city,
                        tenure: school.tenure || undefined,
                        features: enabledFeatures,
                        adminName: admin.name,
                        adminEmail: admin.email,
                    });
                    break;
                case 'features_selected':
                    await this.emailService.sendFeaturesSelected(admin.email, school.name, school.refNum, enabledFeatures);
                    break;
                case 'tenure_ends_soon':
                    if (!school.tenure) {
                        throw new common_1.BadRequestException('School does not have a tenure set');
                    }
                    // Calculate remaining months (simplified - you might want to track start date)
                    const remainingMonths = Math.max(0, school.tenure - 1);
                    await this.emailService.sendTenureEndsSoon(admin.email, school.name, school.refNum, school.tenure, remainingMonths);
                    break;
                case 'refnum':
                    await this.emailService.sendRefNum(admin.email, school.name, school.refNum);
                    break;
                default:
                    throw new common_1.BadRequestException(`Invalid email type: ${emailType}`);
            }
            return { message: 'Email sent successfully' };
        }
    };
    return SchoolsService = _classThis;
})();
exports.SchoolsService = SchoolsService;
//# sourceMappingURL=schools.service.js.map