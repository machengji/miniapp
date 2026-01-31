# Cloud Functions - WeChat Cloud Development

## OVERVIEW
WeChat Cloud Functions for dream analysis and persistence. Production backend alternative to local Express server.

## STRUCTURE
```
cloudfunctions/
├── analyzeDream/   # AI analysis via Hunyuan model
└── saveDream/      # Save to cloud DB with AI summary
```

## WHERE TO LOOK
| Function | Entry | Purpose |
|----------|-------|---------|
| analyzeDream | index.js | Jungian AI analysis with SYSTEM_PROMPT |
| saveDream | index.js | Persist dream + generate summary title |

## CONVENTIONS
- Use `wx-server-sdk` for database access
- Return `{ errCode, errMsg }` error format
- Database collection: `dreams`

## ANTI-PATTERNS
- NEVER return plain strings - always return objects
- NEVER skip error handling in async operations
- NEVER store user secrets in cloud function code

## NOTES
- Deploy via WeChat DevTools Cloud Console
- Each function has its own package.json
- Uses Hunyuan AI model (cloud-integrated)
