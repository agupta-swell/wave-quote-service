import { Injectable, Logger, LoggerService } from '@nestjs/common';
import * as path from 'path';
import * as winston from 'winston';

const dateFormat = () => {
  return new Date(Date.now()).toUTCString();
};

@Injectable()
export class MyLogger extends Logger {
  logger: winston.Logger;

  constructor() {
    super();
    const logger = winston.createLogger({
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          dirname: path.join(__dirname, './../../../log/error/'),
          filename: 'error.log',
          level: 'error',
        }),
        new winston.transports.File({
          dirname: path.join(__dirname, './../../../log/info/'),
          filename: 'info.log',
          level: 'info',
        }),
      ],
      format: winston.format.combine(
        winston.format.splat(),
        winston.format.printf(info => `${dateFormat()} | ${info.level.toUpperCase()} | ${info.message}`),
        winston.format.colorize({ all: true }),
      ),
    });

    this.logger = logger;
  }

  debug(message: string) {
    this.logger.log('debug', message);
  }

  error(message: string, meta?: any, context?: string) {
    if (context) return this.logger.log('error', `${message} %s`, meta);
    return this.logger.log('error', `${message} \n`, meta);
  }

  errorAPICalling(url: string, message: string) {
    this.logger.log('error', `Calling to %s is failed with message: %s`, url, message);
  }

  log(message: string, meta?: any) {
    this.logger.log('info', message, meta);
  }

  warn(message: string) {
    super.warn(message);
  }

  verbose(message: string) {
    super.verbose(message);
  }
}
