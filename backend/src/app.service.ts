import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // Health check: chỉ báo server đang chạy, không truy vấn DB và không trả dữ liệu người dùng.
  getHealth() {
    return { status: 'ok' };
  }
}
