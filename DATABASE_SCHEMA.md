# Aletheia 数据库 Schema 设计

## 集合 1: dreams（梦境记录）

### 字段定义

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _openid | string | 是 | 用户唯一标识（微信自动） |
| content | string | 是 | 梦境原始内容 |
| analysis | string | 是 | AI完整分析（含`<think>`标签） |
| summary | string | 否 | AI生成的诗意标题（≤10字） |
| mood | string | 否 | 情绪标签：焦虑/恐惧/喜悦/悲伤/困惑/平静/愤怒/羞耻 |
| clarity | number | 否 | 清晰度 1-5，默认3 |
| keywords | array | 否 | AI提取的关键词，如["水","坠落"] |
| archetypeScores | object | 否 | 12原型得分，用于雷达图 |
| createTime | Date | 是 | 创建时间 |
| updatedTime | Date | 是 | 更新时间 |

### 索引设计

```javascript
// 在云开发控制台 - 数据库 - dreams - 索引管理 中添加

// 1. 用户查询索引（最常用）
{
  "name": "openid_time",
  "unique": false,
  "keys": {
    "_openid": 1,
    "createTime": -1
  }
}

// 2. 关键词搜索索引
{
  "name": "keywords",
  "unique": false,
  "keys": {
    "keywords": 1
  }
}

// 3. 情绪统计索引
{
  "name": "mood_time",
  "unique": false,
  "keys": {
    "mood": 1,
    "createTime": -1
  }
}
```

### 数据权限

```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

## 集合 2: users（用户档案）

### 字段定义

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _openid | string | 是 | 用户唯一标识 |
| nickName | string | 否 | 微信昵称 |
| avatarUrl | string | 否 | 头像URL |
| joinDate | Date | 是 | 注册时间 |
| lastActive | Date | 是 | 最后活跃 |
| totalDreams | number | 否 | 累计记录梦境数 |
| streakDays | number | 否 | 连续记录天数 |
| preferences | object | 否 | 用户偏好设置 |
| membership | object | 否 | 会员信息 |

### 示例数据

```json
{
  "_openid": "oXXXXXXXXXXXXXXXX",
  "nickName": "追梦人",
  "avatarUrl": "https://...",
  "joinDate": {"$date": "2026-01-31T00:00:00Z"},
  "lastActive": {"$date": "2026-01-31T12:00:00Z"},
  "totalDreams": 15,
  "streakDays": 7,
  "preferences": {
    "theme": "dark",
    "notification": true,
    "analysisDepth": "deep"
  },
  "membership": {
    "type": "premium",
    "startDate": {"$date": "2026-01-01Z"},
    "endDate": {"$date": "2027-01-01Z"}
  }
}
```

## 集合 3: daily_cards（每日共时性卡片）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _openid | string | 用户标识 |
| date | string | 日期 YYYY-MM-DD |
| cardType | string | 卡片类型：archetype/element/symbol |
| cardContent | object | 卡片内容 |
| isDrawn | boolean | 是否已抽取 |
| drawTime | Date | 抽取时间 |

## 数据导入/导出

### 在开发者工具中操作

```bash
# 导出 dreams 集合
# 云开发控制台 -> 数据库 -> dreams -> 导出

# 导入测试数据
# 云开发控制台 -> 数据库 -> 导入 JSON
```

## 安全规则

所有集合统一使用：
- 读取：仅本人
- 写入：仅本人
- 删除：仅本人（或逻辑删除标记）
