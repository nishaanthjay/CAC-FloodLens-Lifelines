/** Camera padding that keeps what the camera frames in the visible gap between the open panels.
 * Desktop: left 400 (+ the 56 px rail and margins), right 380 when the insights panel is open, top 90, bottom 110. Mobile: the sheet's current height plus the time pill. */
export const mapPadding = (desktop: boolean, rightOpen: boolean, sheetPx: number) =>
  desktop ? { left: 500, right: rightOpen ? 430 : 90, top: 90, bottom: 120 } : { left: 24, right: 24, top: 110, bottom: sheetPx + 70 };

export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
