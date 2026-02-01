# 赛博焚香 - 微信小程序实现工作计划

## TL;DR

> **Quick Summary**: 实现一个"赛博焚香"微信小程序，包含Canvas燃烧动画、ASMR音效、功德计算系统和激励视频广告解锁功能。
> 
> **Deliverables**: 
> - 主殿页面（选择祈福类型）
> - 香炉页面（Canvas燃烧动画+烟雾粒子系统）
> - 功德系统（本地存储+飘字动画）
> - 香铺页面（激励视频解锁赛博电子烟）
> - 代烧功能（生成分享海报）
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: 配置更新 → 页面创建 → 组件开发 → 功能集成

---

## Context

### Original Request
基于"电子木鱼"和"寺庙经济"爆发的趋势，开发一个"赛博焚香"微信小程序。核心差异化是"香燃烧"的延迟满足（30-60秒）创造冥想空白期，包含Canvas燃烧动画、ASMR音效、功德计算、随机断香机制、代烧功能和激励视频广告。

### Interview Summary
**Key Discussions**:
- **云排行榜**: 用户选择仅本地存储（不实现云端排行榜）
- **广告变现**: 使用微信测试广告单元ID

**Technical Decisions**:
- 使用 TypeScript 严格模式
- Canvas 2D 用于香燃烧动画
- wx.createInnerAudioContext + Web Audio API 用于音效
- wx.setStorageSync 用于本地功德存储
- 激励视频使用测试 ID

### Metis Review
**Self-Analysis** (Metis unavailable, performed manual gap analysis):

**Identified Gaps & Resolutions**:
- **音频资源路径**: 需要创建音频文件夹并添加占位文件
- **图片资源路径**: 需要创建图片文件夹并添加占位文件
- **微信小程序配置**: 需要在 app.json 中注册新页面
- **组件复用**: 需要创建可复用的 Canvas 组件
- **类型定义**: 需要为功德、香类型等定义 TypeScript 接口

**Guardrails Applied**:
- ✅ 仅本地存储（无云开发配置）
- ✅ 使用测试广告 ID
- ✅ 不实现真实寺庙合作
- ✅ 不实现复杂用户系统（匿名）

---

## Work Objectives

### Core Objective
实现一个完整的"赛博焚香"微信小程序，提供沉浸式的数字祈福体验，通过延迟满足和社交功能提升用户粘性。

### Concrete Deliverables
- `miniprogram/pages/index/index.*` - 主殿页面（选择祈福类型）
- `miniprogram/pages/altar/altar.*` - 香炉页面（核心燃烧动画）
- `miniprogram/pages/merit/merit.*` - 功德簿页面
- `miniprogram/pages/shop/shop.*` - 香铺页面（解锁赛博电子烟）
- `miniprogram/components/incense-canvas/incense-canvas.*` - 香燃烧 Canvas 组件
- `miniprogram/components/merit-popup/merit-popup.*` - 功德+1飘字组件
- `miniprogram/components/smoke-particle/smoke-particle.*` - 烟雾粒子组件
- `miniprogram/utils/audio-engine.ts` - 音效引擎
- `miniprogram/utils/merit-storage.ts` - 功德存储管理
- `miniprogram/utils/types.ts` - 类型定义
- `miniprogram/assets/audio/*` - 音频资源
- `miniprogram/assets/images/*` - 图片资源

### Definition of Done
- [ ] 所有页面和组件文件创建完成
- [ ] 燃烧动画流畅（60fps）
- [ ] 音效正常播放（循环、随机噼啪声）
- [ ] 功德系统正常存储和计算
- [ ] 激励视频广告可以展示（测试环境）
- [ ] 代烧海报可以生成和分享

### Must Have
- Canvas 燃烧动画（渐变色、火星、香灰）
- ASMR 音效引擎（循环播放、随机噼啪声）
- 本地功德存储（加密防篡改）
- 随机断香机制（1%概率）
- 飘字动画（功德+1）
- 激励视频解锁赛博电子烟

### Must NOT Have (Guardrails)
- 云开发配置和云函数
- 真实广告位 ID（仅使用测试 ID）
- 复杂的用户认证系统
- 实时数据同步
- 付费功能（仅广告解锁）

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO
- **User wants tests**: Manual-only
- **Framework**: None

