const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 梦境关键词和原型分析云函数
 * 
 * 功能：
 * 1. 提取核心意象关键词
 * 2. 识别荣格原型
 * 3. 分析情绪基调
 * 4. 识别潜在冲突
 */

exports.main = async (event, context) => {
  const { content } = event
  
  if (!content || content.length < 5) {
    return { 
      success: false, 
      error: '内容太短' 
    }
  }

  try {
    const ai = cloud.extend.AI
    const model = ai.createModel('hunyuan-exp')
    
    // 使用更详细的提示词获取结构化分析
    const res = await model.generateText({
      model: 'hunyuan-turbos-latest',
      messages: [
        {
          role: 'system',
          content: `你是荣格心理学专家。请分析以下梦境，提取关键信息。

请严格按照以下JSON格式返回（不要有任何其他文字）：
{
  "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"],
  "archetypes": ["出现的原型1", "出现的原型2"],
  "emotion": "主要情绪",
  "conflict": "潜在的心理冲突（如有）",
  "symbols": ["象征物1", "象征物2"]
}

关键词提取规则：
- 提取梦中的核心意象（人、物、场景、动作）
- 优先提取有心理学意义的象征
- 每个关键词2-4个字

原型识别参考：
- 天真者、孤儿、英雄、照顾者
- 探索者、反叛者、情人、创造者
- 小丑、智者、魔术师、统治者`
        },
        { role: 'user', content: content }
      ]
    })

    // 解析AI返回的结果
    let result = {}
    try {
      const cleaned = res.text.replace(/```json\n?|\n?```/g, '').trim()
      result = JSON.parse(cleaned)
    } catch (e) {
      console.log('JSON解析失败，尝试备用方案:', res.text)
      // 备用方案：提取关键词
      const keywordMatch = res.text.match(/keywords["']?\s*:\s*\[([^\]]+)\]/)
      if (keywordMatch) {
        const keywords = keywordMatch[1].match(/["']([^"']+)["']/g) || []
        result.keywords = keywords.map(k => k.replace(/["']/g, '')).slice(0, 5)
      }
    }

    // 确保返回格式正确
    return {
      success: true,
      data: {
        keywords: result.keywords || [],
        archetypes: result.archetypes || [],
        emotion: result.emotion || 'unknown',
        conflict: result.conflict || '',
        symbols: result.symbols || []
      }
    }
    
  } catch (err) {
    console.error('提取关键词失败:', err)
    return { 
      success: false, 
      error: err.message 
    }
  }
}
