type LogArgs = unknown[]

import { invoke } from '@tauri-apps/api/core'

function isDev() {
  return true
}

function formatLogArg(arg: unknown): string {
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}\n${arg.stack ?? ''}`.trim()
  }

  if (typeof arg === 'string') {
    return arg
  }

  try {
    return JSON.stringify(arg)
  } catch {
    return String(arg)
  }
}

function writeLog(level: string, args: LogArgs) {
  const message = args.map(formatLogArg).join(' ')
  void invoke('write_frontend_log', { level, message }).catch((error) => {
    console.warn('Failed to write MarkFlowyPlus log:', error)
  })
}

export const logger = {
  debug: (...args: LogArgs) => {
    if (isDev()) console.debug(...args)
    if (isDev()) writeLog('DEBUG', args)
  },
  info: (...args: LogArgs) => {
    if (isDev()) console.info(...args)
    if (isDev()) writeLog('INFO', args)
  },
  warn: (...args: LogArgs) => {
    console.warn(...args)
    writeLog('WARN', args)
  },
  error: (...args: LogArgs) => {
    console.error(...args)
    writeLog('ERROR', args)
  },
}

export function installGlobalErrorLogging() {
  window.addEventListener('error', (event) => {
    logger.error('Uncaught error:', event.message, event.error ?? {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection:', event.reason)
  })
}
