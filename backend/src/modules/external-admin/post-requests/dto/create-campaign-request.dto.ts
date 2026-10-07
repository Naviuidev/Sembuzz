import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

const CAMPAIGN_TYPES = [
  'Campus recruitment campaign',
  'Brand awareness campaign',
  'Student ambassador campaign',
  'Hackathon campaign',
  'Competition',
  'Workshop',
  'Webinar',
  'Product promotion',
] as const;

const PUBLISH_STATUSES = ['draft', 'published', 'expired'] as const;

export class CreateExternalCampaignRequestDto {
  @IsUUID()
  externalCategoryId!: string;

  @IsUUID()
  schoolId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  campaignTitle!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  organizationName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  companyLogoUrl?: string;

  @IsString()
  @IsIn([...CAMPAIGN_TYPES])
  campaignType!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  description!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  bannerImageUrl!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  startDate!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  endDate!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  targetAudience!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  eligibility!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  locationOrOnline!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  registrationUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  registrationDeadline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  termsAndConditions?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  postedByOrganization!: string;

  @IsString()
  @IsIn([...PUBLISH_STATUSES])
  publishStatus!: string;
}
