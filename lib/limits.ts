// Free-plan quotas, enforced at the presign endpoint (the single chokepoint
// every upload passes through). Becomes per-plan values when billing lands.
export const FREE_MAX_IMAGES = 1000;
export const FREE_MAX_STORAGE_BYTES = 1024 * 1024 * 1024; // 1 GB

// Each SAM call costs real money on fal.ai — cap per user per day.
export const SAM_DAILY_LIMIT = 100;
