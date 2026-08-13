const { setGlobalOptions } = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

// ── Global settings ───────────────────────────────────────────────────────────
// Limit concurrency to control Cloud Run costs
setGlobalOptions({ maxInstances: 1 });

// ── Secrets ───────────────────────────────────────────────────────────────────
// Stored in Google Cloud Secret Manager via `firebase functions:secrets:set`
const lineAccessToken = defineSecret("LINE_ACCESS_TOKEN");

// ── Constants ─────────────────────────────────────────────────────────────────
const LINE_BROADCAST_URL = "https://api.line.me/v2/bot/message/broadcast";
const APP_URL = "https://suadpa-app.web.app";

// ── Scheduled Function ────────────────────────────────────────────────────────
/**
 * Broadcasts a daily prayer reminder to all LINE bot users every day at 19:00
 * Thailand time (UTC+7).
 *
 * Cron: "0 19 * * *"  →  fires once per day at 19:00
 */
exports.sendDailyChantReminder = onSchedule(
  {
    schedule: "0 19 * * *",
    timeZone: "Asia/Bangkok",
    secrets: [lineAccessToken],
  },
  async (event) => {
    const token = lineAccessToken.value();

    const payload = {
      messages: [
        {
          type: "text",
          text:
            `🙏 ได้เวลาสวดมนต์ก่อนนอนแล้วครับ` +
            ` แวะมาสงบจิตใจและสะสมบุญกันสักนิดนะครับ\n\n` +
            `เปิดแอป 'สวดป่ะ' ได้เลยที่นี่: ${APP_URL}`,
        },
      ],
    };

    try {
      const response = await fetch(LINE_BROADCAST_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `LINE Broadcast API error — HTTP ${response.status}: ${errorBody}`
        );
      }

      logger.info("sendDailyChantReminder: broadcast sent successfully", {
        status: response.status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("sendDailyChantReminder: failed to send broadcast", {
        message: error.message,
      });
      // Re-throw so Cloud Scheduler marks this execution as FAILED
      // and can be monitored in Firebase console / Cloud Monitoring
      throw error;
    }
  }
);
