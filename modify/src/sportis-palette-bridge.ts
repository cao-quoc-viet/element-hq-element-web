/*
 * Sportis Community — Sportis JSC (2026)
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Part of the Sportis Community fork of Element Web.
 *
 * Sportis Theme & Palette Bridge
 *
 * Unified cross-app sync for theme mode (light/dark/system) and color palette.
 * All 3 Sportis apps (Web V2, Login UI, Community) use the same cookies/localStorage keys.
 *
 * Cookies: `sportis-theme` (light|dark|system), `sportis-palette` (palette id)
 * - Prod (*.sportis.vn): cookies with domain=.sportis.vn
 * - Dev/Staging: cookies without domain (shared across ports on same hostname)
 * - localStorage fallback for both
 *
 * This module is called from theme.ts after theme stylesheet is applied.
 */

import { logger } from "matrix-js-sdk/src/logger";

const THEME_COOKIE_NAME = "sportis-theme";
const THEME_STORAGE_KEY = "sportis-theme";
const PALETTE_COOKIE_NAME = "sportis-palette";
const PALETTE_STORAGE_KEY = "sportis-palette";
const STYLE_TITLE = "sportis-palette-bridge";

/** All available palettes with their color stops (must match Web V2 globals.css) */
const PALETTES: Record<string, Record<string, string>> = {
    "": {
        "50": "#EDF1F7", "100": "#DCE4EF", "200": "#B9C8DF", "300": "#95ADD0",
        "400": "#7291C0", "500": "#4F76B0", "600": "#3F5E8D", "700": "#2F476A",
        "800": "#202F46", "900": "#101823", "950": "#0B1019", "975": "#060810",
    },
    coffee: {
        "50": "#f5efef", "100": "#ebe0e0", "200": "#d7c1c1", "300": "#c3a2a2",
        "400": "#af8383", "500": "#9c6363", "600": "#7c5050", "700": "#5d3c3c",
        "800": "#3e2828", "900": "#1f1414", "950": "#160e0e", "975": "#0a0707",
    },
    forest: {
        "50": "#f1f4f1", "100": "#e3e9e2", "200": "#c8d2c6", "300": "#acbca9",
        "400": "#90a58d", "500": "#758f70", "600": "#5d725a", "700": "#465643",
        "800": "#2f392d", "900": "#171d16", "950": "#101410", "975": "#080a08",
    },
    slate: {
        "50": "#f0f3f4", "100": "#e2e7e9", "200": "#c5cfd3", "300": "#a8b7bd",
        "400": "#8b9fa7", "500": "#6e8791", "600": "#586c74", "700": "#425157",
        "800": "#2c363a", "900": "#161b1d", "950": "#0f1314", "975": "#080a0a",
    },
    black: {
        "50": "#F2F2F2", "100": "#E6E6E6", "200": "#CCCCCC", "300": "#B3B3B3",
        "400": "#999999", "500": "#808080", "600": "#666666", "700": "#4D4D4D",
        "800": "#333333", "900": "#1A1A1A", "950": "#121212", "975": "#0a0a0a",
    },
    "imperial-violet": {
        "50": "#f1ebfa", "100": "#e3d6f5", "200": "#c7adeb", "300": "#ab85e0",
        "400": "#8f5cd6", "500": "#7333cc", "600": "#5c29a3", "700": "#451f7a",
        "800": "#2e1452", "900": "#170a29", "950": "#10071d", "975": "#08040e",
    },
    "almond-silk": {
        "50": "#f6f1ef", "100": "#ece3df", "200": "#d9c7bf", "300": "#c6ab9f",
        "400": "#b48f7e", "500": "#a1735e", "600": "#815c4b", "700": "#604539",
        "800": "#402e26", "900": "#201713", "950": "#16100d", "975": "#0b0806",
    },
    "charcoal-brown": {
        "50": "#f2f3f1", "100": "#e6e7e4", "200": "#cccfc9", "300": "#b3b7ae",
        "400": "#9a9f93", "500": "#808778", "600": "#676c60", "700": "#4d5148",
        "800": "#333630", "900": "#1a1b18", "950": "#121311", "975": "#090908",
    },
    "peach-glow": {
        "50": "#fcf2e9", "100": "#f9e4d2", "200": "#f2c9a6", "300": "#ecaf79",
        "400": "#e6944c", "500": "#df7920", "600": "#b36119", "700": "#864913",
        "800": "#59300d", "900": "#2d1806", "950": "#1f1104", "975": "#0f0902",
    },
    "azure-mist": {
        "50": "#edf7f8", "100": "#dbeff0", "200": "#b6dee2", "300": "#92ced3",
        "400": "#6dbec5", "500": "#49adb6", "600": "#3a8b92", "700": "#2c686d",
        "800": "#1d4549", "900": "#0f2324", "950": "#0a181a", "975": "#050c0d",
    },
    "dusty-taupe": {
        "50": "#f6f2ee", "100": "#ede4de", "200": "#dccabc", "300": "#caaf9b",
        "400": "#b99579", "500": "#a77a58", "600": "#866246", "700": "#644935",
        "800": "#433123", "900": "#211812", "950": "#17110c", "975": "#0b0806",
    },
    "dusty-taupe-grey": {
        "50": "#f4f3f0", "100": "#e9e6e2", "200": "#d3cdc5", "300": "#bdb5a8",
        "400": "#a79c8b", "500": "#91836e", "600": "#746958", "700": "#574f42",
        "800": "#3a342c", "900": "#1d1a16", "950": "#14120f", "975": "#0a0907",
    },
    graphite: {
        "50": "#f3f2f3", "100": "#e6e5e6", "200": "#cecace", "300": "#b5b0b5",
        "400": "#9c969c", "500": "#837c83", "600": "#696369", "700": "#4f4a4f",
        "800": "#353135", "900": "#1a191a", "950": "#121112", "975": "#090809",
    },
    "baltic-blue": {
        "50": "#e9f5fb", "100": "#d3ecf8", "200": "#a8d8f0", "300": "#7cc5e9",
        "400": "#51b1e1", "500": "#259eda", "600": "#1e7eae", "700": "#165f83",
        "800": "#0f3f57", "900": "#07202c", "950": "#05161f", "975": "#030b0f",
    },
};

