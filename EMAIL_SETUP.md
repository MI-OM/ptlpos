# Email Service Configuration Guide

## Overview

PTLPOS includes a comprehensive email service built with Nodemailer and Mailgun for sending transactional emails. The service is fully integrated and ready to use.

## Setup

### 1. Get Mailgun Credentials

1. Go to [Mailgun.com](https://www.mailgun.com)
2. Sign up or log in to your account
3. Navigate to **Domain Settings**
4. Copy the following information:
   - **Domain**: `sandbox.xxxxx.mailgun.org` (or your custom domain)
   - **API Key**: Found under API Security → Private API Key

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Mailgun Configuration
MAILGUN_DOMAIN="sandbox.xxxxx.mailgun.org"
MAILGUN_API_KEY="key-xxxxxxxxxxxxxxxxxxxx"
MAILGUN_FROM_EMAIL="noreply@ptlpos.com"
```

### 3. Replace Credentials

1. `MAILGUN_DOMAIN`: Your Mailgun domain (found in Domain Settings)
2. `MAILGUN_API_KEY`: Your Mailgun API key (keep this secret!)
3. `MAILGUN_FROM_EMAIL`: Email address for sending messages (must be authorized in Mailgun)

## Features

### Email Templates Included

1. **Password Reset Email**
   - Includes reset link
   - 24-hour expiration warning
   - Fallback token code

2. **Welcome Email**
   - New user greeting
   - Direct login link
   - Call-to-action

3. **Invoice Email**
   - Professional invoice layout
   - Payment details
   - Company branding

4. **Receipt Email**
   - Transaction confirmation
   - Green success styling
   - Purchase details

## Usage Examples

### In a Service

```typescript
import { Injectable } from '@nestjs/common';
import { EmailService } from 'src/modules/email/email.service';

@Injectable()
export class UserService {
  constructor(private emailService: EmailService) {}

  async sendPasswordReset(email: string, name: string, resetToken: string) {
    const resetUrl = `https://app.ptlpos.com/reset?token=${resetToken}`;
    
    return this.emailService.sendPasswordResetEmail(
      email,
      name,
      resetToken,
      resetUrl,
    );
  }

  async sendWelcome(email: string, name: string) {
    const loginUrl = 'https://app.ptlpos.com/login';
    
    return this.emailService.sendWelcomeEmail(email, name, loginUrl);
  }
}
```

### Direct Email Sending

```typescript
this.emailService.sendEmail({
  to: 'customer@example.com',
  subject: 'Custom Subject',
  html: '<p>Custom HTML content</p>',
  text: 'Custom text content', // Optional
  replyTo: 'support@ptlpos.com', // Optional
});
```

## API Reference

### EmailService Methods

#### `sendEmail(options: EmailOptions): Promise<boolean>`

Send a custom email.

```typescript
interface EmailOptions {
  to: string | string[];        // Recipient(s)
  subject: string;              // Email subject
  html: string;                 // HTML content
  text?: string;                // Plain text alternative
  replyTo?: string;             // Reply-to address
}
```

**Returns**: `true` if email was queued successfully, `false` otherwise.

---

#### `sendPasswordResetEmail(email, name, resetToken, resetUrl): Promise<boolean>`

Send a password reset email with professional template.

**Parameters**:
- `email`: Recipient email address
- `name`: User's name for personalization
- `resetToken`: Token for security reference
- `resetUrl`: Full URL to reset password page

---

#### `sendWelcomeEmail(email, name, loginUrl): Promise<boolean>`

Send a welcome email to new users.

**Parameters**:
- `email`: New user's email
- `name`: User's full name
- `loginUrl`: URL to login page

---

#### `sendInvoiceEmail(email, invoiceNumber, invoiceHtml): Promise<boolean>`

Send an invoice email with professional template.

**Parameters**:
- `email`: Recipient email
- `invoiceNumber`: Invoice ID (e.g., "INV-001")
- `invoiceHtml`: HTML content of invoice

---

#### `sendReceiptEmail(email, receiptNumber, receiptHtml): Promise<boolean>`

Send a receipt confirmation email.

**Parameters**:
- `email`: Recipient email
- `receiptNumber`: Receipt ID (e.g., "REC-001")
- `receiptHtml`: HTML content of receipt

---

#### `isEmailConfigured(): boolean`

Check if email service is properly configured.

**Usage**:
```typescript
if (this.emailService.isEmailConfigured()) {
  // Send emails
} else {
  // Email not configured, handle gracefully
}
```

---

## Graceful Degradation

The email service is designed to fail gracefully:

- ✅ If Mailgun credentials are missing, emails are silently skipped
- ✅ No errors thrown - service continues operating
- ✅ Logs warning messages for debugging
- ✅ Can toggle email on/off without code changes

### Check Configuration

```typescript
const isConfigured = this.emailService.isEmailConfigured();

if (!isConfigured) {
  console.log('Email service not configured - emails will not be sent');
}
```

## Production Deployment

### Mailgun Domain Setup

**Sandbox Mode** (Development - Default):
- Emails sent to authorized recipients only
- No configuration needed beyond API key

**Custom Domain** (Production - Recommended):
1. Add your domain to Mailgun
2. Update DNS records (CNAME, MX, TXT)
3. Wait for DNS propagation (5-30 minutes)
4. Update `MAILGUN_DOMAIN` in environment variables

### Best Practices

1. **Use Environment-Specific Domains**
   ```env
   # Development
   MAILGUN_FROM_EMAIL="dev@ptlpos.local"
   
   # Production
   MAILGUN_FROM_EMAIL="noreply@ptlpos.com"
   ```

2. **Monitor Email Delivery**
   - Check Mailgun dashboard for bounce rates
   - Monitor email logs in Mailgun console
   - Set up webhook notifications

3. **Handle Email Failures**
   ```typescript
   const sent = await this.emailService.sendPasswordResetEmail(...);
   
   if (!sent) {
    // Show user-friendly error or retry
    throw new Error('Email could not be sent');
   }
   ```

4. **Test Emails**
   - Use sandbox domain during development
   - Test with authorized recipient list first
   - Verify templates render correctly

## Troubleshooting

### "Invalid login: 535 Authentication failed"

**Cause**: Incorrect API key or domain

**Solution**:
1. Verify `MAILGUN_API_KEY` is correct
2. Check `MAILGUN_DOMAIN` format (should be `sandboxXXX.mailgun.org`)
3. Ensure credentials are copied exactly from Mailgun dashboard

---

### "Email address not authorized"

**Cause**: Sending from unauthorized email address in sandbox mode

**Solution**:
1. Go to Mailgun dashboard
2. Find your domain
3. Add recipient email to "Authorized Recipients"
4. Or switch to custom domain (production)

---

### Emails Not Being Sent

**Check List**:
1. Is email service configured? `isEmailConfigured()` returns `true`
2. Are environment variables set? Check `.env` file
3. Is the recipient email valid?
4. Check application logs for errors
5. Check Mailgun dashboard for failed deliveries

---

## Email Logging

All email operations are logged at the application level:

```typescript
// Successful send
[Nest] ... [EmailService] Email sent successfully to user@example.com

// Failed send
[Nest] ... [EmailService] Failed to send email to user@example.com: {error}

// Service not configured
[Nest] ... [EmailService] Email service not configured, email sending disabled
```

## Testing

Run email service tests:

```bash
npm test -- test/unit/email.service.spec.ts
```

All email service methods are unit tested and return appropriate boolean values even when email is not configured.

## Render Deployment

To deploy with email on Render:

1. **Add Environment Variables** in Render dashboard:
   - Go to Environment → Environment Variables
   - Add: `MAILGUN_DOMAIN`, `MAILGUN_API_KEY`, `MAILGUN_FROM_EMAIL`

2. **Deploy Application**:
   ```bash
   git push origin main
   ```

3. **Verify Configuration**:
   - Check deployment logs for "Email service initialized"
   - Test with health check endpoint

## Future Enhancements

Potential additions to the email service:

- [ ] Email template customization
- [ ] Email analytics/tracking
- [ ] Queue for high-volume sends
- [ ] Multiple mail provider support
- [ ] Email scheduling
- [ ] Attachment support
- [ ] MJML template engine integration
- [ ] Email preview/staging

---

## Support

For Mailgun support: [Mailgun Documentation](https://documentation.mailgun.com/)

For implementation questions, check the `EmailService` class in `src/modules/email/email.service.ts`
