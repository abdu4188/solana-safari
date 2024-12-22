type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = "api" | "ai" | "app";

interface LogMessage {
  message: string;
  context: LogContext;
  timestamp: string;
  level: LogLevel;
  data?: unknown;
}

class Logger {
  private static formatMessage(logMsg: LogMessage): string {
    const { timestamp, level, context, message, data } = logMsg;
    return `[${timestamp}] ${level.toUpperCase()} [${context}] ${message} ${
      data ? JSON.stringify(data, null, 2) : ""
    }`;
  }

  private static log(
    level: LogLevel,
    context: LogContext,
    message: string,
    data?: unknown
  ) {
    const timestamp = new Date().toISOString();
    const logMsg: LogMessage = {
      timestamp,
      level,
      context,
      message,
      data,
    };

    const formattedMessage = this.formatMessage(logMsg);

    switch (level) {
      case "debug":
        console.debug(formattedMessage);
        break;
      case "info":
        console.info(formattedMessage);
        break;
      case "warn":
        console.warn(formattedMessage);
        break;
      case "error":
        console.error(formattedMessage);
        break;
    }
  }

  static debug(context: LogContext, message: string, data?: unknown) {
    this.log("debug", context, message, data);
  }

  static info(context: LogContext, message: string, data?: unknown) {
    this.log("info", context, message, data);
  }

  static warn(context: LogContext, message: string, data?: unknown) {
    this.log("warn", context, message, data);
  }

  static error(context: LogContext, message: string, data?: unknown) {
    this.log("error", context, message, data);
  }
}

export default Logger;