/** Get cookie domain for cross-app sharing (.sportis.vn for prod, omit for dev/staging) */
function getCookieDomain(): string {
    try {
        if (window.location.hostname.endsWith(".sportis.vn")) return "; domain=.sportis.vn";
    } catch { /* SSR safety */ }
    return "";
}

/** Read a cookie value by name */
function readCookie(name: string): string {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match?.[2] || "";
}

/** Write a cookie + localStorage (unified sync for all environments) */
function writePreference(cookieName: string, storageKey: string, value: string): void {
    const domain = getCookieDomain();
    const maxAge = 365 * 24 * 60 * 60; // 1 year
    document.cookie = `${cookieName}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${domain}`;
    try {
        localStorage.setItem(storageKey, value);
    } catch { /* quota exceeded */ }
}

/** Read preference: cookie first, localStorage fallback */
function readPreference(cookieName: string, storageKey: string): string {
    const cookieVal = readCookie(cookieName);
    if (cookieVal) return cookieVal;
    try {
        return localStorage.getItem(storageKey) || "";
    } catch {
        return "";
    }
}

// ─── Theme Sync ───────────────────────────────────────────────────────────────

/** Read theme preference from shared cookie/localStorage */
export function getSportisTheme(): string {
    return readPreference(THEME_COOKIE_NAME, THEME_STORAGE_KEY);
}

/** Write theme preference to shared cookie/localStorage */
export function setSportisTheme(theme: string): void {
    writePreference(THEME_COOKIE_NAME, THEME_STORAGE_KEY, theme);
    logger.info(`Sportis theme: saved "${theme}"`);
}

/**
 * Map Sportis theme value to Element's settings.
 * - "system" → use_system_theme=true
 * - "light"  → use_system_theme=false, theme="light"
 * - "dark"   → use_system_theme=false, theme="dark"
 */
export function mapSportisThemeToElement(sportisTheme: string): { useSystem: boolean; theme: string } {
    if (sportisTheme === "system") return { useSystem: true, theme: "light" };
    if (sportisTheme === "dark") return { useSystem: false, theme: "dark" };
    return { useSystem: false, theme: "light" };
}

/**
 * Map Element's current settings to Sportis theme value.
 * Reverse of mapSportisThemeToElement.
 */
export function mapElementThemeToSportis(useSystemTheme: boolean, currentTheme: string): string {
    if (useSystemTheme) return "system";
    return currentTheme.includes("dark") ? "dark" : "light";
}

// ─── Palette Sync ─────────────────────────────────────────────────────────────

