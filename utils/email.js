// Email Service
// Handles sending emails for password reset and email verification

const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create reusable transporter (configure based on your email provider)
// For development, you can use Gmail, SendGrid, or a service like Mailtrap
// For production, use a proper SMTP service
function createTransporter() {
    // Check for environment variables for email configuration
    // If not set, use a default configuration (you'll need to configure this)
    const emailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
        }
    };
    
    // If no email credentials are configured, return null (emails won't be sent)
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        console.warn('Email service not configured. Set SMTP_USER and SMTP_PASS environment variables.');
        return null;
    }
    
    return nodemailer.createTransport(emailConfig);
}

// Generate a secure random token
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Send password reset email
async function sendPasswordResetEmail(email, resetToken, baseUrl) {
    const transporter = createTransporter();
    if (!transporter) {
        console.error('Cannot send email: Email service not configured');
        return false;
    }
    
    const resetUrl = `${baseUrl}/?token=${resetToken}`;
    
    const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Reset Your BudgetSensei Password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Reset Your Password</h2>
                <p>You requested to reset your password for your BudgetSensei account.</p>
                <p>Click the link below to reset your password:</p>
                <p style="margin: 20px 0;">
                    <a href="${resetUrl}" style="background-color: #ffb7ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #666; word-break: break-all;">${resetUrl}</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
                <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
            </div>
        `,
        text: `Reset Your Password\n\nClick this link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
}

// Send email verification email
async function sendVerificationEmail(email, verificationToken, baseUrl) {
    const transporter = createTransporter();
    if (!transporter) {
        console.error('Cannot send email: Email service not configured');
        return false;
    }
    
    const verificationUrl = `${baseUrl}/?verify=email&token=${verificationToken}`;
    
    const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Verify Your BudgetSensei Email',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Verify Your Email Address</h2>
                <p>Thank you for adding an email address to your BudgetSensei account.</p>
                <p>Please click the link below to verify your email address:</p>
                <p style="margin: 20px 0;">
                    <a href="${verificationUrl}" style="background-color: #ffb7ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Verify Email</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
                <p style="color: #999; font-size: 12px;">If you didn't add this email, please ignore this email.</p>
            </div>
        `,
        text: `Verify Your Email Address\n\nClick this link to verify your email: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't add this email, please ignore this email.`
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        return false;
    }
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

module.exports = {
    generateToken,
    sendPasswordResetEmail,
    sendVerificationEmail,
    isValidEmail
};
