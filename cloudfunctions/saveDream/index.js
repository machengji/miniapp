const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 梦境数据保存云函数
 * 
 * 数据库 Schema (dreams 集合):
 * - _openid: string - 用户唯一标识
 * - content: string - 梦境内容
 * - analysis: string - AI完整回复（包含 <think> 标签）
 * - summary: string - AI生成的诗意标题（10字以内）
 * - mood: string - 用户选择情绪（焦虑/恐惧/喜悦/悲伤/困惑/平静/愤怒/羞耻）
 * - clarity: number - 梦境清晰度 1-5
 * - keywords: array - AI提取的关键词（用于标签系统）
 * - archetypeScores: object - 12原型得分（用于雷达图）
 * - createTime: Date - 创建时间
 * - updatedTime: Date - 更新时间
 */

exports.main = async (event, context) => {
  const { content, analysis, mood, clarity, keywords, archetypeScores } = event
  const { OPENID } = cloud.getWXContext()

  if (!content) {
    return { success: false, msg: 'No content provided' }
  }

  let summary = "无题梦境"
  let extractedKeywords = keywords || []
  let scores = archetypeScores || {}

  // 尝试调用 AI 生成摘要和关键词
  try {
    if (cloud.extend && cloud.extend.AI) {
      const ai = cloud.extend.AI
      const model = ai.createModel('hunyuan-exp')
      
      // 并行调用：生成摘要 + 提取关键词
      const [summaryRes, keywordsRes] = await Promise.all([
        // 1. 生成诗意标题
        model.generateText({
          model: 'hunyuan-turbos-latest',
          messages: [
            { 
              role: 'system', 
              content: '你是专业的梦境记录员。请为以下梦境生成一个不超过10个字的充满诗意的标题。只返回标题本身，不要标点符号。' 
            },
            { role: 'user', content: content }
          ]
        }),
        // 2. 提取关键词（如果没有传入）
        !keywords ? model.generateText({
          model: 'hunyuan-turbos-latest',
          messages: [
            {
              role: 'system',
              content: '从梦境中提取3-5个核心意象关键词，只返回JSON数组格式，如：["水", "坠落", "母亲"。不要有任何其他文字。'
            },
            { role: 'user', content: content }
          ]
        }) : Promise.resolve({ text: JSON.stringify(keywords) })
      ])

      summary = summaryRes.text || summary
      
      // 确保 summary 不为空
      if (!summary || summary.trim() === '') {
        summary = '无题梦境'
      }
      
      // 解析关键词
      if (!keywords && keywordsRes.text) {
        try {
          const parsed = JSON.parse(keywordsRes.text.replace(/```json\n?|\n?```/g, ''))
          if (Array.isArray(parsed)) {
            extractedKeywords = parsed.slice(0, 5)
          }
        } catch (e) {
          console.log('关键词解析失败，使用备用方案')
          // 备用：从文本中提取引号内的内容
          const matches = keywordsRes.text.match(/["']([^"']+)["']/g)
          if (matches) {
            extractedKeywords = matches.map(m => m.replace(/["']/g, '')).slice(0, 5)
          }
        }
      }
    }
  } catch (err) {
    console.error("AI处理失败:", err)
    summary = "无题梦境"
  }

  // 根据情绪计算原型得分（简单规则，后续可由AI分析替代）
  if (!archetypeScores && mood) {
    scores = calculateArchetypeScores(mood, content)
  }

  // 确保 summary 不为空字符串
  const finalSummary = summary.replace(/["《》]/g, '').trim() || '无题梦境'

  try {
    const res = await db.collection('dreams').add({
      data: {
        _openid: OPENID,
        content: content,
        analysis: analysis,
        summary: finalSummary,
        mood: mood || 'unknown',
        clarity: clarity || 3,
        keywords: extractedKeywords,
        archetypeScores: scores,
        createTime: db.serverDate(),
        updatedTime: db.serverDate()
      }
    })

    return {
      success: true,
      id: res._id,
      summary: finalSummary,
      keywords: extractedKeywords
    }
  } catch (err) {
    console.error('保存失败:', err)
    return {
      success: false,
      error: err.message || err
    }
  }
}

/**
 * 根据情绪计算荣格12原型得分（简化版）
 * 后续可由AI深度分析替换
 */
function calculateArchetypeScores(mood, content) {
  // 12原型：天真者、孤儿、英雄、照顾者、探索者、反叛者、情人、创造者、小丑、智者、魔术师、统治者
  const scores = {
    innocent: 20, orphan: 20, hero: 20, caregiver: 20,
    explorer: 20, rebel: 20, lover: 20, creator: 20,
    jester: 20, sage: 20, magician: 20, ruler: 20
  }

  // 情绪到原型的映射
  const moodMapping = {
    '焦虑': ['orphan', 'rebel'],
    '恐惧': ['orphan', 'magician'],
    '喜悦': ['innocent', 'lover'],
    '愤怒': ['hero', 'rebel'],
    '平静': ['sage', 'caregiver'],
    '困惑': ['explorer'],
    '悲伤': ['orphan', 'caregiver'],
    '羞耻': ['ruler']
  }

  const archetypes = moodMapping[mood] || []
  archetypes.forEach(key => {
    if (scores[key] !== undefined) {
      scores[key] += 30
    }
  })

  // 根据内容关键词调整（简化）
  const contentLower = content.toLowerCase()
  if (contentLower.includes('飞') || contentLower.includes('跑')) {
    scores.hero += 20
    scores.explorer += 20
  }
  if (contentLower.includes('水') || contentLower.includes('海')) {
    scores.sage += 15
  }
  if (contentLower.includes('追') || contentLower.includes('逃')) {
    scores.orphan += 20
  }

  return scores
}
