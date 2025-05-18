# Setting Up SMS Invitations for Ephemeral Secret Tunnel

This guide explains how to set up the SMS invitation feature for your chat application.

## Required Environment Variables

Add the following variables to your `.env` file in the backend directory:

```
# SMS Service Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
SMS_ENABLED=true
```

## Steps to Get Twilio API Keys

1. **Create a Twilio Account**
   - Sign up at [Twilio](https://www.twilio.com/try-twilio)
   - Verify your email and phone number

2. **Get Your Account SID and Auth Token**
   - After logging in, go to your [Twilio Console Dashboard](https://www.twilio.com/console)
   - Find your Account SID and Auth Token (you'll need to reveal it)
   - Copy these values to your `.env` file

3. **Purchase a Phone Number**
   - In your Twilio Console, navigate to "Phone Numbers" → "Buy a Number"
   - Make sure the number has SMS capabilities
   - Purchase a number (Twilio offers trial credit for new accounts)
   - Copy the phone number to your `.env` file as `TWILIO_PHONE_NUMBER`
   - Format should include the country code (e.g., +15551234567)

## Testing Without Twilio

During development, you can set `SMS_ENABLED=false` in your `.env` file. The service will log messages to the console instead of actually sending them. This is useful for testing without incurring SMS costs.

```
SMS_ENABLED=false
```

## Alternative SMS Providers

If you prefer not to use Twilio, here are configuration examples for some alternative providers:

### MessageBird

```
# MessageBird Configuration
SMS_PROVIDER=messagebird
MESSAGEBIRD_API_KEY=your_api_key
MESSAGEBIRD_ORIGINATOR=your_phone_number
SMS_ENABLED=true
```

### Nexmo/Vonage

```
# Nexmo/Vonage Configuration
SMS_PROVIDER=vonage
VONAGE_API_KEY=your_api_key
VONAGE_API_SECRET=your_api_secret
VONAGE_PHONE_NUMBER=your_phone_number
SMS_ENABLED=true
```

### AWS SNS

```
# AWS SNS Configuration
SMS_PROVIDER=aws
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
SMS_ENABLED=true
```

## Troubleshooting

- **SMS Not Sending**: Check that your Twilio account is active and has sufficient credit
- **Invalid Number Format**: Ensure phone numbers are in E.164 format (e.g., +15551234567)
- **API Errors**: Verify your Account SID and Auth Token are correct
- **SMS Not Enabled**: Make sure SMS_ENABLED is set to "true"

## Rate Limits and Costs

Be aware that SMS services charge per message sent. To control costs:

1. Consider implementing rate limits (e.g., maximum of 10 invites per user per day)
2. Add phone number validation to prevent wasteful sending
3. Monitor your Twilio dashboard for usage and costs

For more detailed information about the implementation, refer to the `backend/README_SMS.md` file. 