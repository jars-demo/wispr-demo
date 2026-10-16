// Runs once when the server starts. Validating config here makes a bad deploy fail fast
// instead of failing on the first request that happens to need a variable.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getConfig } = await import('@/server/config')
    getConfig()
  }
}
