import { captureMessage, addBreadcrumb, captureException } from "./sentry";

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context));
    }
    addBreadcrumb(message, "debug", "debug", context);
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage(LogLevel.INFO, message, context));
    }
    addBreadcrumb(message, "info", "info", context);
    captureMessage(message, "info");
  }

  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }
    addBreadcrumb(message, "warning", "warning", context);
    captureMessage(message, "warning");
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.isDevelopment) {
      console.error(this.formatMessage(LogLevel.ERROR, message, context));
      if (error) console.error(error);
    }
    
    addBreadcrumb(message, "error", "error", context);
    
    if (error) {
      captureException(error, context);
    } else {
      captureMessage(message, "error");
    }
  }

  // API request logging
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${url}`, { ...context, type: "api_request" });
  }

  apiResponse(method: string, url: string, status: number, context?: LogContext): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this[level](`API Response: ${method} ${url} - ${status}`, { ...context, type: "api_response", status });
  }

  // User action logging
  userAction(action: string, context?: LogContext): void {
    this.info(`User Action: ${action}`, { ...context, type: "user_action" });
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`Performance: ${operation} took ${duration}ms`, { ...context, type: "performance", duration });
  }
}

export const logger = new Logger();
export default logger;
