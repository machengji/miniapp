# Miniprogram Pages

WeChat Mini Program pages with Page() lifecycle.

## OVERVIEW

index (journal), chat (streaming AI), logs (storage), report (analytics).

## STRUCTURE

```
pages/
├── index/     # Dream journal list from DB
├── chat/      # Streaming chat with memory injection
├── logs/      # Component-based log viewer
└── report/    # Jungian radar chart analytics
```

## WHERE TO LOOK

| Page | Purpose | Key Features |
|------|---------|--------------|
| `index/index.ts` | Journal list | `onShow()` load, map dreams |
| `chat/chat.ts` | Streaming AI | `<!-- think -->` parsing, memory injection |
| `logs/logs.ts` | Log viewer | Component (not Page), formatTime |
| `report/report.ts` | Analytics | Canvas radar chart, persona/shadow |

## CONVENTIONS

- **Lifecycle**: `onLoad()` (init), `onShow()` (refresh)
- **Data flow**: User → `onInput()` → `setData()` → render
- **Scroll**: `setData({ scrollTarget: 'bottom-anchor' })`
- **Metadata**: Capture mood/clarity before sending

## ANTI-PATTERNS

- **Direct mutation**: Use `this.setData()` ALWAYS
- **Blocking UI**: Async operations in handlers only
