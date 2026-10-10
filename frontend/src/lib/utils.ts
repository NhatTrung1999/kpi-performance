import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Báo cho tailwind-merge biết các token tuỳ biến trong @theme (src/index.css),
// nếu không `rounded-control` sẽ không ghi đè `rounded-lg` và `text-body` không ghi đè `text-base`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['label', 'body', 'title'],
      radius: ['control', 'hero'],
      shadow: ['glass', 'glass-sm', 'brand', 'brand-hover', 'field', 'toast'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