/** Read palette preference from shared cookie/localStorage */
export function getSportisPalette(): string {
    return readPreference(PALETTE_COOKIE_NAME, PALETTE_STORAGE_KEY);
}

/** Write palette preference to shared cookie/localStorage */
export function setSportisPalette(palette: string): void {
    writePreference(PALETTE_COOKIE_NAME, PALETTE_STORAGE_KEY, palette);
}

/**
 * Apply Sportis palette to Compound design tokens.
 * Called after Element theme stylesheet is loaded.
 *
 * @param isDark - whether current theme is dark
 */
export function applySportisPalette(isDark: boolean): void {
    // Remove previous bridge style
    document.querySelector(`head > style[title='${STYLE_TITLE}']`)?.remove();

    const paletteId = getSportisPalette();
    const p = PALETTES[paletteId];
    if (!p) {
        logger.info(`Sportis palette: using default (no palette "${paletteId}" found)`);
        return;
    }

    if (paletteId) {
        logger.info(`Sportis palette: applying "${paletteId}" (${isDark ? "dark" : "light"})`);
    }

    // Sportis-namespace vars — bypasses Compound cascade entirely
    // PCSS variables reference these via var(--sportis-*, <default>)
    const sportisVars = [
        `--sportis-bg-canvas: ${isDark ? p["975"] : "#ffffff"}`,
        `--sportis-bg-system: ${isDark ? p["900"] : p["50"]}`,
        `--sportis-bg-panels: ${isDark ? p["800"] : p["100"]}`,
        `--sportis-bg-space-panel: ${isDark ? p["900"] : p["50"]}`,
        `--sportis-bg-room-list: ${isDark ? p["800"] : p["100"]}`,
        `--sportis-text-primary: ${isDark ? p["50"] : p["900"]}`,
        `--sportis-text-secondary: ${isDark ? p["200"] : p["700"]}`,
        `--sportis-border-subtle: ${isDark ? p["800"] : p["100"]}`,
        `--sportis-border-separator: ${isDark ? p["700"] : p["200"]}`,
        `--sportis-text-on-solid: ${isDark ? "#FFFFFF" : p["900"]}`,
        `--sportis-accent: ${p["500"]}`,
    ];

    // Also attempt Compound token overrides (works when unlayered > layered)
    const cpdVars = [
        `--cpd-color-bg-canvas-default: ${isDark ? p["975"] : "#ffffff"}`,
        `--cpd-color-bg-subtle-primary: ${isDark ? p["900"] : p["50"]}`,
        `--cpd-color-bg-subtle-secondary: ${isDark ? p["800"] : p["100"]}`,
        `--cpd-color-bg-action-primary-rest: ${p["500"]}`,
        `--cpd-color-bg-action-primary-hovered: ${isDark ? p["400"] : p["600"]}`,
        `--cpd-color-bg-action-primary-pressed: ${isDark ? p["300"] : p["700"]}`,
        `--cpd-color-text-primary: ${isDark ? p["50"] : p["900"]}`,
        `--cpd-color-text-secondary: ${isDark ? p["200"] : p["700"]}`,
        `--cpd-color-text-action-accent: ${isDark ? p["300"] : p["500"]}`,
        `--cpd-color-border-interactive-primary: ${isDark ? p["400"] : p["500"]}`,
        `--cpd-color-gray-200: ${isDark ? p["800"] : p["100"]}`,
        `--cpd-color-gray-300: ${isDark ? p["800"] : p["100"]}`,
        `--cpd-color-gray-400: ${isDark ? p["700"] : p["200"]}`,
        `--cpd-color-gray-600: ${isDark ? p["400"] : p["500"]}`,
        `--cpd-color-gray-800: ${isDark ? p["200"] : p["700"]}`,
        `--cpd-color-gray-900: ${isDark ? p["100"] : p["800"]}`,
        `--cpd-color-icon-tertiary: ${isDark ? p["400"] : p["500"]}`,
        `--cpd-color-icon-secondary: ${isDark ? p["300"] : p["600"]}`,
    ];

    const vars = [...sportisVars, ...cpdVars];

    // No @layer — must win over theme stylesheet via later source order
    const css = `:root, [class*="cpd-theme-"] { ${vars.join("; ")}; }`;
    const style = document.createElement("style");
    style.setAttribute("title", STYLE_TITLE);
    style.textContent = css;
    document.head.appendChild(style);
}
