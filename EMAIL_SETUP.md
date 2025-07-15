# Email Verification Setup

## Prerequisites

To enable email verification functionality, you need to set up email credentials.

### For Gmail:

1. **Enable 2-Step Verification** on your Google account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate a new app password for "Mail"
3. **Create `.env.local` file** in the project root with:

```env
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

### For Other Email Providers:

Update the email configuration in `lib/email.ts` with your SMTP settings:

```typescript
const transporter = nodemailer.createTransporter({
  host: 'your-smtp-host',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})
```

## How It Works

1. **Registration**: User fills out the registration form
2. **Email Sent**: System sends a verification email with a unique token
3. **Email Verification**: User clicks the link in their email
4. **Account Activation**: User account is marked as verified
5. **Login**: User can now log in with their credentials

## Security Features

- **Token Expiration**: Verification tokens expire after 24 hours
- **One-time Use**: Tokens are deleted after successful verification
- **Secure Generation**: Tokens are cryptographically secure
- **Email Validation**: Proper email format validation

## Testing

For development/testing, you can:
1. Use a real email address to receive verification emails
2. Check the console logs for email sending status
3. Use the verification link from the email to test the flow

## Production Considerations

- Use a proper email service (SendGrid, AWS SES, etc.)
- Implement rate limiting for email sending
- Add email templates for different scenarios
- Set up proper error handling and retry logic
- Use a database instead of in-memory storage 