### Manual Verification (WECHAT MINIPROGRAM)

**Verification Method**: 使用微信开发者工具进行手动测试

**By Page Type:**

| Type | Verification Tool | Manual Procedure |
|------|------------------|-------------------|
| **Main Hall Page** | 微信开发者工具预览 | 1. 打开小程序 2. 验证四个祈福类型按钮可点击 3. 点击任意按钮跳转到香炉页 |
| **Altar Page** | 微信开发者工具预览 | 1. 进入香炉页 2. 验证香可以插入 3. 长按点火 4. 观察燃烧动画 5. 监听音效 |
| **Merit System** | 微信开发者工具预览 | 1. 完成烧香 2. 验证功德+1飘字动画 3. 查看功德簿页面累计功德 |
| **Shop Page** | 微信开发者工具预览 | 1. 进入香铺页 2. 点击解锁赛博电子烟 3. 验证激励视频广告弹出 4. 完成广告后解锁成功 |
| **Proxy Burning** | 微信开发者工具预览 | 1. 完成烧香 2. 点击代烧按钮 3. 验证海报生成 4. 验证分享功能 |

**Evidence Requirements:**
- 截图：每个页面的 UI 展示
- 录屏：燃烧动画流程
- 日志：音效播放、功德存储日志

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: 更新 app.json 配置（注册新页面）
├── Task 2: 创建类型定义文件
└── Task 3: 创建项目目录结构（components, assets）

Wave 2 (After Wave 1):
├── Task 4: 创建工具模块（audio-engine.ts, merit-storage.ts）
├── Task 5: 创建页面结构（index, altar, merit, shop）
└── Task 6: 创建组件结构（incense-canvas, merit-popup, smoke-particle）

Wave 3 (After Wave 2):
├── Task 7: 实现音效引擎
├── Task 8: 实现功德存储
└── Task 9: 实现主殿页面逻辑

Wave 4 (After Wave 3):
├── Task 10: 实现 Canvas 燃烧动画组件
├── Task 11: 实现香炉页面逻辑
└── Task 12: 实现飘字动画组件

Wave 5 (After Wave 4):
├── Task 13: 实现香铺页面（激励视频）
└── Task 14: 实现代烧功能（海报生成）

Wave 6 (After Wave 5):
└── Task 15: 添加音频和图片资源占位文件

Critical Path: Task 1 → Task 4 → Task 7 → Task 10 → Task 11 → Task 13 → Task 15
Parallel Speedup: ~35% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 4, 5, 6 | 2, 3 |
| 2 | None | 4, 8 | 1, 3 |
| 3 | None | 6 | 1, 2 |
| 4 | 1, 2 | 7, 8 | 5, 6 |
| 5 | 1 | 9 | 4, 6 |
| 6 | 1, 3 | 10, 12 | 4, 5 |
| 7 | 4 | 9 | 8 |
| 8 | 2, 4 | 9 | 7 |
| 9 | 7, 8 | 10, 11 | None |
| 10 | 6, 9 | 11 | 12 |
| 11 | 9, 10 | 13 | 12 |
| 12 | 6 | 11 | 10 |
| 13 | 11 | 14 | None |
| 14 | 11 | 15 | None |
| 15 | 13, 14 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2, 3 | delegate_task(category="quick", load_skills=[], run_in_background=true) |
| 2 | 4, 5, 6 | delegate_task(category="quick", load_skills=[], run_in_background=true) |
| 3 | 7, 8, 9 | delegate_task(category="quick", load_skills=[], run_in_background=true) |
| 4 | 10, 11, 12 | delegate_task(category="visual-engineering", load_skills=[], run_in_background=false) |
| 5 | 13, 14 | delegate_task(category="quick", load_skills=[], run_in_background=false) |
| 6 | 15 | delegate_task(category="quick", load_skills=[], run_in_background=false) |

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info.

