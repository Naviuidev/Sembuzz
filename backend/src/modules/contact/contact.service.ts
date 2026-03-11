import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EmailService } from '../super-admin/schools/email.service';

export interface ContactFormPayload {
  firstName: string;
  lastName: string;
  email: string;
  intent: string;
  message: string;
  query?: string;
}

@Injectable()
export class ContactService {
  constructor(private readonly emailService: EmailService) {}

  async submit(data: ContactFormPayload): Promise<void> {
    const { firstName, lastName, email, intent, message, query } = data;
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !message?.trim()) {
      throw new HttpException(
        { message: 'First name, last name, email, and message are required.' },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (intent === 'raise_query' && query !== undefined && !query?.trim()) {
      throw new HttpException(
        { message: 'Please enter your query when "Raise query" is selected.' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new HttpException({ message: 'Please provide a valid email address.' }, HttpStatus.BAD_REQUEST);
    }
    await this.emailService.sendContactFormSubmission({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      intent: intent || '',
      message: message.trim(),
      query: query?.trim(),
    });
  }
}
