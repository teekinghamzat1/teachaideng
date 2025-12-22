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

        if (!settings || !settings.smtpHost || !settings.smtpUser) {
            console.warn('SMTP not configured. Email will not be sent.');
            return null;
        }

        // Sanitize settings to remove potential hidden characters/newlines
        const host = (settings.smtpHost || '').trim().replace(/\n/g, '');
        const user = (settings.smtpUser || '').trim();
        const pass = (settings.smtpPassword || '').trim();
        const port = settings.smtpPort || 587;

        const transporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: port === 465,
            auth: {
                user: user,
                pass: pass
            },
            tls: {
                rejectUnauthorized: false
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
                            <p>Thank you for subscribing to ${settings.siteName || 'TeachAide AI'}</p>
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
                            
                            <p>Best regards,<br><strong>The ${settings.siteName || 'TeachAide AI'} Team</strong></p>
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

/**
 * Send welcome email to new user
 */
const sendWelcomeEmail = async (userEmail, userName) => {
    try {
        const transporter = await getTransporter();
        if (!transporter) return false;

        const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
        const fromEmail = settings.smtpFromEmail || settings.smtpUser;
        const fromName = settings.smtpFromName || 'TeachAide AI';

        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: userEmail,
            subject: `Welcome to ${settings.siteName || 'TeachAide AI'}! 🎓`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
                        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
                        .feature-item { margin-bottom: 15px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to TeachAide!</h1>
                            <p>Your AI-powered teaching assistant</p>
                        </div>
                        <div class="content">
                            <p>Hello <strong>${userName}</strong>,</p>
                            <p>Thank you for joining ${settings.siteName || 'TeachAide AI'}! We're thrilled to have you as part of our community of innovative educators.</p>
                            
                            <p>TeachAide is designed to help you save hours of preparation time so you can focus on what matters most: <strong>teaching</strong>.</p>
                            
                            <h3>🚀 Here's how to get started:</h3>
                            <div class="feature-item">
                                <strong>✨ Generate Lesson Notes:</strong> Create professional, high-quality lesson plans in seconds.
                            </div>
                            <div class="feature-item">
                                <strong>📝 Assessment Creator:</strong> Generate quizzes and assessments tailored to your topics.
                            </div>
                            <div class="feature-item">
                                <strong>👥 Class Management:</strong> Keep your student lists and records organized.
                            </div>

                            <center>
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">Go to your Dashboard</a>
                            </center>

                            <p>As a welcome gift, we've added <strong>2,000 free tokens</strong> to your account to help you get started!</p>

                            <p>If you have any questions or need a hand, just reply to this email. We're here to help.</p>
                            
                            <p>Happy teaching!<br><strong>The ${settings.siteName || 'TeachAide AI'} Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} TeachAide AI. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return false;
    }
};

/**
 * Send lesson note via email
 */
const sendLessonNoteEmail = async (userEmail, lessonNote) => {
    try {
        const { sanitizeObjectMarkdown } = require('./markdownUtils');
        const cleanNote = sanitizeObjectMarkdown(lessonNote);

        const transporter = await getTransporter();
        if (!transporter) {
            console.error('Failed to send lesson note: Transporter not created.');
            return false;
        }

        const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
        const fromEmail = (settings.smtpFromEmail || settings.smtpUser || '').trim();
        const fromName = (settings.smtpFromName || 'TeachAide AI').trim().replace(/["]/g, '');

        // Ensure arrays exist for mapping
        const objectives = Array.isArray(cleanNote.objectives) ? cleanNote.objectives : [];
        const evaluation = Array.isArray(cleanNote.evaluation) ? cleanNote.evaluation : [];

        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: (userEmail || '').trim(),
            subject: `Lesson Note: ${cleanNote.topic || 'Untitled'}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7f6; }
                        .container { max-width: 800px; margin: 20px auto; background: white; padding: 40px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                        .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
                        .header h1 { margin: 0; text-transform: uppercase; font-size: 24px; }
                        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; font-size: 14px; }
                        .meta-item { border-bottom: 1px solid #eee; padding: 5px 0; }
                        .label { font-weight: bold; width: 100px; display: inline-block; }
                        h3 { background: #f8fafc; padding: 5px 10px; border-left: 4px solid #000; text-transform: uppercase; font-size: 16px; margin-top: 25px; }
                        .content { white-space: pre-wrap; background: #fff; padding: 15px; border: 1px solid #f1f5f9; }
                        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #64748b; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Lesson Note</h1>
                        </div>
                        
                        <div class="meta">
                            <div class="meta-item"><span class="label">Subject:</span> ${cleanNote.subject || ''}</div>
                            <div class="meta-item"><span class="label">Class:</span> ${cleanNote.classLevel || ''}</div>
                            <div class="meta-item"><span class="label">Topic:</span> ${cleanNote.topic || ''}</div>
                            <div class="meta-item"><span class="label">Sub-topic:</span> ${cleanNote.subtopic || ''}</div>
                            <div class="meta-item"><span class="label">Duration:</span> ${cleanNote.duration || ''}</div>
                            <div class="meta-item"><span class="label">Date:</span> ${new Date().toLocaleDateString()}</div>
                        </div>

                        <h3>Behavioural Objectives</h3>
                        <ul>
                            ${objectives.map(obj => `<li>${obj}</li>`).join('')}
                        </ul>

                        <h3>Lesson Content</h3>
                        <div class="content">${cleanNote.lessonContent || ''}</div>

                        <h3>Evaluation</h3>
                        <ul>
                            ${evaluation.map(evalItem => `<li>${evalItem}</li>`).join('')}
                        </ul>

                        <h3>Assignment</h3>
                        <p>${cleanNote.assignment || ''}</p>

                        <div class="footer">
                            <p>Generated by ${settings.siteName || 'TeachAide AI'} - Empowering Educators</p>
                            <p>&copy; ${new Date().getFullYear()} ${settings.siteName || 'TeachAide AI'}</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Lesson note email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('CRITICAL ERROR in sendLessonNoteEmail:', {
            errorMessage: error.message,
            errorCode: error.code,
            errorStack: error.stack,
            fullError: error
        });
        return false;
    }
};

module.exports = {
    sendPaymentReceipt,
    sendTeacherInvitation,
    sendTestEmail,
    sendTeacherRemovalNotification,
    sendWelcomeEmail,
    sendLessonNoteEmail,
    getTransporter
};
