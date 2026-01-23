// Email Service
// Handles sending emails for password reset, email verification, and account creation
// Uses Resend API for email delivery

const { Resend } = require('resend');
const crypto = require('crypto');

// Initialize Resend client
let resend = null;

function initializeResend() {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
        console.warn('Resend API key not configured. Set RESEND_API_KEY environment variable.');
        return null;
    }
    
    if (!resend) {
        resend = new Resend(apiKey);
    }
    
    return resend;
}

// Get the from email address (must be verified in Resend)
function getFromEmail() {
    // Use RESEND_FROM_EMAIL if set, otherwise use a default
    // IMPORTANT: This email must be verified in your Resend dashboard
    return process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
}

// Generate a secure random token
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Send password reset email
async function sendPasswordResetEmail(email, resetToken, baseUrl) {
    const client = initializeResend();
    if (!client) {
        console.error('Cannot send email: Resend API key not configured');
        return false;
    }
    
    const resetUrl = `${baseUrl}/?reset=password&token=${resetToken}`;
    
    try {
        const { data, error } = await client.emails.send({
            from: getFromEmail(),
            to: email,
            subject: 'Reset Your BudgetSensei Password',
            html: `
                <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Reset Your Password</h2>
                    <p>You requested to reset your password for your BudgetSensei account.</p>
                    <p>Click the link below to reset your password:</p>
                    <p style="margin: 20px 0;">
                        <a href="${resetUrl}" style="background-color: #ffb7ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Reset Password</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="color: #666; word-break: break-all; font-size: 12px;">${resetUrl}</p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
                    <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
                </div>
            `,
            text: `Reset Your Password\n\nClick this link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`
        });
        
        if (error) {
            console.error('Error sending password reset email:', error);
            return false;
        }
        
        console.log(`Password reset email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
}

// Send email verification email (for account creation)
async function sendVerificationEmail(email, verificationToken, baseUrl) {
    const client = initializeResend();
    if (!client) {
        console.error('Cannot send email: Resend API key not configured');
        return false;
    }
    
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;
    
    try {
        const { data, error } = await client.emails.send({
            from: getFromEmail(),
            to: email,
            subject: 'Verify Your BudgetSensei Account',
            html: `
                <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Verify Your Email Address</h2>
                    <p>Thank you for creating your BudgetSensei account!</p>
                    <p>Please click the link below to verify your email address and activate your account:</p>
                    <p style="margin: 20px 0;">
                        <a href="${verificationUrl}" style="background-color: #ffb7ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Verify Email</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="color: #666; word-break: break-all; font-size: 12px;">${verificationUrl}</p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 10 minutes.</p>
                    <p style="color: #999; font-size: 12px;">If you didn't create this account, please ignore this email.</p>
                </div>
            `,
            text: `Verify Your Email Address\n\nThank you for creating your BudgetSensei account!\n\nClick this link to verify your email: ${verificationUrl}\n\nThis link will expire in 10 minutes.\n\nIf you didn't create this account, please ignore this email.`
        });
        
        if (error) {
            console.error('Error sending verification email:', error);
            // Log more details for debugging
            if (error.message) {
                console.error('  Error message:', error.message);
            }
            if (error.statusCode) {
                console.error('  Status code:', error.statusCode);
            }
            return false;
        }
        
        console.log(`Verification email sent to ${email}`);
        if (data && data.id) {
            console.log(`  Email ID: ${data.id}`);
        }
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        return false;
    }
}

// Send welcome email for new account creation
async function sendWelcomeEmail(email, username, baseUrl) {
    const client = initializeResend();
    if (!client) {
        console.error('Cannot send email: Resend API key not configured');
        return false;
    }
    
    try {
        const { data, error } = await client.emails.send({
            from: getFromEmail(),
            to: email,
            subject: 'Welcome to BudgetSensei!',
            html: `
                <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Welcome to BudgetSensei, ${username}!</h2>
                    <p>Thank you for creating your account. You're all set to start tracking your budget and managing your finances.</p>
                    <p style="margin: 20px 0;">
                        <a href="${baseUrl}" style="background-color: #ffb7ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Get Started</a>
                    </p>
                    <p style="color: #666; font-size: 14px;">Here are some things you can do:</p>
                    <ul style="color: #666; font-size: 14px;">
                        <li>Add your income and expense categories</li>
                        <li>Set up payment methods</li>
                        <li>Start tracking your transactions</li>
                        <li>Set budgets and monitor your spending</li>
                    </ul>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">If you have any questions, feel free to reach out to our support team.</p>
                </div>
            `,
            text: `Welcome to BudgetSensei, ${username}!\n\nThank you for creating your account. You're all set to start tracking your budget and managing your finances.\n\nVisit ${baseUrl} to get started.\n\nIf you have any questions, feel free to reach out to our support team.`
        });
        
        if (error) {
            console.error('Error sending welcome email:', error);
            return false;
        }
        
        console.log(`Welcome email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending welcome email:', error);
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
    sendWelcomeEmail,
    isValidEmail
};
