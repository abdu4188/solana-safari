// Custom event for point updates
export const POINTS_UPDATED_EVENT = "points-updated";

export const emitPointsUpdated = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(POINTS_UPDATED_EVENT));
  }
};

export const onPointsUpdated = (callback: () => void) => {
  if (typeof window !== "undefined") {
    window.addEventListener(POINTS_UPDATED_EVENT, callback);
    return () => window.removeEventListener(POINTS_UPDATED_EVENT, callback);
  }
  return () => {};
};
