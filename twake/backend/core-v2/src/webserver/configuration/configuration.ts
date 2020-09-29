import { registerAs } from '@nestjs/config';

export default registerAs('http', () => ({
  url: process.env.HTTP_URL,
  port: process.env.HTTP_PORT,
}));