- [ ] 1. 更新 app.json 配置（注册新页面）

  **What to do**:
  - 在 `miniprogram/app.json` 中添加新页面路由：
    - `pages/index/index` (主殿页)
    - `pages/altar/altar` (香炉页)
    - `pages/merit/merit` (功德簿)
    - `pages/shop/shop` (香铺)
  - 更新 `navigationBarTitleText` 为 "赛博焚香"
  - 设置 `navigationBarBackgroundColor` 为深色主题

  **Must NOT do**:
  - 不要删除原有的 pages/logs 路由（可以保留或删除）
  - 不要修改其他配置项

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple JSON configuration update
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**: None

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5, 6
  - **Blocked By**: None (can start immediately)

  **References**:

  **Configuration References**:
  - `miniprogram/app.json` - Current app configuration with pages array

  **Acceptance Criteria**:

  **Automated Verification (JSON validation)**:
  ```bash
  # Agent runs:
  cat miniprogram/app.json | jq '.pages'
  # Assert: Contains "pages/index/index", "pages/altar/altar", "pages/merit/merit", "pages/shop/shop"
  
  cat miniprogram/app.json | jq '.window.navigationBarTitleText'
  # Assert: Equals "赛博焚香"
  ```

  **Evidence to Capture**:
  - [ ] app.json 内容更新后的完整 JSON

  **Commit**: NO

- [ ] 2. 创建类型定义文件

  **What to do**:
  - 创建 `miniprogram/utils/types.ts`
  - 定义接口：
    - `IncenseType`: 'normal' | 'cyber'
    - `PrayerType`: 'career' | 'love' | 'health' | 'enemy'
    - `MeritRecord`: { count: number, types: Array<{ type: PrayerType, time: number, amount: number }> }
    - `BurnHistory`: Array<{ broken: boolean, time: number }>
    - `IncenseConfig`: { id: string, name: string, cost: number | string, icon: string, desc: string }

  **Must NOT do**:
  - 不要使用 `any` 类型
  - 不要添加未使用的类型

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: TypeScript interface definitions
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**: None

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 4, 8
  - **Blocked By**: None (can start immediately)

  **References**:

  **Type Reference**:
  - `miniprogram/utils/util.ts` - Existing utility file pattern

  **Acceptance Criteria**:

  **Automated Verification (TypeScript compilation)**:
  ```bash
  # Agent runs:
  npx tsc --noEmit miniprogram/utils/types.ts
  # Assert: No compilation errors
  ```

  **Evidence to Capture**:
  - [ ] types.ts 文件内容

  **Commit**: NO

- [ ] 3. 创建项目目录结构

  **What to do**:
  - 创建以下目录：
    - `miniprogram/components/incense-canvas/`
    - `miniprogram/components/merit-popup/`
    - `miniprogram/components/smoke-particle/`
    - `miniprogram/assets/audio/`
    - `miniprogram/assets/images/`
    - `miniprogram/pages/altar/`
    - `miniprogram/pages/merit/`
    - `miniprogram/pages/shop/`

  **Must NOT do**:
  - 不要在目录中创建文件（只创建目录结构）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Directory structure creation
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**: None

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 6
  - **Blocked By**: None (can start immediately)

  **Acceptance Criteria**:

  **Automated Verification (Directory existence)**:
  ```bash
  # Agent runs:
  ls -d miniprogram/components/incense-canvas miniprogram/components/merit-popup miniprogram/components/smoke-particle
  # Assert: All directories exist
  
  ls -d miniprogram/assets/audio miniprogram/assets/images
  # Assert: All directories exist
  
  ls -d miniprogram/pages/altar miniprogram/pages/merit miniprogram/pages/shop
  # Assert: All directories exist
  ```

  **Evidence to Capture**:
  - [ ] 目录结构树状图

  **Commit**: NO

- [ ] 4. 创建工具模块骨架

  **What to do**:
  - 创建 `miniprogram/utils/audio-engine.ts` - 音效引擎骨架
  - 创建 `miniprogram/utils/merit-storage.ts` - 功德存储骨架
  - 每个文件创建基础的类/函数导出

  **Must NOT do**:
  - 不要实现具体逻辑（只创建骨架）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: File creation with basic exports
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**: None

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Tasks 7, 8
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Reference Pattern**:
  - `miniprogram/utils/util.ts` - Utility file pattern

  **Acceptance Criteria**:

  **Automated Verification (TypeScript compilation)**:
  ```bash
  # Agent runs:
  npx tsc --noEmit miniprogram/utils/audio-engine.ts miniprogram/utils/merit-storage.ts
  # Assert: No compilation errors
  ```

  **Evidence to Capture**:
  - [ ] audio-engine.ts 文件内容
  - [ ] merit-storage.ts 文件内容

  **Commit**: NO

