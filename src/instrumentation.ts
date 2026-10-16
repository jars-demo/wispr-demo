// Runs once when the server starts. Invalid configuration is reported here, loudly and by
// variable name, but does not crash the process: static pages and the health probe stay up,
// and routes that need configuration answer 503 until it is fixed.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { configProblem } = await import('@/server/config')
    const problem = configProblem()
    if (problem) {
      console.error(JSON.stringify({ level: 'error', event: 'config.invalid', detail: problem }))
    }
  }
}
