import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const client = twilio(accountSid, authToken);

export interface SendOTPOptions {
  phoneNumber: string;
  code: string;
}

export interface SendSMSOptions {
  phoneNumber: string;
  message: string;
}

/**
 * Send OTP code via SMS
 */
export async function sendOTPSMS({ phoneNumber, code }: SendOTPOptions) {
  try {
    const message = await client.messages.create({
      body: `Your FinPal verification code is: ${code}. This code will expire in 10 minutes.`,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error) {
    console.error('Twilio SMS error:', error);
    throw new Error('Failed to send SMS');
  }
}

/**
 * Send general SMS notification
 */
export async function sendSMS({ phoneNumber, message }: SendSMSOptions) {
  try {
    const smsMessage = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    return {
      success: true,
      messageId: smsMessage.sid,
    };
  } catch (error) {
    console.error('Twilio SMS error:', error);
    throw new Error('Failed to send SMS');
  }
}

/**
 * Send financial alert SMS
 */
export async function sendFinancialAlert({ phoneNumber, alertMessage }: { phoneNumber: string; alertMessage: string }) {
  try {
    const message = await client.messages.create({
      body: `🔔 FinPal Alert: ${alertMessage}`,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error) {
    console.error('Twilio SMS alert error:', error);
    throw new Error('Failed to send alert');
  }
}