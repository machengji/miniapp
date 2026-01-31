# Ale Aletheia - Jungian Psychology Miniapp

**Generated:** 2026-01-31
**Commit:** 6bfe5d6
**Branch:** main

## OVERVIEW
WeChat Mini Program for Jungian dream analysis with streaming AI responses. Dual backend: WeChat Cloud Functions OR local Express server.

## STRUCTURE
```
./
├── miniprogram/      # Frontend: TypeScript + SCSS, streaming chat
├── cloudfunctions/   # WeChat Cloud: analyzeDream, saveDream
├── server/           # Express backend: DeepSeek API proxy with SSE
├── typings/          # WeChat API type definitions
├── miniapp/          # Cross-platform resources (iOS/Android)
└── AGENTS.md        # This file
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Chat streaming UI | `miniprogram/pages/chat/chat.ts` | `` tag parsing |
| Dream journal | `miniprogram/pages/index/index.ts` | List view |
| Radar chart | `miniprogram/pages/report/report.ts` | Custom Canvas |
| Local server | `server/index.js` | SSE streaming endpoint |
| Cloud functions | `cloudfunctions/analyzeDream/` | Hunyuan AI |

## CONVENTIONS

### TypeScript
- **Strict mode enabled**: All strict checks (see tsconfig.json)
- **No implicit any**, no unused locals/parameters
- **Target**: ES2020, CommonJS modules

### Naming
- **Components**: kebab-case (`navigation-bar`)
- **Files**: kebab-case for components, camelCase for TS files
- **Functions**: camelCase (`sendMessage`, `toggleThought`)
- **Interfaces**: PascalCase (`IAppOption`)

### Error Handling
```typescript
try {
  // operation
} catch (err: any) {
  console.error('Failed:', err);
  // Handle gracefully
}
```

## ANTI-PATTERNS (THIS PROJECT)

### Type Safety
- **NO** `as any` type assertions in new code
- **NO** `any` parameters - define interfaces for events
- **NO** `@ts-ignore` - use proper types

### WeChat Patterns
- **NO** direct `this.data` mutation - always use `this.setData()`
- **NO** browser APIs (`window`, `document`) - use `wx.*` APIs
- **NO** synchronous AI calls - use `await`

### Production
- **NO** `console.log` in deployed miniprogram - use proper logging
- **NO** hardcoded environment IDs in production

## UNIQUE STYLES

### Dual Backend Mode
Can switch between:
- **WeChat Cloud Functions** (production): `analyzeDream`, `saveDream`
- **Local Express Server** (dev): SSE streaming to DeepSeek API

### Chain of Thought Parsing
`` tags extract AI reasoning for display:
```typescript
const thinkStart = fullText.indexOf('');
const thinkEnd = fullText.indexOf('');
// Extract thought vs content separately
```

### Memory Injection
Last 5 dreams loaded and injected into AI context for pattern recognition:
```typescript
// Format: "【长期记忆档案】\n1. [date] [mood] summary..."
```

### Custom Visualization
Canvas-based Jungian 12-archetype radar chart (no chart libraries)

## COMMANDS
```bash
# Frontend (WeChat DevTools)
# Open project root in WeChat DevTools
# TS/SCSS compiled automatically

# Backend (Local Server)
cd server
npm install
npm start          # Port 8080
npm run dev        # Watch mode

# Cloud Functions
cd cloudfunctions/analyzeDream && npm install
cd cloudfunctions/saveDream && npm install
# Deploy via WeChat DevTools cloud console
```

## NOTES

### Database Schema (dreams collection)
- `content`: string - dream content
- `analysis`: string - AI response with think tags
- `mood`: string - selected mood (焦虑/恐惧/喜悦/etc.)
- `clarity`: number (1-5)
- `summary`: string - AI-generated title
- `createTime`: timestamp

### Multi-Platform Architecture
- `project.config.json` - WeChat configuration
- `project.miniapp.json` - Cross-platform (iOS/Android)
- `miniapp/` - Multi-platform native resources

### Special Considerations
- Skyline rendering enabled (lib 3.7.1+)
- Glass-Easel component framework
- Mock mode: Server returns demo data when API key missing
- No superstition policy enforced in system prompts
