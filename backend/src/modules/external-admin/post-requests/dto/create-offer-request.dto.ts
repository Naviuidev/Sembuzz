import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

const OFFER_CATEGORIES = [
  'Student discounts',
  'Product offers',
  'Course discounts',
  'Software subscriptions',
  'Food/restaurant offers',
  'Shopping offers',
  'Event offers',
  'Student-exclusive deals',
] as const;

const DISCOUNT_TYPES = ['percentage', 'flat', 'free'] as const;
const OFFER_AVAILABILITY = ['online', 'offline', 'both'] as const;
const OFFER_PUBLISH_STATUSES = ['draft', 'published', 'expired'] as const;

export class CreateExternalOfferRequestDto {
  @IsUUID()
  externalCategoryId!: string;

  @IsUUID()
  schoolId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  offerTitle!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  brandName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  brandLogoUrl?: string;

  @IsString()
  @IsIn([...OFFER_CATEGORIES])
  offerCategory!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  description!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  bannerImageUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  originalPrice?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  offerPriceDiscount!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  couponCode?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  validFrom!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  validUntil!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  eligibility!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  howToRedeem!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  redemptionUrl!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  termsAndConditions!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  postedByOrganization!: string;

  @IsString()
  @IsIn([...OFFER_PUBLISH_STATUSES])
  offerPublishStatus!: string;

  @IsOptional()
  @IsString()
  @IsIn([...DISCOUNT_TYPES])
  discountType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  discountValue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  maximumDiscount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  minimumPurchase?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  usageLimit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  redemptionsPerStudent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  applicableLocations?: string;

  @IsOptional()
  @IsString()
  @IsIn([...OFFER_AVAILABILITY])
  offerAvailability?: string;

  @IsOptional()
  @IsBoolean()
  studentIdRequired?: boolean;
}
