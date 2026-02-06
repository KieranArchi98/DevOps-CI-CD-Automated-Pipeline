/**
 * Health check endpoint for liveness probe
 * Returns OK if the Next.js process is running
 */
export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'llm-frontend',
    timestamp: Date.now(),
  });
}
