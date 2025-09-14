
const axios = require('axios');

// @desc    Translate text using Google Translate API
exports.translateText = async (text, targetLanguage, sourceLanguage = 'auto') => {
  try {
    // If source and target languages are the same, return original text
    if (sourceLanguage === targetLanguage) {
      return text;
    }

    // Use Google Translate API
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
      {
        q: text,
        source: sourceLanguage,
        target: targetLanguage,
        format: 'text'
      }
    );

    if (response.data && response.data.data && response.data.data.translations) {
      return response.data.data.translations[0].translatedText;
    }

    throw new Error('Translation failed');
  } catch (error) {
    console.error('Translation error:', error);
    
    // Fallback to simple language mapping for common phrases
    return fallbackTranslation(text, targetLanguage, sourceLanguage);
  }
};

// @desc    Fallback translation using predefined mappings
const fallbackTranslation = (text, targetLanguage, sourceLanguage) => {
  const translations = {
    'hi': {
      'Hello': 'नमस्ते',
      'Welcome': 'स्वागत है',
      'Thank you': 'धन्यवाद',
      'Sorry': 'क्षमा करें',
      'Help': 'मदद',
      'Yes': 'हाँ',
      'No': 'नहीं',
      'Good': 'अच्छा',
      'Bad': 'बुरा',
      'Hot': 'गर्म',
      'Cold': 'ठंडा',
      'Food': 'भोजन',
      'Water': 'पानी',
      'Hotel': 'होटल',
      'Transport': 'परिवहन',
      'Weather': 'मौसम',
      'Destination': 'गंतव्य',
      'Tour': 'यात्रा',
      'Booking': 'बुकिंग',
      'Price': 'कीमत',
      'Location': 'स्थान',
      'Time': 'समय',
      'Date': 'तारीख',
      'Phone': 'फोन',
      'Email': 'ईमेल',
      'Address': 'पता',
      'Name': 'नाम',
      'Age': 'उम्र',
      'Gender': 'लिंग',
      'Emergency': 'आपातकाल',
      'Police': 'पुलिस',
      'Hospital': 'अस्पताल',
      'Bank': 'बैंक',
      'ATM': 'एटीएम',
      'Market': 'बाजार',
      'Shop': 'दुकान',
      'Restaurant': 'रेस्टोरेंट',
      'Temple': 'मंदिर',
      'Park': 'पार्क',
      'Museum': 'संग्रहालय',
      'Station': 'स्टेशन',
      'Airport': 'हवाई अड्डा',
      'Bus': 'बस',
      'Train': 'ट्रेन',
      'Car': 'कार',
      'Taxi': 'टैक्सी',
      'Bike': 'बाइक',
      'Walk': 'पैदल चलना',
      'Run': 'दौड़ना',
      'Sleep': 'सोना',
      'Eat': 'खाना',
      'Drink': 'पीना',
      'Buy': 'खरीदना',
      'Sell': 'बेचना',
      'Go': 'जाना',
      'Come': 'आना',
      'See': 'देखना',
      'Hear': 'सुनना',
      'Speak': 'बोलना',
      'Read': 'पढ़ना',
      'Write': 'लिखना',
      'Learn': 'सीखना',
      'Teach': 'सिखाना',
      'Work': 'काम करना',
      'Play': 'खेलना',
      'Dance': 'नृत्य करना',
      'Sing': 'गाना',
      'Laugh': 'हंसना',
      'Cry': 'रोना',
      'Smile': 'मुस्कुराना',
      'Love': 'प्यार',
      'Like': 'पसंद',
      'Dislike': 'नापसंद',
      'Happy': 'खुश',
      'Sad': 'उदास',
      'Angry': 'गुस्सा',
      'Excited': 'उत्साहित',
      'Tired': 'थका हुआ',
      'Hungry': 'भूखा',
      'Thirsty': 'प्यासा',
      'Sick': 'बीमार',
      'Healthy': 'स्वस्थ',
      'Beautiful': 'सुंदर',
      'Ugly': 'बदसूरत',
      'Big': 'बड़ा',
      'Small': 'छोटा',
      'Tall': 'लंबा',
      'Short': 'छोटा',
      'Fast': 'तेज',
      'Slow': 'धीमा',
      'Easy': 'आसान',
      'Difficult': 'कठिन',
      'New': 'नया',
      'Old': 'पुराना',
      'Young': 'जवान',
      'Clean': 'साफ',
      'Dirty': 'गंदा',
      'Safe': 'सुरक्षित',
      'Dangerous': 'खतरनाक',
      'Open': 'खुला',
      'Closed': 'बंद',
      'Full': 'भरा हुआ',
      'Empty': 'खाली',
      'Free': 'मुफ्त',
      'Expensive': 'महंगा',
      'Cheap': 'सस्ता',
      'Rich': 'अमीर',
      'Poor': 'गरीब',
      'Today': 'आज',
      'Tomorrow': 'कल',
      'Yesterday': 'कल',
      'Morning': 'सुबह',
      'Afternoon': 'दोपहर',
      'Evening': 'शाम',
      'Night': 'रात',
      'Week': 'सप्ताह',
      'Month': 'महीना',
      'Year': 'साल',
      'Monday': 'सोमवार',
      'Tuesday': 'मंगलवार',
      'Wednesday': 'बुधवार',
      'Thursday': 'गुरुवार',
      'Friday': 'शुक्रवार',
      'Saturday': 'शनिवार',
      'Sunday': 'रविवार',
      'January': 'जनवरी',
      'February': 'फरवरी',
      'March': 'मार्च',
      'April': 'अप्रैल',
      'May': 'मई',
      'June': 'जून',
      'July': 'जुलाई',
      'August': 'अगस्त',
      'September': 'सितंबर',
      'October': 'अक्टूबर',
      'November': 'नवंबर',
      'December': 'दिसंबर'
    },
    'bn': {
      'Hello': 'হ্যালো',
      'Welcome': 'স্বাগতম',
      'Thank you': 'ধন্যবাদ',
      'Sorry': 'দুঃখিত',
      'Help': 'সাহায্য',
      'Yes': 'হ্যাঁ',
      'No': 'না',
      'Good': 'ভাল',
      'Bad': 'খারাপ',
      'Hot': 'গরম',
      'Cold': 'ঠান্ডা',
      'Food': 'খাবার',
      'Water': 'পানি',
      'Hotel': 'হোটেল',
      'Transport': 'পরিবহন',
      'Weather': 'আবহাওয়া',
      'Destination': 'গন্তব্য',
      'Tour': 'ভ্রমণ',
      'Booking': 'বুকিং',
      'Price': 'দাম',
      'Location': 'অবস্থান',
      'Time': 'সময়',
      'Date': 'তারিখ',
      'Phone': 'ফোন',
      'Email': 'ইমেইল',
      'Address': 'ঠিকানা',
      'Name': 'নাম',
      'Age': 'বয়স',
      'Gender': 'লিঙ্গ',
      'Emergency': 'জরুরি',
      'Police': 'পুলিশ',
      'Hospital': 'হাসপাতাল',
      'Bank': 'ব্যাংক',
      'ATM': 'এটিএম',
      'Market': 'বাজার',
      'Shop': 'দোকান',
      'Restaurant': 'রেস্টুরেন্ট',
      'Temple': 'মন্দির',
      'Park': 'পার্ক',
      'Museum': 'জাদুঘর',
      'Station': 'স্টেশন',
      'Airport': 'বিমানবন্দর',
      'Bus': 'বাস',
      'Train': 'ট্রেন',
      'Car': 'গাড়ি',
      'Taxi': 'ট্যাক্সি',
      'Bike': 'বাইক',
      'Walk': 'হাঁটা',
      'Run': 'দৌড়',
      'Sleep': 'ঘুম',
      'Eat': 'খাওয়া',
      'Drink': 'পান করা',
      'Buy': 'কিনা',
      'Sell': 'বিক্রি',
      'Go': 'যাওয়া',
      'Come': 'আসা',
      'See': 'দেখা',
      'Hear': 'শোনা',
      'Speak': 'কথা বলা',
      'Read': 'পড়া',
      'Write': 'লেখা',
      'Learn': 'শেখা',
      'Teach': 'শেখানো',
      'Work': 'কাজ',
      'Play': 'খেলা',
      'Dance': 'নাচ',
      'Sing': 'গান',
      'Laugh': 'হাসা',
      'Cry': 'কাঁদা',
      'Smile': 'হাসি',
      'Love': 'ভালবাসা',
      'Like': 'পছন্দ',
      'Dislike': 'অপছন্দ',
      'Happy': 'খুশি',
      'Sad': 'দুঃখিত',
      'Angry': 'রাগ',
      'Excited': 'উত্তেজিত',
      'Tired': 'ক্লান্ত',
      'Hungry': 'ক্ষুধার্ত',
      'Thirsty': 'তৃষ্ণার্ত',
      'Sick': 'অসুস্থ',
      'Healthy': 'সুস্থ',
      'Beautiful': 'সুন্দর',
      'Ugly': 'কুৎসিত',
      'Big': 'বড়',
      'Small': 'ছোট',
      'Tall': 'লম্বা',
      'Short': 'খাটো',
      'Fast': 'দ্রুত',
      'Slow': 'ধীর',
      'Easy': 'সহজ',
      'Difficult': 'কঠিন',
      'New': 'নতুন',
      'Old': 'পুরাতন',
      'Young': 'তরুণ',
      'Clean': 'পরিষ্কার',
      'Dirty': 'নোংরা',
      'Safe': 'নিরাপদ',
      'Dangerous': 'বিপজ্জনক',
      'Open': 'খোলা',
      'Closed': 'বন্ধ',
      'Full': 'ভরা',
      'Empty': 'খালি',
      'Free': 'বিনামূল্যে',
      'Expensive': 'দামী',
      'Cheap': 'সস্তা',
      'Rich': 'ধনী',
      'Poor': 'দরিদ্র',
      'Today': 'আজ',
      'Tomorrow': 'আগামীকাল',
      'Yesterday': 'গতকাল',
      'Morning': 'সকাল',
      'Afternoon': 'দুপুর',
      'Evening': 'সন্ধ্যা',
      'Night': 'রাত',
      'Week': 'সপ্তাহ',
      'Month': 'মাস',
      'Year': 'বছর',
      'Monday': 'সোমবার',
      'Tuesday': 'মঙ্গলবার',
      'Wednesday': 'বুধবার',
      'Thursday': 'বৃহস্পতিবার',
      'Friday': 'শুক্রবার',
      'Saturday': 'শনিবার',
      'Sunday': 'রবিবার',
      'January': 'জানুয়ারি',
      'February': 'ফেব্রুয়ারি',
      'March': 'মার্চ',
      'April': 'এপ্রিল',
      'May': 'মে',
      'June': 'জুন',
      'July': 'জুলাই',
      'August': 'আগস্ট',
      'September': 'সেপ্টেম্বর',
      'October': 'অক্টোবর',
      'November': 'নভেম্বর',
      'December': 'ডিসেম্বর'
    }
  };

  // Simple word-by-word translation
  const words = text.split(' ');
  const translatedWords = words.map(word => {
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
    const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    
    if (translations[targetLanguage]) {
      return translations[targetLanguage][capitalizedWord] || 
             translations[targetLanguage][cleanWord] || 
             word;
    }
    return word;
  });

  return translatedWords.join(' ');
};

// @desc    Detect language of text
exports.detectLanguage = async (text) => {
  try {
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2/detect?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
      {
        q: text
      }
    );

    if (response.data && response.data.data && response.data.data.detections) {
      return response.data.data.detections[0][0].language;
    }

    return 'en'; // Default to English
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en'; // Default to English
  }
};

// @desc    Get supported languages
exports.getSupportedLanguages = () => {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
    { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' }
  ];
};
