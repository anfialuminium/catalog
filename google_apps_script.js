/**
 * Google Apps Script for Anfi Catalog Leads & Statistics
 * 
 * Instructions:
 * 1. Open the Google Sheet where you want to collect leads and stats.
 * 2. In the top menu, go to: Extensions -> Apps Script (הרחבות -> Apps Script).
 * 3. Replace all existing code in Code.gs with this script.
 * 4. Click Deploy -> New deployment (פריסה -> פריסה חדשה).
 * 5. Click the gear icon next to "Select type" and choose "Web app" (אפליקציית אינטרנט).
 * 6. Set Description: "Anfi Catalog Leads & Stats".
 * 7. Set "Execute as": "Me" (אני / בעל החשבון).
 * 8. Set "Who has access": "Anyone" (כל אחד - חובה כדי שטופס האתר יוכל לשלוח נתונים!).
 * 9. Click "Deploy" (פריסה) and grant necessary permissions (Advanced -> Go to ... -> Allow).
 * 10. Copy the Web app URL (מסתיימת ב-/exec) and update GOOGLE_SCRIPT_URL in index.html.
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    var parameter = (e && e.parameter) ? e.parameter : {};
    var postData = {};
    
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        // Fallback if not JSON
      }
    }
    
    // Determine action
    var action = parameter.action || postData.action;
    
    // Auto-detect saveLead if lead fields exist
    if (!action && (postData.phone || postData.full_name || postData.fullName || parameter.phone)) {
      action = 'saveLead';
    }
    
    if (action === 'saveLead') {
      var leadData = Object.keys(postData).length > 0 ? postData : parameter;
      return saveLead(leadData);
    }
    
    if (action === 'logStat') {
      return logStat(
        postData.eventType || parameter.eventType,
        postData.device || parameter.device,
        postData.userAgent || parameter.userAgent
      );
    }
    
    if (action === 'getStats') {
      return getStats();
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: "Action not supported: " + action 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function saveLead(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: "No active spreadsheet linked to this script" 
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var sheet = ss.getSheetByName("לידים");
  if (!sheet) {
    sheet = ss.insertSheet("לידים");
    sheet.appendRow(["תאריך ושעה", "שם מלא", "שם עסק", "טלפון", "אימייל", "תחום עניין", "הודעה"]);
    sheet.getRange(1, 1, 1, 7)
      .setBackground("#2e5541")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  
  var now = Utilities.formatDate(new Date(), "Asia/Jerusalem", "yyyy-MM-dd HH:mm:ss");
  var fullName = data.full_name || data.fullName || "";
  var businessName = data.business_name || data.businessName || "";
  var phone = data.phone || "";
  var email = data.email || "";
  var category = data.category || "";
  var message = data.message || "";
  
  // 1. Append row to Google Sheet
  sheet.appendRow([now, fullName, businessName, "'" + phone, email, category, message]);
  
  // 2. Send Email Notification
  try {
    var recipient = "anfialuminium@gmail.com";
    var subject = "🔔 ליד חדש מקטלוג אנפי: " + fullName + (businessName ? " (" + businessName + ")" : "");
    var htmlBody = 
      '<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">' +
        '<div style="background-color: #2e5541; color: white; padding: 20px; text-align: center;">' +
          '<h2 style="margin: 0; font-size: 20px;">התקבל ליד חדש מאתר הקטלוג!</h2>' +
          '<p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">אנפי יבוא ושיווק בע״מ</p>' +
        '</div>' +
        '<div style="padding: 24px; background-color: #ffffff;">' +
          '<table style="width: 100%; border-collapse: collapse; font-size: 15px;">' +
            '<tr style="border-bottom: 1px solid #f0f0f0;">' +
              '<td style="padding: 10px 0; font-weight: bold; color: #555; width: 110px;">שם מלא:</td>' +
              '<td style="padding: 10px 0; color: #111; font-weight: bold;">' + fullName + '</td>' +
            '</tr>' +
            '<tr style="border-bottom: 1px solid #f0f0f0;">' +
              '<td style="padding: 10px 0; font-weight: bold; color: #555;">שם העסק:</td>' +
              '<td style="padding: 10px 0; color: #111;">' + (businessName || '-') + '</td>' +
            '</tr>' +
            '<tr style="border-bottom: 1px solid #f0f0f0;">' +
              '<td style="padding: 10px 0; font-weight: bold; color: #555;">טלפון:</td>' +
              '<td style="padding: 10px 0; color: #111;"><a href="tel:' + phone + '" style="color: #2e5541; font-weight: bold; text-decoration: none;">' + phone + '</a></td>' +
            '</tr>' +
            '<tr style="border-bottom: 1px solid #f0f0f0;">' +
              '<td style="padding: 10px 0; font-weight: bold; color: #555;">אימייל:</td>' +
              '<td style="padding: 10px 0; color: #111;">' + (email ? '<a href="mailto:' + email + '" style="color: #2e5541; text-decoration: none;">' + email + '</a>' : '-') + '</td>' +
            '</tr>' +
            '<tr style="border-bottom: 1px solid #f0f0f0;">' +
              '<td style="padding: 10px 0; font-weight: bold; color: #555;">תחום עניין:</td>' +
              '<td style="padding: 10px 0; color: #111;">' + (category || '-') + '</td>' +
            '</tr>' +
            '<tr style="border-bottom: 1px solid #f0f0f0;">' +
              '<td style="padding: 10px 0; font-weight: bold; color: #555; vertical-align: top;">הודעה:</td>' +
              '<td style="padding: 10px 0; color: #333; line-height: 1.5;">' + (message || 'ללא פירוט נוסף') + '</td>' +
            '</tr>' +
            '<tr>' +
              '<td style="padding: 10px 0; font-weight: bold; color: #555;">תאריך ושעה:</td>' +
              '<td style="padding: 10px 0; color: #777; font-size: 13px;">' + now + '</td>' +
            '</tr>' +
          '</table>' +
          '<div style="margin-top: 24px; text-align: center;">' +
            '<a href="tel:' + phone + '" style="display: inline-block; background-color: #2e5541; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px;">חייג ללקוח עכשיו</a>' +
          '</div>' +
        '</div>' +
        '<div style="background-color: #f8f9fa; padding: 12px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eeeeee;">' +
          'הודעה אוטומטית מטופס השארת פרטים בקטלוג אנפי (anfi.co.il)' +
        '</div>' +
      '</div>';
      
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      htmlBody: htmlBody
    });
  } catch (emailErr) {
    Logger.log("Error sending email: " + emailErr.toString());
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function logStat(eventType, device, userAgent) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  
  var sheet = ss.getSheetByName("Stats");
  if (!sheet) {
    sheet = ss.insertSheet("Stats");
    sheet.appendRow(["Timestamp", "Date", "Event Type", "Device", "User Agent"]);
  }
  
  var now = new Date();
  var dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
  sheet.appendRow([now, dateStr, eventType || "page_view", device || "Desktop", userAgent || ""]);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "No sheet" })).setMimeType(ContentService.MimeType.JSON);
  
  var sheet = ss.getSheetByName("Stats");
  var summary = { page_view: 0, catalog_download: 0, whatsapp_click: 0, total_leads: 0 };
  var dailyMap = {};
  
  if (sheet && sheet.getLastRow() > 1) {
    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
    for (var i = 0; i < data.length; i++) {
      var dateVal = data[i][1];
      if (dateVal instanceof Date) {
        dateVal = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
      } else {
        dateVal = String(dateVal).substring(0, 10);
      }
      var eventType = String(data[i][2]).trim();
      if (eventType === 'page_view') summary.page_view++;
      else if (eventType === 'catalog_download') { summary.catalog_download++; summary.total_leads++; }
      else if (eventType === 'whatsapp_click') summary.whatsapp_click++;
      
      if (dateVal && dateVal.length === 10) {
        if (!dailyMap[dateVal]) dailyMap[dateVal] = { views: 0, downloads: 0 };
        if (eventType === 'page_view') dailyMap[dateVal].views++;
        if (eventType === 'catalog_download') dailyMap[dateVal].downloads++;
      }
    }
  }
  
  var sortedDates = Object.keys(dailyMap).sort();
  var viewsList = [];
  var downloadsList = [];
  for (var j = 0; j < sortedDates.length; j++) {
    var d = sortedDates[j];
    viewsList.push(dailyMap[d].views);
    downloadsList.push(dailyMap[d].downloads);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: {
      summary: summary,
      daily: { labels: sortedDates, views: viewsList, downloads: downloadsList }
    }
  })).setMimeType(ContentService.MimeType.JSON);
}
