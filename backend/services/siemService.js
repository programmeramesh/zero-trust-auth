const fs = require("fs");
const path = require("path");

let CloudWatchLogsClient;
let PutLogEventsCommand;
try {
  ({ CloudWatchLogsClient, PutLogEventsCommand } = require("@aws-sdk/client-cloudwatch-logs"));
} catch (err) {
  // AWS CloudWatch Logs SDK is optional
}

class SIEMService {
  static getLogFilePath() {
    const logPath = process.env.SIEM_LOG_FILE_PATH || "./logs/siem.log";
    const resolvedPath = path.resolve(process.cwd(), logPath);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return resolvedPath;
  }

  static formatEvent(event) {
    return {
      timestamp: new Date().toISOString(),
      ...event,
    };
  }

  static async logToFile(event) {
    try {
      const formatted = this.formatEvent(event);
      const line = JSON.stringify(formatted) + "\n";
      fs.appendFileSync(this.getLogFilePath(), line, { encoding: "utf8" });
    } catch (err) {
      console.error("SIEM file logging failed:", err);
    }
  }

  static async logToElastic(event) {
    if (!process.env.ELASTIC_URL) return;
    try {
      const payload = this.formatEvent(event);
      const url = process.env.ELASTIC_URL;
      if (typeof fetch === "undefined") {
        return;
      }
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("SIEM Elastic logging failed:", err);
    }
  }

  static async logToCloudWatch(event) {
    if (!CloudWatchLogsClient || !process.env.CLOUDWATCH_LOG_GROUP) return;
    try {
      const logGroupName = process.env.CLOUDWATCH_LOG_GROUP;
      const logStreamName = process.env.CLOUDWATCH_LOG_STREAM || "default";
      const client = new CloudWatchLogsClient({ region: process.env.AWS_REGION });
      const timestamp = Date.now();
      const message = JSON.stringify(this.formatEvent(event));
      await client.send(new PutLogEventsCommand({
        logGroupName,
        logStreamName,
        logEvents: [{ timestamp, message }],
      }));
    } catch (err) {
      console.error("SIEM CloudWatch logging failed:", err);
    }
  }

  static async logEvent(event) {
    await this.logToFile(event);
    await this.logToElastic(event);
    await this.logToCloudWatch(event);
    await this.evaluateAlert(event);
  }

  static async evaluateAlert(event) {
    const alertRules = [
      event.threatType === "MULTIPLE_FAILED_LOGINS" && event.severity === "HIGH",
      event.threatType === "UNUSUAL_LOCATION",
      event.threatType === "ACCESS_OUTSIDE_HOURS",
      event.threatType === "POOR_DEVICE_POSTURE",
      event.action === "DEVICE_UNTRUSTED",
      event.action === "DEVICE_DELETED",
    ];

    if (alertRules.some(Boolean)) {
      const alert = {
        type: "SECURITY_ALERT",
        triggeredAt: new Date().toISOString(),
        severity: event.severity || "MEDIUM",
        description: event.description || `Alert triggered for ${event.action || event.threatType}`,
        metadata: event.metadata || {},
        userId: event.userId || event.user,
      };
      console.warn("SIEM ALERT:", alert);
      await this.logToFile({ ...alert, alert: true });
    }
  }
}

module.exports = SIEMService;
