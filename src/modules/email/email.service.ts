import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get('SMTP_HOST');
    //const smtpPort = parseInt(this.configService.get('SMTP_PORT'));
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPass = this.configService.get('SMTP_PASS');

    // Configuration for port 465 (SSL)
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: 465, //smtpPort,
      secure: true, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Verify connection
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log(' SMTP connection verified successfully');
    } catch (error) {
      this.logger.error(' SMTP connection failed:', error.message);
      this.logger.warn(
        'Email service will continue but emails may fail to send',
      );
    }
  }

  // Test connection method
  async testConnection() {
    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'SMTP connection successful',
        config: {
          host: this.configService.get('SMTP_HOST'),
          port: 465, //this.configService.get('SMTP_PORT'),
          user: this.configService.get('SMTP_USER'),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'SMTP connection failed',
        error: error.message,
        config: {
          host: this.configService.get('SMTP_HOST'),
          port: 465, //this.configService.get('SMTP_PORT'),
          user: this.configService.get('SMTP_USER'),
        },
      };
    }
  }

  async sendWelcomeEmail(email: string, name: string, tempPassword: string) {
    const mailOptions = {
      from: {
        name: 'Voter Data System',
        address:
          this.configService.get('EMAIL_FROM') ||
          this.configService.get('SMTP_USER'),
      },
      to: email,
      subject: 'Welcome to Voter Data System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.6; 
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white; 
              padding: 30px 20px; 
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content { 
              padding: 30px 20px; 
              background: #ffffff;
            }
            .credentials { 
              background: #f8f9fa;
              padding: 20px; 
              border-left: 4px solid #667eea;
              margin: 20px 0;
              border-radius: 5px;
            }
            .credentials p {
              margin: 10px 0;
              font-size: 14px;
            }
            .credentials strong {
              color: #667eea;
              font-weight: bold;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
              font-weight: bold;
            }
            .footer { 
              text-align: center; 
              padding: 20px; 
              background: #f8f9fa;
              color: #666; 
              font-size: 12px;
              border-top: 1px solid #e0e0e0;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .warning p {
              margin: 0;
              color: #856404;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Voter Data System</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Your account has been successfully created! We're excited to have you on board.</p>
              
              <div class="credentials">
                <p><strong>📧 Email:</strong> ${email}</p>
                <p><strong>🔐 Temporary Password:</strong> <code style="background: #e0e0e0; padding: 2px 6px; border-radius: 3px;">${tempPassword}</code></p>
              </div>
              
              <div class="warning">
                <p><strong>⚠️ Security Notice:</strong> Please login and change your password immediately for security purposes.</p>
              </div>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact your system administrator.</p>
              
              <p>Best regards,<br><strong>Voter Data System Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Voter Data System. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      // Plain text fallback
      text: `
        Welcome to Voter Data System
        
        Hello ${name},
        
        Your account has been successfully created.
        
        Login Credentials:
        Email: ${email}
        Temporary Password: ${tempPassword}
        
        Please login and change your password immediately for security purposes.
        
        If you have any questions, please contact your administrator.
        
        Best regards,
        Voter Data System Team
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Welcome email sent successfully to ${email}`);
      this.logger.debug(`Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`❌ Error sending email to ${email}:`, error.message);
      this.logger.error('Full error:', error);
      // Don't throw error - let registration complete even if email fails
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: {
        name: 'Voter Data System',
        address:
          this.configService.get('EMAIL_FROM') ||
          this.configService.get('SMTP_USER'),
      },
      to: email,
      subject: 'Password Reset Request - Voter Data System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: #dc3545; color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; padding: 12px 30px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>You requested a password reset for your Voter Data System account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}">${resetUrl}</a>
              </p>
              <p style="margin-top: 20px; color: #dc3545;">
                ⚠️ This link will expire in 1 hour.
              </p>
              <p>If you didn't request this password reset, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Voter Data System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Password reset email sent to ${email}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(
        `❌ Error sending password reset email:`,
        error.message,
      );
      return { success: false, error: error.message };
    }
  }

  // Test email function for debugging
  async sendTestEmail(toEmail: string) {
    const mailOptions = {
      from: {
        name: 'Voter Data System',
        address:
          this.configService.get('EMAIL_FROM') ||
          this.configService.get('SMTP_USER'),
      },
      to: toEmail,
      subject: 'Test Email from Voter Data System',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from Voter Data System.</p>
        <p>If you received this, email configuration is working correctly!</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Test email sent successfully to ${toEmail}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`❌ Error sending test email:`, error.message);
      throw error;
    }
  }
}