- [ ] 5. 创建页面文件骨架

  **What to do**:
  - 为每个页面创建四个文件：
    - `miniprogram/pages/altar/altar.ts`
    - `miniprogram/pages/altar/altar.wxml`
    - `miniprogram/pages/altar/altar.wxss`
    - `miniprogram/pages/altar/altar.json`
  - 重复创建 `merit` 和 `shop` 页面
  - 每个 .ts 文件创建基础的 Page({}) 结构
  - 每个 .json 文件创建基础的 {}

  **Must NOT do**:
  - 不要实现具体逻辑（只创建骨架）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Multiple file creation
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**: None

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6)
  - **Blocks**: Task 9
  - **Blocked By**: Task 1

  **References**:

  **Reference Pattern**:
  - `miniprogram/pages/index/index.ts` - Page structure pattern
  - `miniprogram/pages/index/index.wxml` - WXML pattern
  - `miniprogram/pages/index/index.wxss` - WXSS pattern

  **Acceptance Criteria**:

  **Automated Verification (File existence)**:
  ```bash
  # Agent runs:
  ls miniprogram/pages/altar/altar.*
  ls miniprogram/pages/merit/merit.*
  ls miniprogram/pages/shop/shop.*
  # Assert: All .ts, .wxml, .wxss, .json files exist
  ```

  **Evidence to Capture**:
  - [ ] 创建的文件列表

  **Commit**: NO

- [ ] 6. 创建组件文件骨架

  **What to do**:
:
  - 为每个组件创建四个文件：
    - `miniprogram/components/incense-canvas/incense-canvas.ts`
    - `miniprogram/components/incense-canvas/incense-canvas.wxml`
    - `miniprogram/components/incense-canvas/incense-canvas.wxss`
    - `miniprogram/components/incense-canvas/incense-canvas.json`
  - 重复创建 `merit-popup` 和 `smoke-particle` 组件
  - 每个 .ts 文件创建基础的 Component({}) 结构
  - 每个 .json 文件设置 `"component": true`

  **Must NOT do**:
  - 不要实现具体逻辑（只创建骨架）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Multiple file creation
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**: None

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Tasks 10, 12
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Reference Pattern**:
  - 无现有组件，使用微信小程序标准组件模式

  **Acceptance Criteria**:

  **Automated Verification (File existence)**:
  ```bash
  # Agent runs:
  ls miniprogram/components/incense-canvas/incense-canvas.*
  ls miniprogram/components/merit-popup/merit-popup.*
  ls miniprogram/components/smoke-particle/smoke-particle.*
  # Assert: All .ts, .wxml, .wxss, .json files exist
  ```

  **Evidence to Capture**:
  - [ ] 创建的组件文件列表

  **Commit**: NO

- [ ] 7. 实现音效引擎

  **What to do**:
  - 在 `miniprogram/utils/audio-engine.ts` 中实现 AudioEngine 类：
    - `constructor()`: 初始化 innerAudioContext 和 Web Audio API
    - `startBurningSound()`: 开始循环播放烧纸声
    - `stopBurningSound()`: 停止播放
    - `playMeritSound()`: 播放功德铃声（清脆）
    - `playBrokenSound()`: 播放断香音效（低沉）
    - `scheduleCrackles()`: 随机添加噼啪声
    - `setupNoiseBuffer()`: 设置白噪音缓冲区

  **Must NOT do**:
  - 不要实现 UI 相关代码
  - 不要直接操作 DOM（仅音频）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Audio engine implementation
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**: None

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9)
  - **Blocks**: Task 9
  - **Blocked By**: Task 4

  **References**:

  **API References**:
  - WeChat docs: `wx.createInnerAudioContext()` - InnerAudioContext API
  - Web Audio API: `AudioContext` - Browser Web Audio API

  **Acceptance Criteria**:

  **Automated Verification (TypeScript compilation)**:
  ```bash
  # Agent runs:
  npx tsc --noEmit miniprogram/utils/audio-engine.ts
  # Assert: No compilation errors
  ```

  **Evidence to Capture**:
  - [ ] audio-engine.ts 完整代码

  **Commit**: NO

