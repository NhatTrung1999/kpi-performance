import { useSyncExternalStore } from "react"
import { useGlassUi } from "@/lib/ui-theme"

/** Từ lg (64rem) trở lên — bố cục desktop (sidebar cố định, tab nối tấm nội dung). Giao diện kính tối thì áp ở mọi cỡ. */
const LG_QUERY = "(min-width: 64rem)"

const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(LG_QUERY)
  mq.addEventListener("change", onChange)
  return () => mq.removeEventListener("change", onChange)
}

export const useIsDesktop = () => useSyncExternalStore(subscribe, () => window.matchMedia(LG_QUERY).matches, () => false)

/**
 * Class cho popup nổi (menu xổ, gợi ý, menu tài khoản, hộp thoại, thông báo): popup render qua portal ra ngoài tấm nội dung
 * nên không kế thừa tông tối của tấm — gắn `dark` + kính (.liquid-popup trong index.css) để đồng bộ với tấm Liquid Glass.
 * Áp ở mọi cỡ màn hình khi đang dùng giao diện kính (lib/ui-theme.ts); giao diện phẳng thì popup giữ kiểu sáng thường.
 */
export const useGlassPopup = () => (useGlassUi() ? "dark liquid-popup" : undefined)
