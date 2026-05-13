export const DESKTOP_RUNTIME_UNAVAILABLE_MESSAGE =
  'Desktop runtime unavailable. Hardware controls are disabled in browser mode.';

export const isDesktopRuntime = typeof window !== 'undefined' && Boolean(window.lightAiNative);
export const isWebRuntime = !isDesktopRuntime;
