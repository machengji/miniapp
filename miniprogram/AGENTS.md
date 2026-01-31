# Miniprogram Frontend

## OVERVIEW
Main miniprogram frontend: chat interface with streaming `` tag parsing, dream metadata input, and journal history.

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Chat streaming UI | `pages/chat/chat.ts` (~269 lines) |
| Entry point | `app.ts` (cloud init) |
| Page routing | `app.json` |
| App-wide styles | `app.scss` |

## CONVENTIONS

### Page Structure
```typescript
Page({
  data: { /* state */ },
  onLoad() { /* init */ },
  sendMessage() { /* async */ },
  // Custom methods
})
```

### State Updates
```typescript
this.setData({ key: value })  // ALWAYS
// BAD: this.data.key = value
```

### Message Type
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thought?: string;
  isThoughtExpanded?: boolean;
  isStreaming?: boolean;
}
```

## ANTI-PATTERNS
- **NO** direct `this.data` mutation
- **NO** `any` types - TypeScript strict mode
- **NO** synchronous AI calls - use `await`

## UNIQUE STYLES

### Stream Parsing (chat.ts lines 173-193)
Real-time `` tag extraction:
```typescript
const thinkStart = fullText.indexOf('');
const thinkEnd = fullText.indexOf('');
if (thinkStart !== -1 && thinkEnd !== -1) {
  thought = fullText.substring(thinkStart + 7, thinkEnd);
  content = fullText.substring(thinkEnd + 8);
}
```

### Memory Injection (lines 123-147)
Fetches last 5 dreams, formats as context:
```
【长期记忆档案】
1. [date] [mood] summary: snippet
【对比分析指令】
请对比历史梦境寻找重复意象...
```

## NOTES
- Custom navigation bar: `navigationStyle: "custom"` in app.json
- Skyline rendering: enabled (lib 3.7.1+)
