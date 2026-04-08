const https = require('https');

/**
 * Pings the server's own health endpoint every 14 minutes.
 * This acts as a backup keep-alive mechanism to prevent free-tier services (like Render)
 * from spinning down due to inactivity.
 */
const startKeepAlive = () => {
  // Use the backend URL from environment or fallback to localhost during dev
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  const pingUrl = `${backendUrl.replace(/\/$/, '')}/api/health`;

  console.log(`⏱️ Starting internal keep-alive ping to ${pingUrl} every 14 minutes.`);

  // 14 minutes in milliseconds
  const PING_INTERVAL = 14 * 60 * 1000;

  setInterval(() => {
    try {
      const client = pingUrl.startsWith('https') ? https : require('http');
      
      client.get(pingUrl, (res) => {
        if (res.statusCode === 200) {
          console.log(`[Keep-Alive] Ping successful at ${new Date().toISOString()}`);
        } else {
          console.log(`[Keep-Alive] Ping returned status code: ${res.statusCode}`);
        }
      }).on('error', (err) => {
        console.error(`[Keep-Alive] Error during ping: ${err.message}`);
      });
    } catch (err) {
      console.error(`[Keep-Alive] Failed to execute ping: ${err.message}`);
    }
  }, PING_INTERVAL);
};

module.exports = startKeepAlive;