- [ ] 8. 实现功德存储

  **What to do**:
  - 在 `miniprogram/utils/merit-storage.ts` 中实现 MeritManager 对象：
    - `addMerit(amount, type)`: 添加功德并存储
    - `getTodayMerit()`: 获取今日功德
    - `getTotalMerit()`: 获取总功德
    - `checkRandomBreak()`: 随机断香检查
    - `getMeritHistory()`: 获取功德历史

  **Must NOT do**:
  - 不要实现云端同步
  - 不要实现作弊检测复杂逻辑

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Storage utility implementation
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**: None

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 9)
  - **Blocks**: Task 9
  - **Blocked By**: Tasks 2, 4

  **References**:

  **API References**:
  - WeChat docs: `wx.setStorageSync()` - Sync storage API
  - WeChat docs: `wx.getStorageSync()` - Get storage API

  **Acceptance Criteria**:

  **Automated Verification (TypeScript compilation)**:
  ```bash
  # Agent runs:
  npx tsc --noEmit miniprogram/utils/merit-storage.ts
  # Assert: No compilation errors
  ```

  **Evidence to Capture**:
  - [ ] merit-storage.ts 完整代码

  **Commit**: NO

- [ ] 9. 实现主殿页面逻辑

  **What to do**:
  - 在 `miniprogram/pages/index/index.ts` 中实现：
    - 定义祈福类型数组（事业、姻缘、健康、冤家退散）
    - `data`: 包含 prayerTypes, selectedType
    - `onPrayerSelect(event)`: 处理祈福类型选择，跳转到香炉页
    - `onShowMerit()`: 跳转到功德簿页面
  - 在 `miniprogram/pages/index/index.wxml` 中实现：
    - 四个祈福类型按钮（使用 flex 布局）
    - 底部功德悬浮球
  - 在 `miniprogram/pages/index/index.wxss` 中实现：
    - 页面背景样式（寺庙风格）
    - 按钮样式
    - 悬浮球样式

  **Must NOT do**:
  - 不要添加复杂的动画（仅基础交互）
  - 不要实现后端调用

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Page UI and interaction implementation
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**: None

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Tasks 10, 11
  - **Blocked By**: Tasks 7, 8

  **References**:

  **Reference Pattern**:
  - `miniprogram/pages/index/index.ts` - Current page structure
  - `miniprogram/pages/index/index.wxml` - Current WXML structure
  - `miniprogram/pages/index/index.wxss` - Current WXSS structure

  **Acceptance Criteria**:

  **Automated Verification (TypeScript compilation)**:
  ```bash
  # Agent runs:
  npx tsc --noEmit miniprogram/pages/index/index.ts
  # Assert: No compilation errors
  ```

  **Evidence to Capture**:
  - [ ] index.ts 代码
  - [ ] index.wxml 代码
  - [ ] index.wxss 代码

  **Commit**: NO

- [ ] 10. 实现 Canvas 燃烧动画组件

  **What to do**:
  - 在 `miniprogram/components/incense-canvas/incense-canvas.ts` 中实现：
    - `data`: progress, isBurning, ashSegments, brokenAlert
    - `startBurning(incenseType)`: 开始燃烧
    - `drawIncense(ctx, progress, type)`: 绘制香体渐变
    - `drawBrokenEffect(ctx, breakPoint)`: 绘制断裂效果
    - 触发事件：`incenseBroken`, `burnComplete`
  - 在 `miniprogram/components/incense-canvas/incense-canvas.wxml` 中实现：
    - Canvas 元素
  - 在 `miniprogram/components/incense-canvas/incense-canvas.wxss` 中实现：
    - Canvas 样式（固定尺寸）
  - 在 `miniprogram/components/incense-canvas/incense-canvas.json` 中配置：
    - component: true

  **Must NOT do**:
  - 不要使用外部 Canvas 库（仅原生 Canvas 2D）
  - 不要实现复杂的物理引擎

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Canvas animation implementation
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**: None

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 11
  - **Blocked By**: Tasks 6, 9

  **References**:

  **API References**:
  - WeChat docs: `wx.createCanvasContext()` - Canvas 2D API
  - Canvas 2D docs: `CanvasGradient` - Gradient API

  **Acceptance Criteria**:

  **Automated Verification (TypeScript compilation)**:
  ```bash
  # Agent runs:
  npx tsc --noEmit miniprogram/components/incense-canvas/incense-canvas.ts
  # Assert: No compilation errors
  ```

  **Evidence to Capture**:
  - [ ] incense-canvas.ts 完整代码
  - [ ] incense-canvas.wxml 代码
  - [ ] incense-canvas.wxss 代码

  **Commit**: NO

