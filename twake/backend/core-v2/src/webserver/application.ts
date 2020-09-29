import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: true
  });

  app.setGlobalPrefix("api/v2");

  await app.listen(3000);
}

export default bootstrap;
