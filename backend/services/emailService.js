// backend/services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        // Check if email credentials exist in process.env
        this.emailUser = process.env.EMAIL_USER;
        this.emailPass = process.env.EMAIL_PASS;
        
        console.log('📧 Email service constructor:');
        console.log('  USER:', this.emailUser ? '✅ Present' : '❌ Missing');
        console.log('  PASS:', this.emailPass ? '✅ Present' : '❌ Missing');
        
        if (!this.emailUser || !this.emailPass) {
            console.error('❌ Email credentials missing in process.env');
            console.log('📝 Current process.env keys:', Object.keys(process.env).filter(k => k.includes('EMAIL')));
            this.transporter = null;
            return;
        }

        console.log(`📧 Configuring email service with: ${this.emailUser}`);
        
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.emailUser,
                pass: this.emailPass
            },
            debug: true,
            logger: true
        });

        // Verify connection
        this.transporter.verify((error, success) => {
            if (error) {
                console.error('❌ Email configuration error:', error.message);
                if (error.message.includes('Application-specific password required')) {
                    console.log('🔐 You need to use an App Password, not your regular Gmail password');
                    console.log('📝 Get one at: https://myaccount.google.com/apppasswords');
                }
            } else {
                console.log('✅ Email server is ready to send messages');
            }
        });
    }

    async sendVerificationEmail(to, name, token) {
        if (!this.transporter) {
            console.log(`📧 DEVELOPMENT MODE: Would send email to: ${to}`);
            console.log(`🔗 Verification link: http://localhost:${process.env.PORT}/api/auth/verify-email?token=${token}`);
            console.log(`📝 To enable real emails, add valid EMAIL_USER and EMAIL_PASS to .env file`);
            console.log(`📧 Current EMAIL_USER: ${this.emailUser ? '✅ Set' : '❌ Not set'}`);
            console.log(`📧 Current EMAIL_PASS: ${this.emailPass ? '✅ Set' : '❌ Not set'}`);
            return { 
                success: true, 
                message: 'Development mode - email logged to console',
                verificationLink: `http://localhost:${process.env.PORT}/api/auth/verify-email?token=${token}`
            };
        }

        const verificationLink = `http://localhost:${process.env.PORT}/api/auth/verify-email?token=${token}`;
        
        console.log(`📧 Sending real email to: ${to}`);
        
        const mailOptions = {
            from: `"Your App" <${this.emailUser}>`,
            to: to,
            subject: 'Verify Your Email Address',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4CAF50;">Welcome ${name}!</h2>
                    <p>Click the link below to verify your email:</p>
                    <a href="${verificationLink}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                    <p>Or copy: ${verificationLink}</p>
                </div>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email sent! Message ID:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Email send error:', error.message);
            console.log(`🔗 Fallback link: ${verificationLink}`);
            return { success: false, error: error.message, fallbackLink: verificationLink };
        }
    }
}

module.exports = new EmailService();