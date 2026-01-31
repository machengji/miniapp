# Server - Express Backend

## OVERVIEW
Express server proxy for DeepSeek API with SSE streaming. Alternative to WeChat cloud functions.

## WHERE TO LOOK
| Endpoint | Handler | Notes |
|----------|---------|-------|
| POST /chat | lines 31-140 | Main chat endpoint with streaming |
| System prompt | lines 15-29 | Jungian persona definition |

## CONVENTIONS
- CORS enabled for dev (can be restricted in production)
- SSE responses: `text/event-stream` Content-Type
- Message format: `{ type: 'thinking' | 'content', content: string }`

## ANTI-PATTERNS
- NEVER forget `res.flushHeaders()` before streaming
- NEVER block the event loop (stream with async iteration)
- NEVER send `data: [DONE]\n\n` multiple times

## NOTES
- Mock mode when `DEEPSEEK_API_KEY` not configured
- Port configurable via `PORT` env var (default 8080)
