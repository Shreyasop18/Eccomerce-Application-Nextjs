import nodemailer from 'nodemailer'

// Create a transporter for sending emails
// For development, we'll use a test account
// In production, you'd use your actual SMTP settings
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
})

export interface EmailData {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailData) {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email credentials not configured. Skipping email send.')
      console.log('Would send email to:', to)
      console.log('Subject:', subject)
      return { success: false, error: 'Email credentials not configured' }
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error }
  }
}

export function generateVerificationEmail(name: string, email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${token}`
  
  return {
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Email Verification</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${name}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Thank you for registering with us! To complete your registration and activate your account, 
            please verify your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      display: inline-block; 
                      font-weight: bold;
                      font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          
          <p style="background: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all; color: #495057;">
            <a href="${verificationUrl}" style="color: #667eea;">${verificationUrl}</a>
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-top: 30px; font-size: 14px;">
            This verification link will expire in 24 hours. If you didn't create an account, 
            you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    `
  }
}

export function generatePasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`
  
  return {
    to: email,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset your password for your account. If you didn't make this request, 
            you can safely ignore this email.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      display: inline-block; 
                      font-weight: bold;
                      font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          
          <p style="background: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all; color: #495057;">
            <a href="${resetUrl}" style="color: #10b981;">${resetUrl}</a>
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-top: 30px; font-size: 14px;">
            This password reset link will expire in 1 hour. For security reasons, 
            please don't share this link with anyone.
          </p>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    `
  }
} 