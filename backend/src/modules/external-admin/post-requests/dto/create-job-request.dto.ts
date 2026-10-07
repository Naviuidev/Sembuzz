import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract'] as const;
const WORK_MODES = ['On-site', 'Hybrid', 'Remote'] as const;
const APPLICATION_METHODS = ['external_url', 'email'] as const;
const JOB_PUBLISH_STATUSES = ['draft', 'published', 'closed'] as const;

export class CreateExternalJobRequestDto {
  @IsUUID()
  externalCategoryId!: string;

  @IsUUID()
  schoolId!: string;

  @IsOptional()
  @IsUUID()
  subCategoryId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  jobTitle!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  companyName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  companyLogoUrl?: string;

  @IsString()
  @IsIn([...JOB_TYPES])
  jobType!: string;

  @IsString()
  @IsIn([...WORK_MODES])
  workMode!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  location!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  jobDescription!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  eligibilityRequirements!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  skillsRequired!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  experienceRequired!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  salaryStipend!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  applicationDeadline!: string;

  @IsString()
  @IsIn([...APPLICATION_METHODS])
  applicationMethod!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  applicationTarget!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactPerson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  postedByOrganization!: string;

  @IsString()
  @IsIn([...JOB_PUBLISH_STATUSES])
  jobPublishStatus!: string;

  @IsBoolean()
  applyButtonEnabled!: boolean;

  @IsBoolean()
  saveJobButtonEnabled!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  applyButtonUrl?: string;
}
