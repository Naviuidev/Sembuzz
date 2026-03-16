import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    // Configure email transporter (Hostinger, Gmail, etc.)
    const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const secure = smtpPort === 465;

    console.log('[EmailService] Initializing SMTP transporter...');
    console.log('[EmailService] SMTP Host:', smtpHost);
    console.log('[EmailService] SMTP Port:', smtpPort, secure ? '(SSL)' : '(STARTTLS)');
    console.log('[EmailService] SMTP User:', smtpUser ? `${smtpUser.substring(0, 3)}***` : 'NOT SET');
    console.log('[EmailService] SMTP Pass:', smtpPass ? '***SET***' : 'NOT SET');

    if (!smtpUser || !smtpPass) {
      console.error('[EmailService] ⚠️  SMTP credentials not configured! Email sending will fail.');
      console.error('[EmailService] Please set SMTP_USER and SMTP_PASS in your .env file');
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure, // true for 465, false for 587 (STARTTLS)
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      ...(smtpPort === 587 && { requireTLS: true }),
      debug: true,
      logger: true,
    });
  }

  async sendOnboardingEmail(
    adminEmail: string,
    schoolName: string,
    refNum: string,
    tempPassword: string,
    schoolDetails: {
      country?: string;
      state?: string;
      city: string;
      tenure?: number;
      features: string[];
    },
  ) {
    const featuresList = schoolDetails.features.join(', ');

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: 'Welcome to SemBuzz - Your School Account Has Been Created',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a1f2e; }
            .button { display: inline-block; padding: 12px 30px; background-color: #1a1f2e; color: white; text-decoration: none; border-radius: 50px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SemBuzz!</h1>
            </div>
            <div class="content">
              <p>Dear School Administrator,</p>
              
              <p>Your school account has been successfully created on SemBuzz. Below are your login credentials and school details:</p>
              
              <div class="credentials">
                <h3 style="margin-top: 0; color: #1a1f2e;">Login Credentials</h3>
                <p><strong>User ID:</strong> ${refNum}</p>
                <p><strong>Email:</strong> ${adminEmail}</p>
                <p><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
              </div>
              
              <div class="credentials">
                <h3 style="margin-top: 0; color: #1a1f2e;">School Information</h3>
                <p><strong>School Name:</strong> ${schoolName}</p>
                ${schoolDetails.country ? `<p><strong>Country:</strong> ${schoolDetails.country}</p>` : ''}
                ${schoolDetails.state ? `<p><strong>State:</strong> ${schoolDetails.state}</p>` : ''}
                <p><strong>City:</strong> ${schoolDetails.city}</p>
                ${schoolDetails.tenure ? `<p><strong>Project Tenure:</strong> ${schoolDetails.tenure} months</p>` : ''}
                <p><strong>Enabled Features:</strong> ${featuresList}</p>
              </div>
              
              <h3 style="color: #1a1f2e;">Next Steps:</h3>
              <ol>
                <li>Log in using your <strong>Reference Number (${refNum})</strong> or <strong>Email (${adminEmail})</strong> as your User ID</li>
                <li>Use the temporary password provided above</li>
                <li>You will be prompted to change your password on first login</li>
                <li>Start managing your school's features and settings</li>
              </ol>
              
              <p style="margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/school-admin/login" class="button">Login to SemBuzz</a>
              </p>
              
              <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                <strong>Important:</strong> Please keep your credentials secure and change your password immediately after first login.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // When email can't be sent, log credentials so admin can still log in and set a custom password on first login
    const logCredentialsForManualUse = () => {
      console.warn('[EmailService] Email details (for manual sending / first login):', {
        to: adminEmail,
        refNum,
        tempPassword,
        schoolName,
      });
      console.warn('[EmailService] Admin can log in at /school-admin/login with Ref Number or Email + temp password, then set a custom password.');
    };

    // Require SMTP so caller gets a clear error (same as approval/rejection emails)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('[EmailService] ⚠️ SMTP not configured. School admin onboarding email not sent.');
      logCredentialsForManualUse();
      throw new Error('SMTP is not configured. Set SMTP_USER and SMTP_PASS in .env to send onboarding emails to the school admin.');
    }

    try {
      console.log(`[EmailService] 📧 Sending school admin onboarding email to ${adminEmail}...`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] ✅ School admin onboarding email sent. Message ID: ${info.messageId}`);
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send school admin onboarding email:', error?.message);
      logCredentialsForManualUse();
      throw error;
    }
  }

  async sendCategoryAdminOnboardingEmail(
    adminEmail: string,
    adminName: string,
    schoolName: string,
    categoryName: string,
    tempPassword: string,
  ) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: 'Welcome to SemBuzz - Your Category Admin Account Has Been Created',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a1f2e; }
            .button { display: inline-block; padding: 12px 30px; background-color: #1a1f2e; color: white; text-decoration: none; border-radius: 50px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SemBuzz!</h1>
            </div>
            <div class="content">
              <p>Dear ${adminName},</p>
              
              <p>Your category admin account has been successfully created on SemBuzz. Below are your login credentials:</p>
              
              <div class="credentials">
                <h3 style="margin-top: 0; color: #1a1f2e;">Login Credentials</h3>
                <p><strong>Email:</strong> ${adminEmail}</p>
                <p><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
              </div>
              
              <div class="credentials">
                <h3 style="margin-top: 0; color: #1a1f2e;">Access Information</h3>
                <p><strong>School:</strong> ${schoolName}</p>
                <p><strong>Category:</strong> ${categoryName}</p>
              </div>
              
              <h3 style="color: #1a1f2e;">Next Steps:</h3>
              <ol>
                <li>Log in using your <strong>Email (${adminEmail})</strong> as your User ID</li>
                <li>Use the temporary password provided above</li>
                <li>You will be prompted to change your password on first login</li>
                <li>Start managing your category and subcategories</li>
              </ol>
              
              <p style="margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/category-admin/login" class="button">Login to SemBuzz</a>
              </p>
              
              <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                <strong>Important:</strong> Please keep your credentials secure and change your password immediately after first login.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      // Only send email if SMTP is configured
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[EmailService] ❌ SMTP credentials not configured!');
        console.error('[EmailService] Category admin email not sent. Details:', {
          adminEmail,
          adminName,
          categoryName,
          tempPassword,
        });
        console.error('[EmailService] Please configure SMTP_USER and SMTP_PASS in your .env file');
        return;
      }

      const info = await this.transporter.sendMail(mailOptions);
      console.log('[EmailService] ✅ Category admin onboarding email sent successfully:', {
        to: adminEmail,
        messageId: info.messageId,
      });
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send category admin onboarding email:', error);
      throw error;
    }
  }

  async sendSubCategoryAdminOnboardingEmail(
    adminEmail: string,
    adminName: string,
    schoolName: string,
    categoryName: string,
    subCategoryName: string,
    tempPassword: string,
  ) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: 'Welcome to SemBuzz - Your Subcategory Admin Account Has Been Created',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a1f2e; }
            .button { display: inline-block; padding: 12px 30px; background-color: #1a1f2e; color: white; text-decoration: none; border-radius: 50px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SemBuzz!</h1>
            </div>
            <div class="content">
              <p>Dear ${adminName},</p>
              
              <p>Your subcategory admin account has been successfully created on SemBuzz. Below are your login credentials:</p>
              
              <div class="credentials">
                <h3 style="margin-top: 0; color: #1a1f2e;">Login Credentials</h3>
                <p><strong>Email:</strong> ${adminEmail}</p>
                <p><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
              </div>
              
              <div class="credentials">
                <h3 style="margin-top: 0; color: #1a1f2e;">Access Information</h3>
                <p><strong>School:</strong> ${schoolName}</p>
                <p><strong>Category:</strong> ${categoryName}</p>
                <p><strong>Subcategory:</strong> ${subCategoryName}</p>
              </div>
              
              <h3 style="color: #1a1f2e;">Next Steps:</h3>
              <ol>
                <li>Log in using your <strong>Email (${adminEmail})</strong> as your User ID</li>
                <li>Use the temporary password provided above</li>
                <li>You will be prompted to change your password on first login</li>
                <li>Start managing your subcategory</li>
              </ol>
              
              <p style="margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/subcategory-admin/login" class="button">Login to SemBuzz</a>
              </p>
              
              <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                <strong>Important:</strong> Please keep your credentials secure and change your password immediately after first login.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[EmailService] ❌ SMTP credentials not configured!');
        console.error('[EmailService] Subcategory admin email not sent. Details:', {
          adminEmail,
          adminName,
          subCategoryName,
          tempPassword,
        });
        console.error('[EmailService] Please configure SMTP_USER and SMTP_PASS in your .env file');
        return;
      }

      const info = await this.transporter.sendMail(mailOptions);
      console.log('[EmailService] ✅ Subcategory admin onboarding email sent successfully:', {
        to: adminEmail,
        messageId: info.messageId,
      });
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send subcategory admin onboarding email:', error);
      throw error;
    }
  }

  async sendUserOtp(toEmail: string, otp: string, schoolName: string) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: 'SemBuzz - Verify Your Email (One-Time Password)',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { background-color: white; padding: 30px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a1f2e; text-align: center; }
            .otp-code { font-size: 2rem; font-weight: bold; color: #1a1f2e; letter-spacing: 0.5rem; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You are registering for <strong>${schoolName}</strong> on SemBuzz. Use this one-time password to complete your account creation:</p>
              <div class="otp-box">
                <h3 style="margin-top: 0; color: #1a1f2e;">Your OTP Code</h3>
                <div class="otp-code">${otp}</div>
                <p style="color: #6c757d; font-size: 0.9rem; margin-top: 15px;">This OTP will expire in ${10} minutes.</p>
              </div>
              <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                If you did not request this, please ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const isDev = process.env.NODE_ENV !== 'production';
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      if (isDev) {
        console.warn('[EmailService] ⚠️  SMTP not configured. In development, OTP is logged below.');
        console.warn(`[EmailService] 📧 OTP for ${toEmail} (${schoolName}): ${otp}`);
        return;
      }
      console.error('[EmailService] ❌ SMTP credentials not configured! User OTP email not sent.');
      throw new Error('SMTP is not configured. Set SMTP_USER and SMTP_PASS in .env to send verification emails.');
    }
    try {
      console.log(`[EmailService] 📧 Sending user OTP email to ${toEmail}...`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] ✅ User OTP email sent! Message ID: ${info.messageId}`);
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      const errCode = error?.code;
      const errResponse = error?.response;
      if (isDev) {
        console.warn('[EmailService] ⚠️  Send failed (development fallback). Use this OTP to verify:');
        console.warn(`[EmailService] 📧 OTP for ${toEmail}: ${otp}`);
        console.warn('[EmailService] Send error:', errMsg, errCode ? `(code: ${errCode})` : '', errResponse ? `response: ${errResponse}` : '');
        return;
      }
      console.error('[EmailService] ❌ Failed to send user OTP email:', error);
      throw error;
    }
  }

  async sendDocumentRequestToUser(
    toEmail: string,
    userName: string,
    schoolName: string,
  ) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: `SemBuzz - ${schoolName} has requested verification documents`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a1f2e; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verification documents requested</h1>
            </div>
            <div class="content">
              <p>Hello ${userName || 'there'},</p>
              <p>Your school administrator for <strong>${schoolName}</strong> has requested verification documents to complete your account approval.</p>
              <div class="box">
                <p style="margin: 0;"><strong>Please submit one or more of the following:</strong></p>
                <ul style="margin: 10px 0 0 20px;">
                  <li>School ID card</li>
                  <li>Student ID or enrollment proof</li>
                  <li>Other document linking you to ${schoolName}</li>
                </ul>
              </div>
              <p>You can send these documents to your school admin directly, or contact them to complete your registration.</p>
              <p style="color: #6c757d; font-size: 14px;">Once verified, your school admin will approve your account and you can log in to SemBuzz.</p>
            </div>
            <div class="footer">
              <p>This is an automated email from SemBuzz. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('[EmailService] SMTP not configured. Document request email not sent.');
      return;
    }
    try {
      await this.transporter.sendMail(mailOptions);
      console.log('[EmailService] Document request email sent to', toEmail);
    } catch (error: any) {
      console.error('[EmailService] Failed to send document request email:', error);
      throw error;
    }
  }

  async sendReuploadRequestToUser(
    toEmail: string,
    userName: string,
    schoolName: string,
    message: string,
    type: 'reupload' | 'additional',
    updateDocLink: string,
  ) {
    if (!updateDocLink || !updateDocLink.startsWith('http')) {
      console.error('[EmailService] sendReuploadRequestToUser called without valid updateDocLink – email would have no link. Aborting.');
      throw new Error('updateDocLink is required and must be a valid URL');
    }
    const escapedMessage = (message || (type === 'additional' ? 'Please upload one more school-related document.' : 'Please upload a clearer or valid school document (e.g. ID card, fee receipt).'))
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br/>');
    const isAdditional = type === 'additional';
    const headerTitle = isAdditional ? 'Additional document requested' : 'Document re-upload requested';
    const introText = isAdditional
      ? `Your school administrator for <strong>${schoolName}</strong> has asked you to upload one more school-related document (e.g. fee receipt, enrollment letter).`
      : `Your school administrator for <strong>${schoolName}</strong> has reviewed your registration and is asking you to re-upload your school document more clearly.`;
    const linkForHtml = updateDocLink.replace(/&/g, '&amp;');
    const buttonHtml = `
        <p style="margin-top: 24px; margin-bottom: 16px;"><strong>Click the button below to upload your document:</strong></p>
        <p style="margin-bottom: 16px;"><a href="${linkForHtml}" style="display: inline-block; padding: 14px 28px; background-color: #1a1f2e; color: white !important; text-decoration: none; border-radius: 50px; font-weight: 600;">${isAdditional ? 'Upload additional document' : 'Re-upload document clearly'}</a></p>
        <p style="color: #6c757d; font-size: 13px; margin-top: 12px;">Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; font-size: 13px; background: #eee; padding: 12px; border-radius: 6px;">${linkForHtml}</p>
      `;
    const introTextPlain = isAdditional
      ? `Your school administrator for ${schoolName} has asked you to upload one more school-related document (e.g. fee receipt, enrollment letter).`
      : `Your school administrator for ${schoolName} has reviewed your registration and is asking you to re-upload your school document more clearly.`;
    const textBody = `Hello ${userName || 'there'},\n\n${introTextPlain}\n\nMessage from your school admin: ${message}\n\nUse the link below to ${isAdditional ? 'upload your additional document' : 're-upload your document'}. You do NOT need to fill in your name, email, or other details again—only upload the document.\n\n${updateDocLink}\n\nIf you have questions, contact your school administration.`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: isAdditional
        ? `SemBuzz - Upload one more school document (${schoolName})`
        : `SemBuzz - Please re-upload your school document (${schoolName})`,
      text: textBody,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e67e22; white-space: pre-wrap; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${headerTitle}</h1>
            </div>
            <div class="content">
              <p>Hello ${userName || 'there'},</p>
              <p>${introText}</p>
              <div class="box">
                <strong>Message from your school admin:</strong><br/><br/>${escapedMessage}
              </div>
              <p>Use the link below to ${isAdditional ? 'upload your additional document' : 're-upload your document clearly'}. You do <strong>not</strong> need to fill in your name, email, or other registration details again—only upload the document.</p>
              ${buttonHtml}
              <p style="color: #6c757d; font-size: 14px; margin-top: 24px;">If you have questions, contact your school administration.</p>
            </div>
            <div class="footer">
              <p>This is an automated email from SemBuzz. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Use same Hostinger SMTP transporter as other emails (onboarding, OTP, etc.)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('[EmailService] SMTP not configured. Reupload request email not sent.');
      return;
    }

    try {
      console.log('[EmailService] 📧 Sending reupload request email via SMTP (Hostinger)...');
      console.log('[EmailService] To:', toEmail, '| Subject:', mailOptions.subject, '| Type:', type);
      console.log('[EmailService] Update doc link:', updateDocLink.substring(0, 60) + '...');

      const info = await this.transporter.sendMail(mailOptions);

      console.log('[EmailService] ✅ Reupload request email sent successfully!');
      console.log('[EmailService] Message ID:', info.messageId);
      console.log('[EmailService] SMTP response:', info.response || 'OK');
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send reupload request email:', error?.message || error);
      console.error('[EmailService] SMTP response:', error?.response);
      throw error;
    }
  }

  /** Send "you're approved" email with verify link. User must click link to be allowed to login. */
  async sendApprovalEmailWithVerifyLink(
    toEmail: string,
    userName: string,
    schoolName: string,
    verifyLink: string,
  ) {
    if (!verifyLink || !verifyLink.startsWith('http')) {
      console.error('[EmailService] sendApprovalEmailWithVerifyLink called without valid verifyLink.');
      throw new Error('verifyLink is required and must be a valid URL');
    }
    const linkForHtml = verifyLink.replace(/&/g, '&amp;');
    const textBody = `Hello ${userName || 'there'},\n\nYour school administrator for ${schoolName} has approved your SemBuzz account.\n\nYou must click the link below to verify and accept your account. Only after you click the link will you be able to log in.\n\n${verifyLink}\n\nIf you did not request this, you can ignore this email.\n\n— SemBuzz`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: `SemBuzz - Your account has been approved (${schoolName})`,
      text: textBody,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account approved</h1>
            </div>
            <div class="content">
              <p>Hello ${userName || 'there'},</p>
              <p>Your school administrator for <strong>${schoolName}</strong> has approved your SemBuzz account.</p>
              <p><strong>You must click the link below to verify and accept your account.</strong> Only after you click the link will you be able to log in.</p>
              <p style="margin-top: 24px; margin-bottom: 16px;"><a href="${linkForHtml}" style="display: inline-block; padding: 14px 28px; background-color: #1a1f2e; color: white !important; text-decoration: none; border-radius: 50px; font-weight: 600;">Verify email &amp; log in</a></p>
              <p style="color: #6c757d; font-size: 13px;">Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; font-size: 13px; background: #eee; padding: 12px; border-radius: 6px;">${linkForHtml}</p>
              <p style="color: #6c757d; font-size: 14px; margin-top: 24px;">If you did not request this, you can ignore this email.</p>
            </div>
            <div class="footer">
              <p>This is an automated email from SemBuzz. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('[EmailService] SMTP not configured. Cannot send approval email.');
      throw new Error('SMTP is not configured. Set SMTP_USER and SMTP_PASS in .env to send approval emails.');
    }
    try {
      console.log('[EmailService] 📧 Sending approval email with verify link to', toEmail);
      await this.transporter.sendMail(mailOptions);
      console.log('[EmailService] ✅ Approval email sent to', toEmail);
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send approval email:', error?.message || error);
      throw error;
    }
  }

  /** Send "registration rejected" email to user when school admin rejects their pending signup. */
  async sendRejectionEmailToUser(toEmail: string, userName: string, schoolName: string) {
    const textBody = `Hello ${userName || 'there'},\n\nYour school administrator for ${schoolName} has not approved your SemBuzz account registration.\n\nYour registration has been declined. If you believe this was a mistake, please contact your school administration or try registering again with the correct documents.\n\n— SemBuzz`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: `SemBuzz - Registration not approved (${schoolName})`,
      text: textBody,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Registration not approved</h1>
            </div>
            <div class="content">
              <p>Hello ${userName || 'there'},</p>
              <p>Your school administrator for <strong>${schoolName}</strong> has not approved your SemBuzz account registration.</p>
              <p>Your registration has been declined. If you believe this was a mistake, please contact your school administration or try registering again with the correct documents.</p>
            </div>
            <div class="footer">
              <p>This is an automated email from SemBuzz. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('[EmailService] SMTP not configured. Cannot send rejection email.');
      throw new Error('SMTP is not configured. Set SMTP_USER and SMTP_PASS in .env to send rejection emails.');
    }
    try {
      console.log('[EmailService] 📧 Sending rejection email to', toEmail);
      await this.transporter.sendMail(mailOptions);
      console.log('[EmailService] ✅ Rejection email sent to', toEmail);
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send rejection email:', error?.message || error);
      throw error;
    }
  }

  async sendPendingUserToSchoolAdmin(
    adminEmail: string,
    userDetails: { firstName: string; lastName: string; email: string },
    schoolName: string,
    userId: string,
  ) {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/school-admin/dashboard`;
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: `SemBuzz - Student Registration Pending Approval (${schoolName})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a1f2e; }
            .button { display: inline-block; padding: 12px 30px; background-color: #1a1f2e; color: white; text-decoration: none; border-radius: 50px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Student Registration Pending</h1>
            </div>
            <div class="content">
              <p>Dear School Administrator,</p>
              <p>A student has requested to create an account for <strong>${schoolName}</strong> using a personal email (Gmail). Please review and approve or reject the registration.</p>
              <div class="credentials">
                <h3 style="margin-top: 0; color: #1a1f2e;">Applicant Details</h3>
                <p><strong>First Name:</strong> ${userDetails.firstName}</p>
                <p><strong>Last Name:</strong> ${userDetails.lastName}</p>
                <p><strong>Email:</strong> ${userDetails.email}</p>
              </div>
              <p>Go to your dashboard to approve or reject this registration.</p>
              <p style="margin-top: 20px;">
                <a href="${dashboardUrl}" class="button">Open Dashboard</a>
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[EmailService] ❌ SMTP credentials not configured! Pending user email not sent.');
        return;
      }
      console.log(`[EmailService] 📧 Sending pending user notification to ${adminEmail}...`);
      await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] ✅ Pending user email sent to school admin.`);
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send pending user email to admin:', error);
    }
  }

  async sendOtpEmail(adminEmail: string, schoolName: string, refNum: string, otp: string) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: 'SemBuzz - Password Reset OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { background-color: white; padding: 30px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a1f2e; text-align: center; }
            .otp-code { font-size: 2rem; font-weight: bold; color: #1a1f2e; letter-spacing: 0.5rem; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Dear School Administrator,</p>
              
              <p>You have requested to reset your password for <strong>${schoolName}</strong> (Ref: ${refNum}).</p>
              
              <div class="otp-box">
                <h3 style="margin-top: 0; color: #1a1f2e;">Your OTP Code</h3>
                <div class="otp-code">${otp}</div>
                <p style="color: #6c757d; font-size: 0.9rem; margin-top: 15px;">
                  This OTP will expire in 10 minutes.
                </p>
              </div>
              
              <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                <strong>Important:</strong> If you did not request this password reset, please ignore this email or contact support immediately.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[EmailService] ❌ SMTP credentials not configured! OTP email not sent.');
        return;
      }
      await this.transporter.sendMail(mailOptions);
      console.log('[EmailService] ✅ School admin OTP email sent to', adminEmail);
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send OTP email:', error);
      throw error;
    }
  }

  async sendCategoryAdminPasswordResetOtp(adminEmail: string, adminName: string, otp: string) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: 'SemBuzz - Category Admin Password Reset OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { background-color: white; padding: 30px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a1f2e; text-align: center; }
            .otp-code { font-size: 2rem; font-weight: bold; color: #1a1f2e; letter-spacing: 0.5rem; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Dear ${adminName},</p>
              <p>You have requested to reset your password for your <strong>Category Admin</strong> account (${adminEmail}).</p>
              <div class="otp-box">
                <h3 style="margin-top: 0; color: #1a1f2e;">Your OTP Code</h3>
                <div class="otp-code">${otp}</div>
                <p style="color: #6c757d; font-size: 0.9rem; margin-top: 15px;">This OTP will expire in 10 minutes.</p>
              </div>
              <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                <strong>Important:</strong> If you did not request this password reset, please ignore this email or contact support immediately.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const isDev = process.env.NODE_ENV !== 'production';
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      if (isDev) {
        console.warn('[EmailService] ⚠️  SMTP not configured. Category admin OTP logged below.');
        console.warn(`[EmailService] 📧 OTP for ${adminEmail} (Category Admin): ${otp}`);
        return;
      }
      console.error('[EmailService] ❌ SMTP credentials not configured! Category admin OTP not sent.');
      return;
    }
    try {
      console.log(`[EmailService] 📧 Sending OTP email to ${adminEmail}...`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] ✅ OTP email sent successfully! Message ID: ${info.messageId}`);
    } catch (error: any) {
      if (isDev) {
        console.warn('[EmailService] ⚠️  Send failed (dev). Use this OTP:', otp);
        return;
      }
      console.error('[EmailService] ❌ Failed to send category admin OTP email:', error);
      throw error;
    }
  }

  async sendAdsAdminOnboardingEmail(
    adminEmail: string,
    adminName: string,
    schoolName: string,
    tempPassword: string,
  ) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: 'Welcome to SemBuzz - Your Ads Admin Account Has Been Created',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a1f2e; }
            .button { display: inline-block; padding: 12px 30px; background-color: #1a1f2e; color: white; text-decoration: none; border-radius: 50px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SemBuzz - Ads Admin</h1>
            </div>
            <div class="content">
              <p>Dear ${adminName},</p>
              <p>Your <strong>Ads Admin</strong> account has been created for <strong>${schoolName}</strong>. You can manage banner and sponsored ads for your school.</p>
              <div class="credentials">
                <h3 style="margin-top: 0; color: #1a1f2e;">Login Credentials</h3>
                <p><strong>Email:</strong> ${adminEmail}</p>
                <p><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
              </div>
              <p><strong>Next steps:</strong></p>
              <ol>
                <li>Log in at the Ads Admin portal using your email and the temporary password above.</li>
                <li>You will be prompted to change your password on first login.</li>
                <li>Create and manage banner ads and sponsored ads for your school.</li>
              </ol>
              <p style="margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/ads-admin/login" class="button">Login to Ads Admin</a>
              </p>
              <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                <strong>Important:</strong> Please keep your credentials secure and change your password after first login.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('[EmailService] ⚠️ SMTP not configured. Ads admin onboarding email not sent.');
      throw new Error('SMTP is not configured. Set SMTP_USER and SMTP_PASS in .env to send onboarding emails to the ads admin.');
    }
    try {
      console.log(`[EmailService] 📧 Sending ads admin onboarding email to ${adminEmail}...`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] ✅ Ads admin onboarding email sent. Message ID: ${info?.messageId}`);
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send ads admin onboarding email:', error?.message);
      throw error;
    }
  }

  async sendAdsAdminPasswordResetOtp(adminEmail: string, adminName: string, otp: string) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: 'SemBuzz - Ads Admin Password Reset OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { background-color: white; padding: 30px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a1f2e; text-align: center; }
            .otp-code { font-size: 2rem; font-weight: bold; color: #1a1f2e; letter-spacing: 0.5rem; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Dear ${adminName},</p>
              <p>You have requested to reset your password for your <strong>Ads Admin</strong> account (${adminEmail}).</p>
              <div class="otp-box">
                <h3 style="margin-top: 0; color: #1a1f2e;">Your OTP Code</h3>
                <div class="otp-code">${otp}</div>
                <p style="color: #6c757d; font-size: 0.9rem; margin-top: 15px;">This OTP will expire in 10 minutes.</p>
              </div>
              <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                <strong>Important:</strong> If you did not request this password reset, please ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const isDev = process.env.NODE_ENV !== 'production';
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      if (isDev) {
        console.warn('[EmailService] ⚠️  SMTP not configured. Ads admin OTP logged below.');
        console.warn(`[EmailService] 📧 OTP for ${adminEmail} (Ads Admin): ${otp}`);
        return;
      }
      return;
    }
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error: any) {
      if (isDev) console.warn('[EmailService] Ads admin OTP send failed:', error?.message);
      throw error;
    }
  }

  async sendSubCategoryAdminPasswordResetOtp(adminEmail: string, adminName: string, otp: string) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: 'SemBuzz - Subcategory Admin Password Reset OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { background-color: white; padding: 30px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a1f2e; text-align: center; }
            .otp-code { font-size: 2rem; font-weight: bold; color: #1a1f2e; letter-spacing: 0.5rem; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Dear ${adminName},</p>
              <p>You have requested to reset your password for your <strong>Subcategory Admin</strong> account (${adminEmail}).</p>
              <div class="otp-box">
                <h3 style="margin-top: 0; color: #1a1f2e;">Your OTP Code</h3>
                <div class="otp-code">${otp}</div>
                <p style="color: #6c757d; font-size: 0.9rem; margin-top: 15px;">This OTP will expire in 10 minutes.</p>
              </div>
              <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                <strong>Important:</strong> If you did not request this password reset, please ignore this email or contact support immediately.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[EmailService] ❌ SMTP credentials not configured! Subcategory admin OTP not sent.');
        return;
      }

      console.log(`[EmailService] 📧 Sending OTP email to ${adminEmail} (subcategory admin)...`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] ✅ OTP email sent successfully! Message ID: ${info.messageId}`);
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send subcategory admin OTP email:', error);
      throw error;
    }
  }

  async sendFeatureUpdateEmail(
    adminEmail: string,
    schoolName: string,
    refNum: string,
    addedFeatures: string[],
    removedFeatures: string[],
  ) {
    const addedList = addedFeatures.length > 0 
      ? `<ul style="margin: 10px 0; padding-left: 20px;">${addedFeatures.map(f => `<li>${f}</li>`).join('')}</ul>`
      : '<p style="color: #6c757d;">None</p>';
    
    const removedList = removedFeatures.length > 0
      ? `<ul style="margin: 10px 0; padding-left: 20px;">${removedFeatures.map(f => `<li>${f}</li>`).join('')}</ul>`
      : '<p style="color: #6c757d;">None</p>';

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: 'SemBuzz - Features Updated for Your School',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .feature-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a1f2e; }
            .added { border-left-color: #198754; }
            .removed { border-left-color: #dc3545; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Features Updated</h1>
            </div>
            <div class="content">
              <p>Dear School Administrator,</p>
              
              <p>The features for <strong>${schoolName}</strong> (Ref: ${refNum}) have been updated. Below are the changes:</p>
              
              <div class="feature-box added">
                <h3 style="margin-top: 0; color: #198754;">✅ Features Enabled</h3>
                ${addedList}
              </div>
              
              <div class="feature-box removed">
                <h3 style="margin-top: 0; color: #dc3545;">❌ Features Disabled</h3>
                ${removedList}
              </div>
              
              <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                Please log in to your SemBuzz account to access the newly enabled features.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[EmailService] ❌ SMTP credentials not configured! Feature update email not sent.');
        return;
      }

      console.log(`[EmailService] 📧 Sending feature update email to ${adminEmail}...`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] ✅ Feature update email sent successfully! Message ID: ${info.messageId}`);
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send feature update email:', error);
      // Don't throw error - feature update should still succeed even if email fails
    }
  }

  async sendCompleteSchoolInfo(
    adminEmail: string,
    schoolName: string,
    refNum: string,
    schoolDetails: {
      country?: string;
      state?: string;
      city: string;
      tenure?: number;
      features: string[];
      adminName: string;
      adminEmail: string;
    },
  ) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: `Complete School Information - ${schoolName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .info-section { margin: 20px 0; padding: 15px; background-color: white; border-radius: 5px; }
            .info-label { font-weight: bold; color: #1a1f2e; }
            .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Complete School Information</h1>
            </div>
            <div class="content">
              <p>Dear ${schoolDetails.adminName},</p>
              <p>Here is the complete information for your school:</p>
              
              <div class="info-section">
                <p><span class="info-label">School Name:</span> ${schoolName}</p>
                <p><span class="info-label">Reference Number:</span> ${refNum}</p>
                <p><span class="info-label">Location:</span> ${schoolDetails.city}${schoolDetails.state ? `, ${schoolDetails.state}` : ''}${schoolDetails.country ? `, ${schoolDetails.country}` : ''}</p>
                ${schoolDetails.tenure ? `<p><span class="info-label">Tenure:</span> ${schoolDetails.tenure} months</p>` : ''}
                <p><span class="info-label">School Admin:</span> ${schoolDetails.adminName} (${schoolDetails.adminEmail})</p>
                <p><span class="info-label">Enabled Features:</span></p>
                <ul>
                  ${schoolDetails.features.map(f => `<li>${f}</li>`).join('')}
                </ul>
              </div>
              
              <p>If you have any questions, please contact us.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[EmailService] ❌ SMTP credentials not configured!');
        return;
      }
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] ✅ Complete school info email sent! Message ID: ${info.messageId}`);
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send complete school info email:', error);
      throw error;
    }
  }

  async sendFeaturesSelected(
    adminEmail: string,
    schoolName: string,
    refNum: string,
    features: string[],
  ) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: `Selected Features - ${schoolName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .features-list { margin: 20px 0; padding: 15px; background-color: white; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Selected Features</h1>
            </div>
            <div class="content">
              <p>Dear School Admin,</p>
              <p>Here are the features currently enabled for <strong>${schoolName}</strong> (Ref: ${refNum}):</p>
              
              <div class="features-list">
                <ul>
                  ${features.map(f => `<li>${f}</li>`).join('')}
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[EmailService] ❌ SMTP credentials not configured!');
        return;
      }
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] ✅ Features selected email sent! Message ID: ${info.messageId}`);
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send features selected email:', error);
      throw error;
    }
  }

  async sendTenureEndsSoon(
    adminEmail: string,
    schoolName: string,
    refNum: string,
    tenure: number,
    remainingMonths: number,
  ) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: `Tenure Renewal Reminder - ${schoolName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #fd7e14; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .warning { background-color: #fff3cd; border-left: 4px solid #fd7e14; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Tenure Renewal Reminder</h1>
            </div>
            <div class="content">
              <p>Dear School Admin,</p>
              
              <div class="warning">
                <p><strong>Important Notice:</strong></p>
                <p>Your school's tenure for <strong>${schoolName}</strong> (Ref: ${refNum}) is ending soon.</p>
                <p><strong>Total Tenure:</strong> ${tenure} months</p>
                <p><strong>Remaining:</strong> ${remainingMonths} months</p>
              </div>
              
              <p>Please contact us to renew your tenure and continue enjoying our services.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[EmailService] ❌ SMTP credentials not configured!');
        return;
      }
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] ✅ Tenure ends soon email sent! Message ID: ${info.messageId}`);
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send tenure ends soon email:', error);
      throw error;
    }
  }

  async sendRefNum(
    adminEmail: string,
    schoolName: string,
    refNum: string,
  ) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: `Reference Number - ${schoolName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .refnum-box { background-color: white; border: 2px solid #1a1f2e; padding: 20px; text-align: center; margin: 20px 0; }
            .refnum { font-size: 24px; font-weight: bold; color: #1a1f2e; }
            .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reference Number</h1>
            </div>
            <div class="content">
              <p>Dear School Admin,</p>
              <p>Your reference number for <strong>${schoolName}</strong> is:</p>
              
              <div class="refnum-box">
                <div class="refnum">${refNum}</div>
              </div>
              
              <p>Please keep this reference number safe. You can use it to log in or for any support requests.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[EmailService] ❌ SMTP credentials not configured!');
        return;
      }
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] ✅ RefNum email sent! Message ID: ${info.messageId}`);
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send refNum email:', error);
      throw error;
    }
  }

  async sendDeveloperSupportRequest(
    requestData: {
      type: string;
      description?: string;
      meetingType?: string;
      timeZone?: string;
      timeSlot?: string;
      customMessage?: string;
      meetingLink?: string;
      meetingError?: string;
    },
    superAdminEmail?: string,
  ) {
    const requestTypeLabels: Record<string, string> = {
      'raise_issue': 'Raise an Issue with the Software',
      'integrate_feature': 'Needs to Integrate New Feature',
      'ui_change': 'UI Change Request',
      'upscale_platform': 'Upscale the Platform',
      'custom_message': 'Custom Message',
      'schedule_meeting': 'Schedule Meeting',
    };

    const requestType = requestTypeLabels[requestData.type] || requestData.type;

    let emailContent = `
      <div style="background-color: #f9f9f9; padding: 30px;">
        <h2 style="color: #1a1f2e; margin-bottom: 20px;">Support Request from SemBuzz</h2>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong style="color: #1a1f2e;">Request Type:</strong> <span style="color: #6c757d;">${requestType}</span></p>
    `;

    if (requestData.description) {
      emailContent += `
        <p><strong style="color: #1a1f2e;">Description:</strong></p>
        <p style="color: #6c757d; background-color: #f8f9fa; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${requestData.description}</p>
      `;
    }

    if (requestData.type === 'integrate_feature') {
      emailContent += `
        <p style="color: #198754; font-weight: 600; padding: 15px; background-color: #d4edda; border-radius: 4px;">
          Developer will get in touch with you shortly.
        </p>
      `;
    }

    if (requestData.customMessage) {
      emailContent += `
        <p><strong style="color: #1a1f2e;">Custom Message:</strong></p>
        <p style="color: #6c757d; background-color: #f8f9fa; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${requestData.customMessage}</p>
      `;
    }

    if (requestData.type === 'schedule_meeting') {
      emailContent += `
        <p><strong style="color: #1a1f2e;">Meeting Platform:</strong> <span style="color: #6c757d;">${requestData.meetingType === 'google_meet' ? 'Google Meet' : 'Zoom'}</span></p>
        <p><strong style="color: #1a1f2e;">Time Zone:</strong> <span style="color: #6c757d;">${requestData.timeZone || 'Not specified'}</span></p>
        <p><strong style="color: #1a1f2e;">Time Slot:</strong> <span style="color: #6c757d;">${requestData.timeSlot || 'Not specified'}</span></p>
      `;
      if (requestData.meetingLink) {
        emailContent += `<p><strong style="color: #1a1f2e;">Join meeting:</strong> <a href="${requestData.meetingLink}" target="_blank">${requestData.meetingLink}</a></p><p style="color: #6c757d; font-size: 0.9em;">Google Calendar invites include a 5-minute reminder. Zoom sends its own reminder to participants.</p>`;
      } else if (requestData.meetingError) {
        const apiBase = process.env.API_URL || 'http://localhost:3000';
        emailContent += `<p style="color: #856404; background-color: #fff3cd; padding: 12px; border-radius: 4px; font-size: 0.95em;"><strong>Meeting could not be created:</strong> ${requestData.meetingError}</p><p style="color: #6c757d; font-size: 0.9em;">To get a Meet link and calendar invite, open <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">the app</a>, then visit <strong>${apiBase}/google/auth</strong> and sign in with the <strong>same Google account</strong> that owns the calendar where you want the event (e.g. naveen reddy). After authorizing, try scheduling again.</p>`;
      }
    }

    if (superAdminEmail) {
      emailContent += `
        <p><strong style="color: #1a1f2e;">Requested By:</strong> <span style="color: #6c757d;">${superAdminEmail}</span></p>
      `;
    }

    emailContent += `
        </div>
        
        <p style="color: #6c757d; font-size: 14px;">
          <strong style="color: #1a1f2e;">This is queries time</strong> - Request raised by SemBuzz
        </p>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: 'naveenreddyhosur921@gmail.com',
      subject: `Support Request: ${requestType} - SemBuzz`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Support Request</h1>
            </div>
            ${emailContent}
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[EmailService] ❌ SMTP credentials not configured!');
        return;
      }
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] ✅ Developer support request email sent! Message ID: ${info.messageId}`);
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send developer support request email:', error);
      throw error;
    }
  }

  /**
   * Send school admin query to super admin (developer). Used when school admin raises a request.
   */
  async sendSchoolAdminQueryToSuperAdmin(
    schoolAdminName: string,
    schoolAdminEmail: string,
    schoolName: string,
    requestData: {
      type: string;
      description?: string;
      customMessage?: string;
      meetingType?: string;
      timeZone?: string;
      timeSlot?: string;
      attachmentUrl?: string;
      meetingLink?: string;
    },
  ) {
    const typeLabels: Record<string, string> = {
      dev_support: 'Dev Support Help',
      features_not_working: 'Features Not Working',
      schedule_meeting: 'Schedule a Meeting',
      custom_message: 'Custom Message',
    };
    const requestType = typeLabels[requestData.type] || requestData.type;

    let body = `
      <p><strong style="color: #1a1f2e;">Request Type:</strong> <span style="color: #6c757d;">${requestType}</span></p>
      <p><strong style="color: #1a1f2e;">From:</strong> <span style="color: #6c757d;">${schoolAdminName} (${schoolAdminEmail})</span></p>
      <p><strong style="color: #1a1f2e;">School:</strong> <span style="color: #6c757d;">${schoolName}</span></p>
    `;
    const messageText = requestData.customMessage || requestData.description;
    if (messageText) {
      body += `
        <p><strong style="color: #1a1f2e;">Message:</strong></p>
        <p style="color: #6c757d; background-color: #f8f9fa; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${messageText}</p>
      `;
    }
    if (requestData.type === 'schedule_meeting') {
      body += `
        <p><strong style="color: #1a1f2e;">Meeting Platform:</strong> <span style="color: #6c757d;">${requestData.meetingType === 'google_meet' ? 'Google Meet' : requestData.meetingType === 'zoom' ? 'Zoom' : requestData.meetingType || '—'}</span></p>
        <p><strong style="color: #1a1f2e;">Time Zone:</strong> <span style="color: #6c757d;">${requestData.timeZone || '—'}</span></p>
        <p><strong style="color: #1a1f2e;">Time Slot:</strong> <span style="color: #6c757d;">${requestData.timeSlot || '—'}</span></p>
      `;
      if (requestData.meetingLink) {
        body += `<p><strong style="color: #1a1f2e;">Join meeting:</strong> <a href="${requestData.meetingLink}" target="_blank">${requestData.meetingLink}</a></p><p style="color: #6c757d; font-size: 0.9em;">Google Calendar invites include a 5-minute reminder. Zoom sends its own reminder to participants.</p>`;
      }
    }
    if (requestData.attachmentUrl) {
      body += `<p><strong style="color: #1a1f2e;">Attachment:</strong> <a href="${requestData.attachmentUrl}" target="_blank">View document</a></p>`;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: 'naveenreddyhosur921@gmail.com',
      subject: `Query from School Admin: ${requestType} - ${schoolName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>New Query from School Admin</h1></div>
            <div class="content">${body}</div>
            <div class="footer"><p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p></div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[EmailService] ❌ SMTP credentials not configured!');
        return;
      }
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] ✅ School admin query to super admin sent! Message ID: ${info.messageId}`);
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send school admin query email:', error);
      throw error;
    }
  }

  /** Subcategory admin raised query → notify category admin(s) */
  async sendSubCategoryAdminQueryToCategoryAdmin(
    toEmail: string,
    subCategoryAdminName: string,
    subCategoryAdminEmail: string,
    categoryName: string,
    subCategoryName: string,
    requestData: {
      type: string;
      description?: string;
      meetingType?: string;
      timeZone?: string;
      timeSlot?: string;
      attachmentUrl?: string;
      meetingLink?: string;
    },
  ) {
    const typeLabels: Record<string, string> = {
      custom_message: 'Custom Message',
      schedule_meeting: 'Schedule a Meeting',
    };
    const requestType = typeLabels[requestData.type] || requestData.type;
    let body = `
      <p><strong style="color: #1a1f2e;">Request Type:</strong> <span style="color: #6c757d;">${requestType}</span></p>
      <p><strong style="color: #1a1f2e;">From:</strong> <span style="color: #6c757d;">${subCategoryAdminName} (${subCategoryAdminEmail})</span></p>
      <p><strong style="color: #1a1f2e;">Category / Subcategory:</strong> <span style="color: #6c757d;">${categoryName} / ${subCategoryName}</span></p>
    `;
    if (requestData.description) {
      body += `<p><strong style="color: #1a1f2e;">Message:</strong></p><p style="color: #6c757d; background-color: #f8f9fa; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${requestData.description}</p>`;
    }
    if (requestData.type === 'schedule_meeting') {
      body += `
        <p><strong style="color: #1a1f2e;">Meeting:</strong> <span style="color: #6c757d;">${requestData.meetingType === 'google_meet' ? 'Google Meet' : requestData.meetingType === 'zoom' ? 'Zoom' : '—'}</span></p>
        <p><strong style="color: #1a1f2e;">Time Zone:</strong> <span style="color: #6c757d;">${requestData.timeZone || '—'}</span></p>
        <p><strong style="color: #1a1f2e;">Time Slot:</strong> <span style="color: #6c757d;">${requestData.timeSlot || '—'}</span></p>
      `;
      if (requestData.meetingLink) {
        body += `<p><strong style="color: #1a1f2e;">Join meeting:</strong> <a href="${requestData.meetingLink}" target="_blank">${requestData.meetingLink}</a></p><p style="color: #6c757d; font-size: 0.9em;">Google Calendar invites include a 5-minute reminder. Zoom sends its own reminder to participants.</p>`;
      }
    }
    if (requestData.attachmentUrl) {
      body += `<p><strong style="color: #1a1f2e;">Attachment:</strong> <a href="${requestData.attachmentUrl}" target="_blank">View document</a></p>`;
    }
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: `Query from Subcategory Admin: ${requestType} - ${categoryName}`,
      html: `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;}.container{max-width:600px;margin:0 auto;padding:20px;}.header{background:#1a1f2e;color:white;padding:20px;text-align:center;}.content{background:#f9f9f9;padding:30px;}.footer{text-align:center;padding:20px;color:#6c757d;font-size:12px;}</style></head><body><div class="container"><div class="header"><h1>New Query from Subcategory Admin</h1></div><div class="content">${body}</div><div class="footer"><p>&copy; ${new Date().getFullYear()} SemBuzz.</p></div></div></body></html>`,
    };
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
      await this.transporter.sendMail(mailOptions);
    } catch (e: any) {
      console.error('[EmailService] Failed to send subcategory admin query to category admin:', e);
      throw e;
    }
  }

  /** Category admin replied → email subcategory admin */
  async sendReplyToSubCategoryAdmin(
    subCategoryAdminEmail: string,
    subCategoryAdminName: string,
    categoryName: string,
    queryType: string,
    replyMessage: string,
  ) {
    const typeLabels: Record<string, string> = { custom_message: 'Custom Message', schedule_meeting: 'Schedule a Meeting' };
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: subCategoryAdminEmail,
      subject: `Reply to your query - ${typeLabels[queryType] || queryType}`,
      html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:20px;"><p>Dear ${subCategoryAdminName},</p><p>You have received a reply regarding your query (${typeLabels[queryType] || queryType}) for <strong>${categoryName}</strong>.</p><div style="background:#f8f9fa;padding:15px;border-radius:4px;margin:15px 0;"><p style="margin:0;white-space:pre-wrap;">${replyMessage}</p></div><p>Best regards,<br>SemBuzz Team</p></body></html>`,
    };
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
      await this.transporter.sendMail(mailOptions);
    } catch (e: any) {
      console.error('[EmailService] Failed to send reply to subcategory admin:', e);
      throw e;
    }
  }

  /** Category admin raised query → notify school admin(s) */
  async sendCategoryAdminQueryToSchoolAdmin(
    toEmail: string,
    categoryAdminName: string,
    categoryAdminEmail: string,
    schoolName: string,
    categoryName: string,
    requestData: {
      type: string;
      description?: string;
      meetingType?: string;
      timeZone?: string;
      timeSlot?: string;
      attachmentUrl?: string;
      meetingLink?: string;
    },
  ) {
    const typeLabels: Record<string, string> = { custom_message: 'Custom Message', schedule_meeting: 'Schedule a Meeting' };
    const requestType = typeLabels[requestData.type] || requestData.type;
    let body = `
      <p><strong style="color: #1a1f2e;">Request Type:</strong> <span style="color: #6c757d;">${requestType}</span></p>
      <p><strong style="color: #1a1f2e;">From:</strong> <span style="color: #6c757d;">${categoryAdminName} (${categoryAdminEmail})</span></p>
      <p><strong style="color: #1a1f2e;">School / Category:</strong> <span style="color: #6c757d;">${schoolName} / ${categoryName}</span></p>
    `;
    if (requestData.description) {
      body += `<p><strong style="color: #1a1f2e;">Message:</strong></p><p style="color: #6c757d; background-color: #f8f9fa; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${requestData.description}</p>`;
    }
    if (requestData.type === 'schedule_meeting') {
      body += `<p><strong>Meeting:</strong> ${requestData.meetingType === 'google_meet' ? 'Google Meet' : requestData.meetingType === 'zoom' ? 'Zoom' : '—'}</p><p><strong>Time Zone:</strong> ${requestData.timeZone || '—'}</p><p><strong>Time Slot:</strong> ${requestData.timeSlot || '—'}</p>`;
      if (requestData.meetingLink) {
        body += `<p><strong style="color: #1a1f2e;">Join meeting:</strong> <a href="${requestData.meetingLink}" target="_blank">${requestData.meetingLink}</a></p><p style="color: #6c757d; font-size: 0.9em;">Google Calendar invites include a 5-minute reminder. Zoom sends its own reminder to participants.</p>`;
      }
    }
    if (requestData.attachmentUrl) {
      body += `<p><strong>Attachment:</strong> <a href="${requestData.attachmentUrl}" target="_blank">View document</a></p>`;
    }
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: `Query from Category Admin: ${requestType} - ${schoolName}`,
      html: `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;}.container{max-width:600px;margin:0 auto;padding:20px;}.header{background:#1a1f2e;color:white;padding:20px;text-align:center;}.content{background:#f9f9f9;padding:30px;}.footer{text-align:center;padding:20px;color:#6c757d;font-size:12px;}</style></head><body><div class="container"><div class="header"><h1>New Query from Category Admin</h1></div><div class="content">${body}</div><div class="footer"><p>&copy; ${new Date().getFullYear()} SemBuzz.</p></div></div></body></html>`,
    };
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
      await this.transporter.sendMail(mailOptions);
    } catch (e: any) {
      console.error('[EmailService] Failed to send category admin query to school admin:', e);
      throw e;
    }
  }

  /** School admin replied → email category admin */
  async sendReplyToCategoryAdmin(
    categoryAdminEmail: string,
    categoryAdminName: string,
    schoolName: string,
    queryType: string,
    replyMessage: string,
  ) {
    const typeLabels: Record<string, string> = { custom_message: 'Custom Message', schedule_meeting: 'Schedule a Meeting' };
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: categoryAdminEmail,
      subject: `Reply to your query - ${typeLabels[queryType] || queryType}`,
      html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:20px;"><p>Dear ${categoryAdminName},</p><p>You have received a reply regarding your query (${typeLabels[queryType] || queryType}) for <strong>${schoolName}</strong>.</p><div style="background:#f8f9fa;padding:15px;border-radius:4px;margin:15px 0;"><p style="margin:0;white-space:pre-wrap;">${replyMessage}</p></div><p>Best regards,<br>SemBuzz Team</p></body></html>`,
    };
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
      await this.transporter.sendMail(mailOptions);
    } catch (e: any) {
      console.error('[EmailService] Failed to send reply to category admin:', e);
      throw e;
    }
  }

  async sendQueryReply(
    adminEmail: string,
    adminName: string,
    schoolName: string,
    queryType: string,
    replyMessage: string,
  ) {
    const queryTypeLabels: Record<string, string> = {
      'dev_support': 'Dev Support Help',
      'features_not_working': 'Features Not Working',
      'schedule_meeting': 'Schedule a Meeting',
      'custom_message': 'Custom Message',
    };

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: `Reply to your query - ${queryTypeLabels[queryType] || queryType}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .message-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Query Reply</h1>
            </div>
            <div class="content">
              <p>Dear ${adminName},</p>
              <p>Thank you for contacting us regarding your query: <strong>${queryTypeLabels[queryType] || queryType}</strong> for <strong>${schoolName}</strong>.</p>
              
              <div class="message-box">
                <p style="margin: 0; white-space: pre-wrap;">${replyMessage}</p>
              </div>
              
              <p>If you have any further questions, please don't hesitate to reach out.</p>
              <p>Best regards,<br>SemBuzz Support Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[EmailService] ❌ SMTP credentials not configured!');
        return;
      }
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] ✅ Query reply email sent! Message ID: ${info.messageId}`);
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send query reply email:', error);
      throw error;
    }
  }

  /** Category admin send follow-up on their query raised to super admin */
  async sendCategoryAdminFollowUpToSuperAdmin(
    superAdminEmails: string[],
    categoryAdminName: string,
    categoryAdminEmail: string,
    queryType: string,
    followUpMessage: string,
  ) {
    const typeLabels: Record<string, string> = {
      custom_message: 'Custom Message',
      schedule_meeting: 'Schedule a Meeting',
    };
    const label = typeLabels[queryType] || queryType;
    const to = superAdminEmails.length > 0 ? superAdminEmails.join(', ') : (process.env.SUPPORT_EMAIL || process.env.SMTP_USER);
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Follow-up: Category Admin query - ${label}`,
      html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:20px;"><p>Category Admin <strong>${categoryAdminName}</strong> (${categoryAdminEmail}) sent a follow-up regarding their query: <strong>${label}</strong>.</p><div style="background:#f8f9fa;padding:15px;border-radius:4px;margin:15px 0;"><p style="margin:0;white-space:pre-wrap;">${followUpMessage}</p></div><p>Best regards,<br>SemBuzz</p></body></html>`,
    };
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
      await this.transporter.sendMail(mailOptions);
    } catch (e: any) {
      console.error('[EmailService] Failed to send category admin follow-up to super admin:', e);
      throw e;
    }
  }

  async sendDeveloperQueryReply(
    developerEmail: string,
    superAdminName: string,
    queryType: string,
    replyMessage: string,
  ) {
    const queryTypeLabels: Record<string, string> = {
      'raise_issue': 'Raise an Issue',
      'integrate_feature': 'Integrate New Feature',
      'ui_change': 'UI Change Request',
      'upscale_platform': 'Upscale Platform',
      'custom_message': 'Custom Message',
      'schedule_meeting': 'Schedule Meeting',
    };

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: developerEmail,
      subject: `Reply to query: ${queryTypeLabels[queryType] || queryType} - SemBuzz`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .message-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Query Reply from SemBuzz</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You have received a reply from <strong>${superAdminName}</strong> regarding the query: <strong>${queryTypeLabels[queryType] || queryType}</strong>.</p>
              
              <div class="message-box">
                <p style="margin: 0; white-space: pre-wrap;">${replyMessage}</p>
              </div>
              
              <p>Best regards,<br>SemBuzz Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[EmailService] ❌ SMTP credentials not configured!');
        return;
      }
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] ✅ Developer query reply email sent! Message ID: ${info.messageId}`);
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send developer query reply email:', error);
      throw error;
    }
  }

  async sendCategoryAdminCategoriesUpdatedEmail(
    adminEmail: string,
    adminName: string,
    schoolName: string,
    addedCategories: string[],
    removedCategories: string[],
  ) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: 'SemBuzz - Your Category Access Has Been Updated',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .section { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a1f2e; }
            .added { border-left-color: #28a745; }
            .removed { border-left-color: #dc3545; }
            .button { display: inline-block; padding: 12px 30px; background-color: #1a1f2e; color: white; text-decoration: none; border-radius: 50px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
            ul { margin: 10px 0; padding-left: 20px; }
            li { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Category Access Updated</h1>
            </div>
            <div class="content">
              <p>Dear ${adminName},</p>
              
              <p>Your category access has been updated on SemBuzz. Please review the changes below:</p>
              
              ${addedCategories.length > 0 ? `
                <div class="section added">
                  <h3 style="margin-top: 0; color: #28a745;">✅ Categories Added</h3>
                  <ul>
                    ${addedCategories.map(cat => `<li>${cat}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              
              ${removedCategories.length > 0 ? `
                <div class="section removed">
                  <h3 style="margin-top: 0; color: #dc3545;">❌ Categories Removed</h3>
                  <ul>
                    ${removedCategories.map(cat => `<li>${cat}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              
              <p style="margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/category-admin/dashboard" class="button">View Dashboard</a>
              </p>
              
              <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                If you have any questions, please contact your school administrator.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[EmailService] ❌ SMTP credentials not configured!');
        return;
      }

      const info = await this.transporter.sendMail(mailOptions);
      console.log('[EmailService] ✅ Category admin categories updated email sent successfully:', {
        to: adminEmail,
        messageId: info.messageId,
      });
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send category admin categories updated email:', error);
      throw error;
    }
  }

  /**
   * Send contact form submission to support (and optional auto-reply to user).
   * Uses same Hostinger SMTP as other emails.
   */
  async sendContactFormSubmission(data: {
    firstName: string;
    lastName: string;
    email: string;
    intent: string;
    message: string;
    query?: string;
  }) {
    const intentLabels: Record<string, string> = {
      '': 'Choose...',
      book_slot: 'Book slot',
      raise_query: 'Raise query',
      need_support: 'Need support',
    };
    const intentLabel = intentLabels[data.intent as keyof typeof intentLabels] || data.intent;

    const supportEmail = process.env.CONTACT_EMAIL || process.env.SUPPORT_EMAIL || 'contact@sdmlllc.com';
    const queryBlock =
      data.query && data.query.trim()
        ? `<div class="field"><span class="label">Query</span><div class="value message-box">${this.escapeHtml(data.query.trim())}</div></div>`
        : '';
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: supportEmail,
      subject: `SemBuzz Contact: ${intentLabel} - from ${data.firstName} ${data.lastName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .field { margin: 12px 0; }
            .label { font-weight: 600; color: #1a1f2e; }
            .value { color: #495057; background: white; padding: 10px 14px; border-radius: 6px; margin-top: 4px; }
            .message-box { white-space: pre-wrap; }
            .footer { text-align: center; margin-top: 24px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>Contact form submission</h1></div>
            <div class="content">
              <div class="field"><span class="label">First name</span><div class="value">${this.escapeHtml(data.firstName)}</div></div>
              <div class="field"><span class="label">Last name</span><div class="value">${this.escapeHtml(data.lastName)}</div></div>
              <div class="field"><span class="label">Email</span><div class="value">${this.escapeHtml(data.email)}</div></div>
              <div class="field"><span class="label">I want to</span><div class="value">${this.escapeHtml(intentLabel)}</div></div>
              ${queryBlock}
              <div class="field"><span class="label">Message</span><div class="value message-box">${this.escapeHtml(data.message)}</div></div>
            </div>
            <div class="footer"><p>&copy; ${new Date().getFullYear()} SemBuzz. Sent via contact form.</p></div>
          </div>
        </body>
        </html>
      `,
    };

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('[EmailService] SMTP not configured. Contact form submission not sent. Data:', data);
      return;
    }
    try {
      await this.transporter.sendMail(mailOptions);
      console.log('[EmailService] Contact form email sent to', supportEmail);
    } catch (error: any) {
      console.error('[EmailService] Failed to send contact form email:', error?.message || error);
      throw error;
    }

    // Auto-reply to user
    try {
      await this.sendContactFormAutoReply(data.email, data.firstName);
    } catch (e: any) {
      console.warn('[EmailService] Contact auto-reply failed (non-fatal):', e?.message);
    }
  }

  private escapeHtml(text: string): string {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async sendContactFormAutoReply(toEmail: string, firstName: string) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: "We've received your message - SemBuzz",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 24px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>Thank you for reaching out</h1></div>
            <div class="content">
              <p>Hi ${this.escapeHtml(firstName)},</p>
              <p>We've received your message and will get back to you as soon as possible.</p>
              <p>Best regards,<br>The SemBuzz Team</p>
            </div>
            <div class="footer"><p>&copy; ${new Date().getFullYear()} SemBuzz.</p></div>
          </div>
        </body>
        </html>
      `,
    };
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
    await this.transporter.sendMail(mailOptions);
  }

  async sendSubCategoryAdminSubCategoriesUpdatedEmail(
    adminEmail: string,
    adminName: string,
    schoolName: string,
    categoryName: string,
    addedSubCategories: string[],
    removedSubCategories: string[],
  ) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: 'SemBuzz - Your Subcategory Access Has Been Updated',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1f2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .section { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a1f2e; }
            .added { border-left-color: #28a745; }
            .removed { border-left-color: #dc3545; }
            .button { display: inline-block; padding: 12px 30px; background-color: #1a1f2e; color: white; text-decoration: none; border-radius: 50px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
            ul { margin: 10px 0; padding-left: 20px; }
            li { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Subcategory Access Updated</h1>
            </div>
            <div class="content">
              <p>Dear ${adminName},</p>
              
              <p>Your subcategory access has been updated on SemBuzz. Please review the changes below:</p>
              
              <div class="section">
                <h3 style="margin-top: 0; color: #1a1f2e;">Category: ${categoryName}</h3>
              </div>
              
              ${addedSubCategories.length > 0 ? `
                <div class="section added">
                  <h3 style="margin-top: 0; color: #28a745;">✅ Subcategories Added</h3>
                  <ul>
                    ${addedSubCategories.map(sub => `<li>${sub}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              
              ${removedSubCategories.length > 0 ? `
                <div class="section removed">
                  <h3 style="margin-top: 0; color: #dc3545;">❌ Subcategories Removed</h3>
                  <ul>
                    ${removedSubCategories.map(sub => `<li>${sub}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              
              <p style="margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/subcategory-admin/dashboard" class="button">View Dashboard</a>
              </p>
              
              <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                If you have any questions, please contact your category administrator.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SemBuzz. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[EmailService] ❌ SMTP credentials not configured!');
        return;
      }

      const info = await this.transporter.sendMail(mailOptions);
      console.log('[EmailService] ✅ Subcategory admin subcategories updated email sent successfully:', {
        to: adminEmail,
        messageId: info.messageId,
      });
    } catch (error: any) {
      console.error('[EmailService] ❌ Failed to send subcategory admin subcategories updated email:', error);
      throw error;
    }
  }
}
