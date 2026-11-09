import {
  BadRequestException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

// Guard chạy trước ValidationPipe, nên body login được kiểm tra ngay tại đây
// (thiếu/sai kiểu → 400) trước khi Passport đọc identifier/password.
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ body: unknown }>();
    const dto = plainToInstance(LoginDto, req.body ?? {});
    const errors = await validate(dto, { whitelist: true });
    if (errors.length > 0) {
      throw new BadRequestException(
        errors.flatMap((e) => Object.values(e.constraints ?? {})),
      );
    }
    req.body = dto;
    return (await super.canActivate(context)) as boolean;
  }
}
