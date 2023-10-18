
 var TO_ADDRESS = "rejin374@gmail.com";

function formatMailBody(obj, order) {
  var result = "";
  if (!order) {
    order = Object.keys(obj);
  }
  

  for (var idx in order) {
    var key = order[idx];
    result += "<h4 style='text-transform: capitalize; margin-bottom: 0'>" + key + "</h4><div>" + sanitizeInput(obj[key]) + "</div>";
  }
  return result; 
}



function sanitizeInput(rawInput) {
   var placeholder = HtmlService.createHtmlOutput(" ");
   placeholder.appendUntrusted(rawInput);
   return placeholder.getContent();
 }
 function doGet(e) {
return HtmlService.createHtmlOutputFromFile('index.html');
}

function doPost(e) {

  try {
    Logger.log(e); 

       
    
    var mailData = e.parameters;
     var data = Utilities.base64Decode(e.parameters.data);
     var blob = Utilities.newBlob(data, e.parameters.mimetype, e.parameters.filename);
    
    
   if(data){
     var destinationFolder = DriveApp.getFolderById("1dKUxuW1Lyv-rofoKmFkbt-Vjjlq2LUDP");
    var file = destinationFolder.createFile(blob);
      var fileUrl = file.getUrl();
   }

    var obj = {
      name : e.parameters.name,
      email:e.parameters.email,
      message:e.parameters.message,
      fileUrl:fileUrl
    }
    record_data(obj);  
     var name = mailData.name;
    var email = mailData.email;
    var message = mailData.message
    var emailBody = "Name: " + name + "<br>Email: " + email + "<br>Message :" + message  + "<br>File URL: " + fileUrl;
    
    var orderParameter = e.parameters.formDataNameOrder;
    var dataOrder;
    if (orderParameter) {
      dataOrder = JSON.parse(orderParameter);
    }
    
    
    var sendEmailTo = (typeof TO_ADDRESS !== "undefined") ? TO_ADDRESS : mailData.formGoogleSendEmail;
    
   
    if (sendEmailTo) {
      MailApp.sendEmail({
        to: String(sendEmailTo),
        subject: "Contact form submitted",
        // replyTo: String(mailData.email), // This is optional and reliant on your form actually collecting a field named `email`
        htmlBody: emailBody
      });
    }

    return ContentService    
          .createTextOutput(
            JSON.stringify({"result":"success"}))
          .setMimeType(ContentService.MimeType.JSON);
  } catch(error) { 
    Logger.log(error);
    return ContentService
          .createTextOutput(JSON.stringify({"result":"error", "error": error}))
          .setMimeType(ContentService.MimeType.JSON);
  }
}



function record_data(dataObj) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000); 

  try {
    
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = dataObj.formGoogleSheetName || "responses";
    var sheet = doc.getSheetByName(sheetName);

    var oldHeader = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var newHeader = oldHeader.slice();
    var fieldsFromForm = getDataColumns(dataObj);
    var row = [new Date()]; 

    
    for (var i = 1; i < oldHeader.length; i++) { // start at 1 to avoid Timestamp column
      var field = oldHeader[i];
      var output = getFieldFromData(field, dataObj);
      row.push(output);

      
      var formIndex = fieldsFromForm.indexOf(field);
      if (formIndex > -1) {
        fieldsFromForm.splice(formIndex, 1);
      }
    }

    
    for (var i = 0; i < fieldsFromForm.length; i++) {
      var field = fieldsFromForm[i];
      var output = getFieldFromData(field, dataObj);
      row.push(output);
      newHeader.push(field);
    }

   
    var nextRow = sheet.getLastRow() + 1; // get the next row
    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);

    
    if (newHeader.length > oldHeader.length) {
      sheet.getRange(1, 1, 1, newHeader.length).setValues([newHeader]);
    }
  } catch (error) {
    Logger.log(error);
  } finally {
    lock.releaseLock();
    return;
  }
}

function getDataColumns(data) {
  return Object.keys(data).filter(function(column) {
    return !(column === 'formGoogleSheetName');
  });
}

function getFieldFromData(field, data) {
  return data[field] || '';
}
