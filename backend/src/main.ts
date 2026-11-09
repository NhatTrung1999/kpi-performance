import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();
  // Chạy sau reverse proxy (IIS/Nginx) thì đặt TRUST_PROXY (vd. "1" hoặc "loopback")
  // để req.ip là IP thật của người dùng — rate limit đăng nhập tính theo IP này.
  if (process.env.TRUST_PROXY) {
    const v = process.env.TRUST_PROXY;
    app.set('trust proxy', /^\d+$/.test(v) ? Number(v) : v);
  }
  // Đọc cookie refresh token (kpi_rt) ở /api/auth/refresh và /api/auth/logout.
  app.use(cookieParser());
  // Validate body theo DTO (class-validator) cho mọi API; bỏ field lạ.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // Frontend gọi API qua tiền tố /api (VITE_API_URL mặc định).
  app.setGlobalPrefix('api');
  // Chỉ cần khi frontend gọi thẳng sang domain/port khác; ở dev đã có proxy của Vite.
  // Ví dụ: CORS_ORIGIN="http://localhost:5173,http://192.168.18.10"
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    app.enableCors({
      origin: corsOrigin.split(',').map((o) => o.trim()),
      credentials: true, // cho phép gửi cookie refresh token khi khác origin
    });
  }
  await app.listen(process.env.PORT ?? 4310);
}
void bootstrap();