- [ ] 11. 实现香炉页面逻辑

  **What to do**:
  - 在 `miniprogram/pages/altar/altar.ts` 中实现：
    - `onLoad(options)`: 接收祈福类型参数
    - `onReady()`: 初始化 Canvas 和音效
    - `onInsertIncense()`: 插入香（动画）
    - `onLongPressIgnite()`: 长按点火
    - `onBurningProgress()`: 燃烧进度更新
    - `onBurnComplete()`: 燃烧完成，增加功德
    - `onIncenseBroken()`: 处理断香
  - 在 `miniprogram/pages/altar/altar.wxml` 中实现：
    - 香炉背景
    - incense-canvas 组件
    - 点火提示
    - 燃烧进度条
  - 在 `miniprogram/pages/altar/altar.wxss` 中实现：
    - 香炉样式
    - 火焰动画效果

  **Must NOT do**:
  - 不要实现复杂的 3D 效果
  - 不要实现网络请求

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Core page with Canvas and animations
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**: None

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Tasks 13
  - **Blocked By**: Tasks 9, 10

  **References**:

  **Reference Pattern**:
  - `miniprogram/components/incense-canvas/incense-canvas.ts` - Canvas component API
  - `miniprogram/utils/audio-engine.ts` - Audio engine API
  - `miniprogram/utils/merit-storage.ts` - Merit storage API

  **Acceptance Criteria**:

  **Automated Verification (TypeScript compilation)**:
  ```bash
  # Agent runs:
  npx tsc --noEmit miniprogram/pages/altar/altar.ts
  # Assert: No compilation errors
  ```

  **Evidence to Capture**:
  - [ ] altar.ts 完整代码
  - [ ] altar.wxml 代码
  - [ ] altar.wxss 代码

  **Commit**: NO

- [ ] 12. 实现飘字动画组件

  **What to do**:
  - 在 `miniprogram/components/merit-popup/merit-popup.ts` 中实现：
    - `properties`: amount, position
    - `onReady()`: 触发动画
    - `onAnimationEnd()`: 销毁组件
  - 在 `miniprogram/components/merit-popup/merit-popup.wxml` 中实现：
    - 飘字元素
  - 在 `miniprogram/components/merit-popup/merit-popup.wxss` 中实现：
    - floatUp 动画（向上飘浮 + 渐隐）

  **Must NOT do**:
  - 不要实现复杂的粒子系统
  - 不要实现网络请求

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: CSS animation component
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**: None

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 10, 11)
  - **Blocks**: Task 11
  - **Blocked By**: Task 6

  **References**:

  **Reference Pattern**:
  - 无现有飘字组件，使用 CSS 动画标准模式

  **Acceptance Criteria**:

  **Automated Verification (TypeScript compilation)**:
  ```bash
  # Agent runs:
  npx tsc --noEmit miniprogram/components/merit-popup/merit-popup.ts
  # Assert: No compilation errors
  ```

  **Evidence to Capture**:
  - [ ] merit-popup.ts 代码
  - [ ] merit-popup.wxml 代码
  - [ ] merit-popup.wxss 代码

  **Commit**: NO

