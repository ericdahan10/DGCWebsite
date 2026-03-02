function getConfig(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function doPost(e) {
  try {
    console.log(
      "doPost raw postData:",
      e && e.postData ? e.postData.contents : "no postData",
    );
    const payload =
      e && e.postData && e.postData.contents
        ? JSON.parse(e.postData.contents)
        : {};

    const expectedSecret = PropertiesService.getScriptProperties().getProperty("WORKER_SECRET");
    if (!expectedSecret || payload._secret !== expectedSecret) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "Unauthorized" }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    console.log("doPost parsed payload:", JSON.stringify(payload));

    GmailApp.sendEmail(payload.to, payload.subject || "", payload.body || "", {
      name: "Dahan Group Consulting",
      replyTo: "eric@dahangroup.io",
      htmlBody: payload.html || "",
    });

    return ContentService.createTextOutput(
      JSON.stringify({ success: true }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error("doPost error:", err && err.stack ? err.stack : err);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: "Internal error" }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
