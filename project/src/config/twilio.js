const twilio = require('twilio');
require('dotenv').config();

let client = null;

const initTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !accountSid.startsWith('AC')) {
    console.warn('Invalid or missing TWILIO_ACCOUNT_SID. SMS notifications will be disabled.');
    return null;
  }

  if (!authToken) {
    console.warn('Missing TWILIO_AUTH_TOKEN. SMS notifications will be disabled.');
    return null;
  }

  return twilio(accountSid, authToken);
};

const sendSMS = async (to, message) => {
  if (!client) {
    client = initTwilioClient();
  }

  if (!client || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn('SMS notification skipped: Twilio not properly configured');
    return;
  }

  try {
    console.log(`Sending SMS to ${to}: ${message}`);
    await client.messages.create({
      body: message,
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
    console.log(`SMS sent successfully to ${to}`);
  } catch (error) {
    console.error(`Error sending SMS to ${to}:`, error);
  }
};

module.exports = { sendSMS };