- [ ] 13. 实现香铺页面（激励视频）

  **What to do**:
  - 在 `miniprogram/pages/shop/shop.ts` 中实现：
    - `data`: incenseTypes, cyberUnlocked
    - `onLoad()`: 检查赛博电子烟解锁状态
    - `unlockCyberIncense()`: 展示激励视频广告
    - `onAdClose(event)`: 处理广告关闭
    - `onAdError(event)`: 处理广告错误
  - 在 `miniprogram/pages/shop/shop.wxml` 中实现：
    - 香类型列表
    - 赛博电子烟锁定/解锁状态
    - 解锁按钮
  - 在 `miniprogram/pages/shop/shop.wxss` 中实现：
    - 香铺样式
    - 锁定动画效果

  **Must NOT do**:
  - 不要实现真实的广告位（使用测试 ID）
  - 不要实现付费功能

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Page with ad integration
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**: None

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Task 14)
  - **Blocks**: Task 15
  - **Blocked By**: Task 11

  **References**:

  **API References**:
  - WeChat docs: `wx.createRewardedVideoAd()` - Rewarded video ad API
  - Test ad unit ID: `adunit-xxxxxxxxxxx`

  **Acceptance Criteria**:

  **Automated Verification (TypeScript compilation)**:
  ```bash
  # Agent runs:
  npx tsc --noEmit miniprogram/pages/shop/shop.ts
  # Assert: No compilation errors
  ```

  **Evidence to Capture**:
  - [ ] shop.ts 完整代码
  - [ ] shop.wxml 代码
  - [ ] shop.wxss 代码

  **Commit**: NO

- [ ] 14. 实现代烧功能（海报生成）

  **What to do**:
  - 在香炉页面（`miniprogram/pages/altar/altar.ts`）中添加：
    - `onProxyBurn()`: 生成代烧海报
    - `onSharePoster()`: 分享海报
  - 使用 `wx.canvasToTempFilePath()` 生成海报图片
  - 使用 `wx.showShareMenu()` 展示分享菜单

  **Must NOT do**:
  - 不要实现复杂的海报模板系统
  - 不要实现网络上传

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Social feature implementation
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**: None

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Task 13)
  - **Blocks**: Task 15
  - **Blocked By**: Task 11

  **References**:

  **API References**:
  - WeChat docs: `wx.canvasToTempFilePath()` - Canvas to image API
  - WeChat docs: `wx.showShareMenu()` - Share menu API

  **Acceptance Criteria**:

  **Automated Verification (TypeScript compilation)**:
  ```bash
  # Agent runs:
  npx tsc --noEmit miniprogram/pages/altar/altar.ts
  # Assert: No compilation errors
  ```

  **Evidence to Capture**:
  - [ ] altar.ts 更新后的代码

  **Commit**: NO

- [ ] 15. 添加音频和图片资源占位文件

  **What to do**:
  - 创建音频占位文件（空文件或白噪音）：
    - `miniprogram/assets/audio/burning-paper.mp3`
    - `miniprogram/assets/audio/merit-ding.mp3`
    - `miniprogram/assets/audio/broken-sad.mp3`
  - 创建图片占位文件（可以使用 base64 或简单 SVG）：
    - `miniprogram/assets/images/censer.png` (香炉)
    - `miniprogram/assets/images/smoke.png` (烟雾)
    - `miniprogram/assets/icons/career.png` (事业图标)
    - `miniprogram/assets/icons/images/love.png` (姻缘图标)
    - `miniprogram/assets/icons/images/health.png` (健康图标)
    - `miniprogram/assets/icons/images/enemy.png` (冤家图标)

  **Must NOT do**:
  - 不要添加真实的音频文件（仅占位）
  - 不要添加真实的图片文件（仅占位）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Asset placeholder creation
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**: None

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: None (final)
  - **Blocked By**: Tasks 13, 14

  **References**:

  **Acceptance Criteria**:

  **Automated Verification (File existence)**:
  ```bash
  # Agent runs:
  ls miniprogram/assets/audio/*.mp3
  ls miniprogram/assets/images/*.png
  # Assert: All files exist
  ```

  **Evidence to Capture**:
  - [ ] 资源文件列表

  **Commit**: NO

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 15 | `feat: initial cyber incense implementation` | All files | npx tsc --noEmit |

---

## Success Criteria

### Verification Commands
```bash
# TypeScript compilation check
npx tsc --noEmit

# File structure check
find miniprogram -type f -name "*.ts" | wc -l

# Page registration check
cat miniprogram/app.json | jq '.pages'
```

### Final Checklist
- [ ] 所有页面和组件文件创建完成
- [ ] TypeScript 编译无错误
- [ ] 燃烧动画实现
- [ ] 音效引擎实现
- [ ] 功德存储实现
- [ ] 激励视频广告集成
- [ ] 代烧功能实现
- [ ] 资源占位文件创建完成
