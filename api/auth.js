export default async function handler(req, res) {
  // הגדרת כותרות CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // מענה לבקשות Preflight של הדפדפן
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // אישור בקשות POST בלבד
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // קריאת גוף הבקשה
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  body = body || {};

  const password = body.password;
  const SYSTEM_PASSWORD = process.env.SYSTEM_PASSWORD;

  // בדיקה אם משתנה הסביבה הוגדר ב-Vercel
  if (!SYSTEM_PASSWORD) {
    return res.status(500).json({ 
      success: false, 
      message: 'משתנה הסביבה SYSTEM_PASSWORD אינו מוגדר ב-Vercel' 
    });
  }

  // אימות הסיסמה בצד-שרת
  if (password && password === SYSTEM_PASSWORD) {
    return res.status(200).json({ 
      success: true, 
      message: 'אימות עבר בהצלחה' 
    });
  } else {
    return res.status(401).json({ 
      success: false, 
      message: 'סיסמה שגויה' 
    });
  }
}
