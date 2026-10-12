import WebApp from "@twa-dev/sdk";

const themeMap = {
  bg_color: "--bg",
  secondary_bg_color: "--raised",
  text_color: "--ink",
  hint_color: "--muted",
  button_color: "--accent",
  button_text_color: "--accent-ink",
} as const;

export function applyTheme() {
  const params = WebApp.themeParams;
  for (const [key, cssVar] of Object.entries(themeMap)) {
    const value = params[key as keyof typeof params];
    if (typeof value === "string" && value.length > 0) {
      document.documentElement.style.setProperty(cssVar, value);
    }
  }
  WebApp.ready();
  WebApp.expand();
}

export function watchTheme() {
  const onChange = () => applyTheme();
  WebApp.onEvent("themeChanged", onChange);
  return () => WebApp.offEvent("themeChanged", onChange);
}
