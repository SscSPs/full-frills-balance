/**
 * Logger Utility
 * 
 * Provides structured logging with different levels.
 * Debug logs are disabled in production.
 */


type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
    [key: string]: any
}

class Logger {
    private isDevelopment = __DEV__

    private log(level: LogLevel, message: string, context?: LogContext) {
        // Skip debug logs in production
        if (level === 'debug' && !this.isDevelopment) {
            return
        }

        const timestamp = new Date().toISOString()
        const contextStr = context ? ` | ${JSON.stringify(context)}` : ''
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`

        switch (level) {
            case 'debug':
                console.log(logMessage)
                break
            case 'info':
                console.info(logMessage)
                break
            case 'warn':
                console.warn(logMessage)
                break
            case 'error':
                console.error(logMessage)
                break
        }
    }

    debug(message: string, context?: LogContext) {
        this.log('debug', message, context)
    }

    info(message: string, context?: LogContext) {
        this.log('info', message, context)
    }

    warn(message: string, context?: LogContext) {
        this.log('warn', message, context)
    }

    error(message: string, error?: Error | unknown, context?: LogContext) {
        const errorContext = {
            ...context,
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack,
            } : error,
        }
        this.log('error', message, errorContext)
    }
}

// Export singleton instance
export const logger = new Logger()
