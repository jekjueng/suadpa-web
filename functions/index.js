const { setGlobalOptions } = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

/** Lazily initialise firebase-admin so the CLI module-analysis step
 *  doesn't hang trying to reach the GCP metadata server. */
function getDb() {
  if (!getApps().length) initializeApp();
  return getFirestore();
}

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

// ── Manual Broadcast (Admin-triggered) ────────────────────────────────────────
/**
 * Callable function that lets an authenticated admin send a custom LINE
 * broadcast message immediately and logs the attempt to Firestore.
 *
 * Called from the Admin UI via Firebase SDK `httpsCallable`.
 */
exports.sendManualBroadcast = onCall(
  {
    secrets: [lineAccessToken],
  },
  async (request) => {
    // ── 1. Auth check ─────────────────────────────────────────────────────────
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "ต้องเข้าสู่ระบบก่อนใช้งาน");
    }

    const uid   = request.auth.uid;
    const email = request.auth.token?.email ?? "";

    // ── 2. Admin check ────────────────────────────────────────────────────────
    const db       = getDb();
    const userSnap = await db.collection("users").doc(uid).get();

    if (!userSnap.exists || userSnap.data().isAdmin !== true) {
      throw new HttpsError("permission-denied", "ไม่มีสิทธิ์ใช้งานฟีเจอร์นี้");
    }

    // ── 3. Validate input ─────────────────────────────────────────────────────
    const message = (request.data?.message ?? "").trim();
    if (!message) {
      throw new HttpsError("invalid-argument", "ข้อความต้องไม่ว่างเปล่า");
    }

    // ── 4. Send LINE Broadcast ────────────────────────────────────────────────
    const token = lineAccessToken.value();
    let status  = "success";
    let errorMsg = null;

    try {
      const response = await fetch(LINE_BROADCAST_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ type: "text", text: message }],
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`LINE API error — HTTP ${response.status}: ${body}`);
      }

      logger.info("sendManualBroadcast: success", { uid, email });
    } catch (err) {
      status   = "failed";
      errorMsg = err.message;
      logger.error("sendManualBroadcast: failed", { uid, email, error: err.message });
    }

    // ── 5. Log to Firestore (always, success or fail) ─────────────────────────
    await getDb().collection("broadcastHistory").add({
      message,
      sentAt:      FieldValue.serverTimestamp(),
      sentBy:      uid,
      sentByEmail: email,
      status,
      ...(errorMsg ? { error: errorMsg } : {}),
    });

    if (status === "failed") {
      throw new HttpsError("internal", errorMsg);
    }

    return { success: true };
  }
);
