const axios = require('axios');

const sendSMS = async (options) => {
  try {
    // Using a mock SMS service - replace with actual SMS provider like Twilio, AWS SNS, etc.
    const smsData = {
      to: options.phone,
      message: options.message,
      from: 'JharkhandTourism'
    };

    // Mock SMS sending - replace with actual SMS service API call
    console.log('SMS would be sent:', smsData);
    
    // Example for Twilio:
    // const response = await axios.post('https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json', {
    //   To: options.phone,
    //   From: process.env.TWILIO_PHONE_NUMBER,
    //   Body: options.message
    // }, {
    //   auth: {
    //     username: process.env.TWILIO_ACCOUNT_SID,
    //     password: process.env.TWILIO_AUTH_TOKEN
    //   }
    // });

    return { success: true, message: 'SMS sent successfully' };
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw new Error('Failed to send SMS');
  }
};

module.exports = { sendSMS };
