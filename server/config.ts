try {
  process.loadEnvFile();
} catch {
  /* Environment variables are sufficient in cloud deployments. */
}
export const publicOrigin =
  process.env.PUBLIC_ORIGIN ?? `http://127.0.0.1:${process.env.PORT ?? 4173}`;
export const secureCookies = new URL(publicOrigin).protocol === 'https:';
