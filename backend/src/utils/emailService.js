const nodemailer = require('nodemailer');
const prisma = require('../config/db');

/**
 * Get SMTP transporter from system settings
 */
const getTransporter = async () => {
    try {
        const settings = await prisma.systemSetting.findUnique({
            where: { id: 1 }
        });

        console.log('SMTP Settings from DB:', {
            smtpHost: settings?.smtpHost,
            smtpPort: settings?.smtpPort,
            smtpUser: settings?.smtpUser,
            hasPassword: !!settings?.smtpPassword,
            smtpFromEmail: settings?.smtpFromEmail,
            smtpFromName: settings?.smtpFromName
        });

        if (!settings || !settings.smtpHost || !settings.smtpUser) {
            console.warn('SMTP not configured. Email will not be sent.');
            return null;
        }


        const transporter = nodemailer.createTransport({
            host: settings.smtpHost,
            port: settings.smtpPort || 587,
            secure: settings.smtpPort === 465, // true for 465, false for other ports
            auth: {
                user: settings.smtpUser,
                pass: settings.smtpPassword
            }
        });

        return transporter;
    } catch (error) {
        console.error('Error creating email transporter:', error);
        return null;
    }
};

/**
 * Send payment receipt email
 */
const sendPaymentReceipt = async (userEmail, userName, plan, amount, reference) => {
    try {
        const transporter = await getTransporter();
        if (!transporter) {
            console.log('Skipping email send - SMTP not configured');
            return false;
        }

        const settings = await prisma.systemSetting.findUnique({
            where: { id: 1 }
        });

        const fromEmail = settings.smtpFromEmail || settings.smtpUser;
        const fromName = settings.smtpFromName || 'TeachAide AI';

        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: userEmail,
            subject: `Payment Receipt - ${plan} Plan Subscription`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .receipt-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                        .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                        .receipt-row:last-child { border-bottom: none; }
                        .label { color: #6b7280; }
                        .value { font-weight: bold; color: #111827; }
                        .success-badge { background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; margin: 10px 0; }
                        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
                        .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Payment Successful!</h1>
                            <p>Thank you for subscribing to TeachAide AI</p>
                        </div>
                        <div class="content">
                            <p>Dear ${userName},</p>
                            <p>Your payment has been successfully processed. Welcome to the <strong>${plan} Plan</strong>!</p>
                            
                            <div class="receipt-box">
                                <h3>Payment Receipt</h3>
                                <div class="receipt-row">
                                    <span class="label">Plan:</span>
                                    <span class="value">${plan}</span>
                                </div>
                                <div class="receipt-row">
                                    <span class="label">Amount:</span>
                                    <span class="value">₦${amount.toLocaleString()}</span>
                                </div>
                                <div class="receipt-row">
                                    <span class="label">Reference:</span>
                                    <span class="value">${reference}</span>
                                </div>
                                <div class="receipt-row">
                                    <span class="label">Date:</span>
                                    <span class="value">${new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <div class="receipt-row">
                                    <span class="label">Status:</span>
                                    <span class="value"><span class="success-badge">✓ Confirmed</span></span>
                                </div>
                            </div>

                            <p>You now have access to all ${plan} plan features including:</p>
                            <ul>
                                ${plan === 'Pro' ? `
                                    <li>Unlimited Lesson Notes</li>
                                    <li>All Subjects</li>
                                    <li>PDF & DOC Export</li>
                                    <li>Save History</li>
                                ` : `
                                    <li>Multi-Teacher Access</li>
                                    <li>Admin Dashboard</li>
                                    <li>Centralized Management</li>
                                `}
                            </ul>

                            <center>
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">
                                    Go to Dashboard
                                </a>
                            </center>

                            <p>If you have any questions, feel free to contact our support team.</p>
                            
                            <p>Best regards,<br><strong>The TeachAide AI Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>This is an automated email. Please do not reply.</p>
                            <p>&copy; ${new Date().getFullYear()} TeachAide AI. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Receipt email sent to ${userEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending payment receipt:', error);
        return false;
    }
};

/**
 * Send teacher invitation email
 */
const sendTeacherInvitation = async (teacherEmail, teacherName, schoolName, tempPassword, schoolAdminName) => {
    try {
        const transporter = await getTransporter();
        if (!transporter) {
            console.log('Skipping invitation email - SMTP not configured');
            return false;
        }

        const settings = await prisma.systemSetting.findUnique({
            where: { id: 1 }
        });

        const fromEmail = settings.smtpFromEmail || settings.smtpUser;
        const fromName = settings.smtpFromName || 'TeachAide AI';

        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: teacherEmail,
            subject: `Welcome to ${schoolName} - TeachAide Invitation`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .credentials { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
                        .password { font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; font-family: monospace; }
                        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎓 Welcome to TeachAide!</h1>
                        </div>
                        <div class="content">
                            <p>Hello <strong>${teacherName}</strong>,</p>
                            
                            <p>Great news! You've been invited to join <strong>${schoolName}</strong> on TeachAide by ${schoolAdminName}.</p>
                            
                            <p>TeachAide is a powerful platform that helps teachers create professional lesson notes, assessments, and manage their classes efficiently.</p>
                            
                            <div class="credentials">
                                <h3>Your Login Credentials</h3>
                                <p><strong>Email:</strong> ${teacherEmail}</p>
                                <p><strong>Temporary Password:</strong></p>
                                <p class="password">${tempPassword}</p>
                            </div>
                            
                            <div class="warning">
                                <strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.
                            </div>
                            
                            <center>
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to TeachAide</a>
                            </center>
                            
                            <h3>What you can do with TeachAide:</h3>
                            <ul>
                                <li>✨ Generate professional lesson notes with AI</li>
                                <li>📝 Create assessments and quizzes</li>
                                <li>👥 Manage your classes and students</li>
                                <li>📅 Organize your timetable</li>
                                <li>💾 Save and access your notes anytime</li>
                            </ul>
                            
                            <p>If you have any questions or need assistance, feel free to reach out to your school administrator or our support team.</p>
                            
                            <p>Welcome aboard!<br>
                            <strong>The TeachAide Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message from TeachAide. Please do not reply to this email.</p>
                            <p>&copy; ${new Date().getFullYear()} TeachAide. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Teacher invitation email sent to ${teacherEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending teacher invitation email:', error);
        throw error;
    }
};

/**
 * Send test email to verify SMTP configuration
 */
const sendTestEmail = async (recipientEmail) => {
    try {
        const transporter = await getTransporter();
        if (!transporter) {
            throw new Error('SMTP not configured. Please configure SMTP settings first.');
        }

        const settings = await prisma.systemSetting.findUnique({
            where: { id: 1 }
        });

        const fromEmail = settings.smtpFromEmail || settings.smtpUser;
        const fromName = settings.smtpFromName || 'TeachAide AI';

        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: recipientEmail,
            subject: 'SMTP Test Email - TeachAide',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✅ SMTP Test Successful!</h1>
                        </div>
                        <div class="content">
                            <div class="success-box">
                                <h3>🎉 Congratulations!</h3>
                                <p>Your SMTP configuration is working correctly.</p>
                            </div>
                            
                            <p>This is a test email from TeachAide to verify your email settings.</p>
                            
                            <h3>Configuration Details:</h3>
                            <ul>
                                <li><strong>SMTP Host:</strong> ${settings.smtpHost}</li>
                                <li><strong>SMTP Port:</strong> ${settings.smtpPort}</li>
                                <li><strong>From Email:</strong> ${fromEmail}</li>
                                <li><strong>From Name:</strong> ${fromName}</li>
                            </ul>
                            
                            <p>You can now send emails from TeachAide, including:</p>
                            <ul>
                                <li>📧 Teacher invitations</li>
                                <li>🧾 Payment receipts</li>
                                <li>📢 Notifications</li>
                            </ul>
                            
                            <p>If you received this email, your SMTP is configured correctly!</p>
                            
                            <p>Best regards,<br>
                            <strong>The TeachAide Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>This is a test email from TeachAide.</p>
                            <p>&copy; ${new Date().getFullYear()} TeachAide. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Test email sent to ${recipientEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending test email:', error);
        throw error;
    }
};

/**
 * Send notification email when teacher is removed from school
 */
const sendTeacherRemovalNotification = async (teacherEmail, teacherName, schoolName) => {
    try {
        const transporter = await getTransporter();
        if (!transporter) {
            console.log('Skipping removal notification email - SMTP not configured');
            return false;
        }

        const settings = await prisma.systemSetting.findUnique({
            where: { id: 1 }
        });

        const fromEmail = settings.smtpFromEmail || settings.smtpUser;
        const fromName = settings.smtpFromName || 'TeachAide AI';

        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: teacherEmail,
            subject: `Account Removed from ${schoolName} - TeachAide`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .info-box { background: white; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 5px; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>⚠️ Account Removal Notice</h1>
                        </div>
                        <div class="content">
                            <p>Hello <strong>${teacherName}</strong>,</p>
                            
                            <p>We're writing to inform you that your account has been removed from <strong>${schoolName}</strong> on TeachAide.</p>
                            
                            <div class="info-box">
                                <h3>What This Means</h3>
                                <p>Your teacher account associated with ${schoolName} has been deactivated and removed from our system. You will no longer have access to:</p>
                                <ul>
                                    <li>School resources and materials</li>
                                    <li>Student data and classes</li>
                                    <li>School-specific features</li>
                                </ul>
                            </div>
                            
                            <h3>Next Steps</h3>
                            <p>If you believe this was done in error or if you have any questions about this removal, please contact your school administrator at <strong>${schoolName}</strong> for further assistance.</p>
                            
                            <p>If you would like to continue using TeachAide independently, you can create a new personal account at any time by visiting our website.</p>
                            
                            <p>Thank you for being part of the TeachAide community.</p>
                            
                            <p>Best regards,<br>
                            <strong>The TeachAide Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message from TeachAide. Please do not reply to this email.</p>
                            <p>&copy; ${new Date().getFullYear()} TeachAide. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Teacher removal notification sent to ${teacherEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending teacher removal notification:', error);
        return false; // Don't throw - removal should succeed even if email fails
    }
};

module.exports = {
    sendPaymentReceipt,
    sendTeacherInvitation,
    sendTestEmail,
    sendTeacherRemovalNotification,
    getTransporter
};
