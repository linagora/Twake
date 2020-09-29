import * as Joi from '@hapi/joi';
import { Module } from '@nestjs/common';
import configuration from './configuration';
import { WebConfigService } from './configuration.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
/**
 * Import and provide app configuration related classes.
 *
 * @module
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: ['.env.development', '.env'],
      validationSchema: Joi.object({
        HTTP_URL: Joi.string().default('0.0.0.0'),
        HTTP_PORT: Joi.number().default(3000),
      }),
    }),
  ],
  providers: [ConfigService, WebConfigService],
  exports: [ConfigService, WebConfigService],
})
export class WebConfigModule {}