let cacheHitCount = 0;
let cacheMissCount = 0;

export function incrementMetric(metricName: 'cacheHit' | 'cacheMiss') {
  if (metricName === 'cacheHit') {
    cacheHitCount++;
  } else if (metricName === 'cacheMiss') {
    cacheMissCount++;
  }

  // Optional: log to console for debugging
  console.log(`📊 Metric incremented: ${metricName}`);
}

export function getMetrics() {
  return {
    cacheHitCount,
    cacheMissCount,
  };
}
