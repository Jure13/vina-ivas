let stockCache: { data: Record<string, number>; timestamp: number } | null = null;
const CACHE_DURATION = 5_000;

export function getStockCache(): Record<string, number> | null {
  const now = Date.now();
  if (stockCache && now - stockCache.timestamp < CACHE_DURATION) {
    return stockCache.data;
  }
  return null;
}

export function setStockCache(data: Record<string, number>) {
  stockCache = { data, timestamp: Date.now() };
}

export function invalidateStockCache() {
  stockCache = null;
  console.log("Stock cache invalidated");
}

export const STOCK_CACHE_DURATION = CACHE_DURATION;
