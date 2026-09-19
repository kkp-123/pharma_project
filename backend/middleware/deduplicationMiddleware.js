// In-memory cache for in-flight requests and recent completions
const inFlightRequests = new Map();
const recentCompletions = new Map();

// Periodic cleanup of stale completions (older than 4 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of recentCompletions.entries()) {
    if (now - item.timestamp > 4000) {
      recentCompletions.delete(key);
    }
  }
}, 5000);

export const deduplicateRequests = (req, res, next) => {
  // Only intercept mutating operations (POST, PUT, PATCH, DELETE)
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method.toUpperCase())) {
    return next();
  }

  // Exempt auth / face / file uploads
  if (
    req.originalUrl.includes("/auth/") ||
    req.originalUrl.includes("/attendance/face") ||
    req.originalUrl.includes("/uploads")
  ) {
    return next();
  }

  const clientIdentifier = req.headers.authorization || req.ip || "anon";
  const bodyString = typeof req.body === "object" ? JSON.stringify(req.body) : "";
  const requestFingerprint = `${clientIdentifier}:${req.method.toUpperCase()}:${req.originalUrl}:${bodyString}`;

  // 1. Check if the exact same request finished in the last 3 seconds
  if (recentCompletions.has(requestFingerprint)) {
    const cached = recentCompletions.get(requestFingerprint);
    if (Date.now() - cached.timestamp < 3000) {
      return res.status(cached.statusCode).json(cached.body);
    }
  }

  // 2. Check if the exact same request is currently in-flight (processing right now)
  if (inFlightRequests.has(requestFingerprint)) {
    return res.status(409).json({
      success: false,
      isDuplicate: true,
      message: "An identical request is currently processing. Please wait for the initial request to complete."
    });
  }

  // Mark request as in-flight
  inFlightRequests.set(requestFingerprint, Date.now());

  // Intercept res.json to capture response and clear in-flight status
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    inFlightRequests.delete(requestFingerprint);

    // Save successful completions for 3-second deduplication
    if (res.statusCode >= 200 && res.statusCode < 400) {
      recentCompletions.set(requestFingerprint, {
        statusCode: res.statusCode,
        body,
        timestamp: Date.now()
      });
    }

    return originalJson(body);
  };

  // Ensure in-flight is cleared even on connection close / error
  res.on('close', () => {
    inFlightRequests.delete(requestFingerprint);
  });

  res.on('error', () => {
    inFlightRequests.delete(requestFingerprint);
  });

  next();
};
