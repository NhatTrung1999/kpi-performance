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
    .min(1, t("validation.passwordRequired"))
    .min(8, t("validation.passwordMin")),
  remember: z.boolean(),
});

export type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;
