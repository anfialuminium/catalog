/**
 * Google Apps Script for Anfi Catalog Statistics & Tracking
 * 
 * Instructions:
 * 1. Open your Google Sheet linked to the catalog stats.
 * 2. Go to Extensions -> Apps Script (הרחבות -> Apps Script).
 * 3. Paste this code into Code.gs (replacing everything).
 * 4. Click Deploy -> New deployment (פריסה -> פריסה חדשה).
 * 5. Select Web App, Execute as: Me, Who has access: Anyone.
 * 6. Click Deploy and authorize access.
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
        // Fallback if contents is not JSON
      }
    }
    
    var action = parameter.action || postData.action || 'getStats';
    
    if (action === 'logStat') {
      return logStat(postData.eventType || parameter.eventType, postData.device || parameter.device, postData.userAgent || parameter.userAgent);
    }
    
    if (action === 'getStats') {
      return getStats();
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Action not supported: " + action }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function logStat(eventType, device, userAgent) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
  var sheet = ss.getSheetByName("Stats");
  
  var summary = {
    page_view: 0,
    catalog_download: 0,
    whatsapp_click: 0,
    total_leads: 0
  };
  
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
      
      if (eventType === 'page_view') {
        summary.page_view++;
      } else if (eventType === 'catalog_download') {
        summary.catalog_download++;
        summary.total_leads++;
      } else if (eventType === 'whatsapp_click') {
        summary.whatsapp_click++;
      }
      
      if (dateVal && dateVal.length === 10) {
        if (!dailyMap[dateVal]) {
          dailyMap[dateVal] = { views: 0, downloads: 0 };
        }
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
  
  var responseData = {
    success: true,
    data: {
      summary: summary,
      daily: {
        labels: sortedDates,
        views: viewsList,
        downloads: downloadsList
      }
    }
  };
  
  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}
