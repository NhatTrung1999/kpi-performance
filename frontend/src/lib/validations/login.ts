import { z } from "zod";
import type { TFunction } from "i18next";

/** Tạo schema theo ngôn ngữ hiện tại: truyền `t` của namespace `auth`. */
export const createLoginSchema = (t: TFunction<"auth">) =>
  z.object({
  identifier: z
    .string()
    .trim()
    .min(1, t("validation.identifierRequired")),
  password: z
    .string()
    // Không giới hạn độ dài: mật khẩu do HRIS (LYV_HRIS.users) quản lý, có tài khoản < 8 ký tự.
    .min(1, t("validation.passwordRequired")),
  remember: z.boolean(),
});

export type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;
