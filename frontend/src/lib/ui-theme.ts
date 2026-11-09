/**
 * Kiểu giao diện của app. Hiện cố định là `flat` (giao diện phẳng "soft blue": nền xanh lam nhạt, thẻ trắng bo tròn lớn,
 * bóng xanh mềm — token gốc `:root` / `.dark` trong index.css). Giao diện kính (`glass`) đã ngừng dùng và không còn nút chuyển;
 * các nhánh `glass` trong component chỉ còn là mã chưa dọn. Gắn `data-ui` lên `<html>` để CSS bám theo.
 */
export type UiTheme = "glass" | "flat";

const current: UiTheme = "flat";

/** Gọi một lần lúc khởi động (main.tsx). */
export function initUiTheme() {
  document.documentElement.dataset.ui = current;
  try {
    localStorage.removeItem("kpi-ui-theme"); // lựa chọn cũ từ thời còn nút chuyển
  } catch {
    // bỏ qua
  }
}

export const useUiTheme = (): UiTheme => current;

/** Đang dùng giao diện kính không (luôn false). */
export const useGlassUi = () => useUiTheme() === "glass";
