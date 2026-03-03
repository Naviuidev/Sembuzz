import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @IsNotEmpty()
  refNum: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  refNum: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  refNum: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Confirm password must be at least 8 characters long' })
  confirmPassword: string;
}
