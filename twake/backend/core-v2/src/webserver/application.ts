import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WebConfigService } from './configuration/configuration.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: true
  });

  const webConfig: WebConfigService = app.get('WebConfigService');

  app.setGlobalPrefix("api/v2");

  await app.listen(webConfig.port);

  console.log(`TwakeApp started on ${await app.getUrl()}`);
}

export default bootstrap;
