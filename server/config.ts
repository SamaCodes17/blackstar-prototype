try {
  process.loadEnvFile();
} catch {
  /* Environment variables are sufficient in cloud deployments. */
}
export const publicOrigin =
  process.env.PUBLIC_ORIGIN ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://127.0.0.1:${process.env.PORT ?? 4173}`);
// Trust configured deployment origins only, never request-supplied forwarding headers.
export const allowedOrigins = [
  new URL(publicOrigin).origin,
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ...(new URL(publicOrigin).hostname === '127.0.0.1'
    ? [`http://localhost:${process.env.PORT ?? 4173}`]
    : []),
];
export const secureCookies = new URL(publicOrigin).protocol === 'https:';
