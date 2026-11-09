import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type Entry = { fails: number; firstAt: number; lockedUntil: number };

/**
 * Đếm số lần nhập sai mật khẩu theo tài khoản, khoá tạm khi vượt ngưỡng.
 * Chỉ lưu trong bộ nhớ server (không ghi DB — HRIS chỉ đọc); restart server thì đếm lại từ đầu.
 * Đếm cả tài khoản không tồn tại để phản hồi giống hệt nhau (không lộ tài khoản nào có thật).
 */
@Injectable()
export class LoginAttemptsService {
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly lockMs: number;
  private readonly entries = new Map<string, Entry>();

  constructor(config: ConfigService) {
    this.maxAttempts = Number(config.get('LOGIN_MAX_ATTEMPTS') ?? 5);
    this.windowMs = Number(config.get('LOGIN_WINDOW_MINUTES') ?? 15) * 60_000;
    this.lockMs = Number(config.get('LOGIN_LOCK_MINUTES') ?? 15) * 60_000;
  }

  private key = (identifier: string) => identifier.trim().toLowerCase();

  /** Số giây còn bị khoá tạm; 0 = không bị khoá. */
  lockedFor(identifier: string): number {
    const e = this.entries.get(this.key(identifier));
    const left = e ? e.lockedUntil - Date.now() : 0;
    return left > 0 ? Math.ceil(left / 1000) : 0;
  }

  /** Ghi nhận một lần sai. Trả về số lần còn lại, hoặc số giây bị khoá nếu vừa chạm ngưỡng. */
  recordFailure(identifier: string): {
    attemptsLeft: number;
    lockedFor: number;
  } {
    this.prune();
    const now = Date.now();
    const k = this.key(identifier);
    let e = this.entries.get(k);
    if (!e || now - e.firstAt > this.windowMs || e.lockedUntil > 0) {
      e = { fails: 0, firstAt: now, lockedUntil: 0 };
    }
    e.fails += 1;
    if (e.fails >= this.maxAttempts) {
      e.lockedUntil = now + this.lockMs;
    }
    this.entries.set(k, e);
    return {
      attemptsLeft: Math.max(0, this.maxAttempts - e.fails),
      lockedFor: this.lockedFor(identifier),
    };
  }

  reset(identifier: string) {
    this.entries.delete(this.key(identifier));
  }

  // Dọn mục đã hết hạn để bộ nhớ không phình ra khi bị dò nhiều tài khoản.
  private prune() {
    const now = Date.now();
    for (const [k, e] of this.entries) {
      const expired =
        e.lockedUntil > 0
          ? e.lockedUntil <= now
          : now - e.firstAt > this.windowMs;
      if (expired) this.entries.delete(k);
    }
  }
}
