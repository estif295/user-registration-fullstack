// services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        // Check if email credentials exist
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ Email credentials missing in .env file');
            return;
        }

        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            debug: true, // Enable debug logs
            logger: true // Log to console
        });

        // Verify connection configuration
        this.transporter.verify((error, success) => {
            if (error) {
                console.error('❌ Email configuration error:', error);
            } else {
                console.log('✅ Email server is ready to send messages');
            }
        });
    }

    async sendVerificationEmail(to, name, token) {
        // Check if transporter is configured
        if (!this.transporter) {
            console.error('❌ Email transporter not configured');
            return { 
                success: false, 
                error: 'Email service not configured' 
            };
        }

        const verificationLink = `http://localhost:${process.env.PORT}/api/auth/verify-email?token=${token}`;
        
        console.log(`📧 Attempting to send email to: ${to}`);
        console.log(`🔗 Verification link: ${verificationLink}`);
        
        const mailOptions = {
            from: `"Your App" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: 'Verify Your Email Address',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #4CAF50; margin: 0;">Welcome!</h1>
                        </div>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #333;">Hello ${name},</p>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #333;">
                            Thank you for registering. Please verify your email address by clicking the button below:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationLink}" 
                               style="background-color: #4CAF50; color: white; padding: 14px 30px; 
                                      text-decoration: none; border-radius: 5px; font-size: 18px; 
                                      display: inline-block; font-weight: bold;">
                                Verify Email Address
                            </a>
                        </div>
                        
                        <p style="font-size: 14px; line-height: 1.6; color: #666;">
                            Or copy and paste this link into your browser:<br>
                            <span style="color: #4CAF50; word-break: break-all;">${verificationLink}</span>
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <p style="font-size: 14px; line-height: 1.6; color: #999; text-align: center;">
                            This link will expire in 24 hours.<br>
                            If you didn't create an account, please ignore this email.
                        </p>
                    </div>
                </body>
                </html>
            `
        };

        try {
            console.log('📤 Sending email...');
            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully!');
            console.log('📬 Message ID:', info.messageId);
            console.log('📨 Response:', info.response);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Failed to send email:');
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Command:', error.command);
            
            if (error.code === 'EAUTH') {
                console.error('🔐 Authentication failed - check your EMAIL_USER and EMAIL_PASS');
                console.error('📝 Make sure you used an App Password, not your regular password');
            }
            
            return { 
                success: false, 
                error: error.message,
                code: error.code
            };
        }
    }
}

module.exports = new EmailService();