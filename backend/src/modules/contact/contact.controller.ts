import { Body, Controller, Post, HttpException, HttpStatus } from '@nestjs/common';
import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import { ContactService } from './contact.service.js';

export class ContactFormDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  intent: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  query?: string;
}

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async submit(@Body() body: ContactFormDto) {
    try {
      await this.contactService.submit(body);
      return { success: true, message: 'Thank you for your message. We will get back to you soon.' };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        { message: err?.message || 'Failed to send your message. Please try again later.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
