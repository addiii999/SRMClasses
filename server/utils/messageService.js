/**
 * SRM Classes - Messaging Service (Placeholder)
 * This service handles WhatsApp, SMS, and Email notifications.
 * Core logic is abstracted so that actual API integrations can be added without changing controllers.
 */

const sendAdmissionNotification = async (user, branchName) => {
  console.log(`[MESSAGE SERVICE] Sending admission notification to ${user.name} (${user.mobile})`);
  console.log(`[MESSAGE SERVICE] Content: Your admission process has started at SRM Classes (${branchName}).`);
  
  // Future: Integrate with WhatsApp API (e.g., Twilio, Meta) or SMS Gateway
  // try {
  //   await someApi.send(...)
  // } catch (err) {
  //   console.error("Failed to send message:", err);
  // }
  
  return true;
};

module.exports = {
  sendAdmissionNotification,
};
