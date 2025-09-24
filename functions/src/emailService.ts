import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import * as functions from 'firebase-functions';

const OAuth2 = google.auth.OAuth2;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface RegistrationEmailData {
  firstName: string;
  lastName: string;
  occupation: string;
  registrationToken: string;
  registrationLink: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Check for Gmail App Password (simpler approach)
      const gmailPassword = functions.config().gmail?.app_password || process.env.GMAIL_APP_PASSWORD;
      
      if (gmailPassword) {
        console.log('📧 Using Gmail App Password authentication');
        // Simple Gmail App Password approach
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'hashimosman@synergyhomecare.com',
            pass: gmailPassword
          }
        });
        
        this.initialized = true;
        console.log('✅ Gmail App Password service initialized');
        return;
      }

      // Fallback to OAuth2 if app password not available
      const clientId = process.env.GMAIL_CLIENT_ID;
      const clientSecret = process.env.GMAIL_CLIENT_SECRET;
      const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

      if (clientId && clientSecret && refreshToken) {
        console.log('📧 Using Gmail OAuth2 authentication');
        const oauth2Client = new OAuth2(
          clientId,
          clientSecret,
          'https://developers.google.com/oauthplayground'
        );

        oauth2Client.setCredentials({
          refresh_token: refreshToken,
        });

        const accessToken = await oauth2Client.getAccessToken();

        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: 'hashimosman@synergyhomecare.com',
            clientId,
            clientSecret,
            refreshToken,
            accessToken: accessToken.token as string,
          },
        });
        
        this.initialized = true;
        console.log('✅ Gmail OAuth2 service initialized');
        return;
      }

      // No email configuration found - simulation mode
      console.log('📧 No email configuration found - using simulation mode');
      console.log('⚠️ Set GMAIL_APP_PASSWORD for simple Gmail sending');
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      throw new Error('Email service initialization failed');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    // If no transporter (no Gmail config), simulate email for testing
    if (!this.transporter) {
      console.log('📧 SIMULATED EMAIL (Gmail not configured):');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('✅ Email simulation successful - would send in production');
      return true;
    }

    try {
      const mailOptions = {
        from: options.from || '"SynergyHomeCare" <hashimosman@synergyhomecare.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  generateRegistrationEmail(data: RegistrationEmailData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to SynergyHomeCare - Complete Your Registration</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .welcome-message {
            font-size: 18px;
            color: #495057;
            margin-bottom: 30px;
        }
        .content {
            margin-bottom: 30px;
        }
        .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
            transition: background-color 0.3s;
        }
        .cta-button:hover {
            background-color: #1d4ed8;
        }
        .info-section {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            font-size: 14px;
            color: #6c757d;
            text-align: center;
        }
        .highlight {
            background-color: #fff3cd;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏠 SynergyHomeCare</div>
            <div class="welcome-message">Welcome to Our CareConnect Platform!</div>
        </div>

        <div class="content">
            <h2>Hello ${data.firstName} ${data.lastName}! 👋</h2>
            
            <p>We're excited to welcome you to the SynergyHomeCare team as a <strong>${data.occupation}</strong>! Your temporary access has been converted to a full account, and you now have access to all our resources and tools.</p>

            <div class="highlight">
                <strong>🎉 Your account is ready!</strong> Complete your registration to access all features of CareConnect.
            </div>

            <p>To complete your registration and set up your full account, please click the button below:</p>

            <div style="text-align: center;">
                <a href="${data.registrationLink}" class="cta-button">
                    Complete Registration →
                </a>
            </div>

            <div class="info-section">
                <h3>📋 What happens next?</h3>
                <ul>
                    <li><strong>Complete Registration:</strong> Set up your password and verify your email</li>
                    <li><strong>Account Approval:</strong> Your account will be reviewed and approved by our admin team</li>
                    <li><strong>Full Access:</strong> Once approved, you'll have access to all CareConnect features including:
                        <ul style="margin-top: 10px;">
                            <li>📚 Training materials and resources</li>
                            <li>📋 Document management and forms</li>
                            <li>📅 Calendar and scheduling</li>
                            <li>💬 Q&A community</li>
                            <li>📢 Company updates and announcements</li>
                        </ul>
                    </li>
                </ul>
            </div>

            <div class="highlight">
                <strong>⏰ Important:</strong> This registration link is valid for 7 days. Please complete your registration as soon as possible.
            </div>

            <p>If you have any questions or need assistance, please don't hesitate to reach out to our team.</p>
        </div>

        <div class="footer">
            <p><strong>SynergyHomeCare CareConnect Platform</strong></p>
            <p>This email was sent to you because you were added as a new team member. If you received this in error, please contact our support team.</p>
            <p style="margin-top: 20px; font-size: 12px;">
                Registration Token: <code>${data.registrationToken}</code><br>
                <em>Keep this token safe - you may need it during registration.</em>
            </p>
        </div>
    </div>
</body>
</html>
    `;
  }

  async sendRegistrationEmail(
    email: string,
    data: RegistrationEmailData
  ): Promise<boolean> {
    const subject = `Welcome to SynergyHomeCare - Complete Your Registration`;
    const html = this.generateRegistrationEmail(data);

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }
}

export const emailService = new EmailService();
