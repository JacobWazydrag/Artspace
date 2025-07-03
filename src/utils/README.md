# Email Configuration System

This system provides environment-based email configuration to ensure that emails are sent to the correct recipients based on the current environment.

## How it works

The system uses the `REACT_APP_ENVIRONMENT` environment variable to determine the email configuration:

- **DEV Environment**: All emails are redirected to specific test recipients
- **PROD Environment**: Emails use the original configuration

## Configuration

### DEV Environment

When `REACT_APP_ENVIRONMENT === 'DEV'`:

- `toUids`: Always set to `['7vwsK29oPrViRdDgBP6ouy7iSS12']`
- `cc`: Always set to `['jgw.jakegeorge@gmail.com']`
- `bcc`: Always set to `['jgw.jakegeorge@gmail.com']`

### PROD Environment

When `REACT_APP_ENVIRONMENT === 'PROD'`:

- Uses the original email configuration without any overrides

## Usage

### Using the utility functions

```typescript
import { getEmailConfig, mergeEmailConfig } from "../utils/emailConfig";

// Get environment-specific config
const config = getEmailConfig();

// Merge with existing email data
const mailData = mergeEmailConfig({
  replyTo: "artspacechicago@gmail.com",
  toUids: [message.receiverId],
  message: {
    subject: "Test Email",
    html: "<p>Hello!</p>",
  },
});
```

### Files Updated

The following files have been updated to use the environment-based configuration:

1. **`src/features/chatSlice.ts`** - Chat notification emails
2. **`src/pages/Auth/Auth.tsx`** - New user registration emails
3. **`src/pages/Invitation/Invitation.tsx`** - Invitation and custom message emails

## Environment Files

The system relies on the following environment files:

- `.env.development.local` - Contains `REACT_APP_ENVIRONMENT=DEV`
- `.env.production.local` - Contains `REACT_APP_ENVIRONMENT=PROD`

## Testing

Run the tests to verify the configuration logic:

```bash
npm test src/utils/emailConfig.test.ts
```
