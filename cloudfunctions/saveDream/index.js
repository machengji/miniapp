const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { content, analysis, mood, clarity } = event
  const { OPENID } = cloud.getWXContext()

  if (!content) {
    return { success: false, msg: 'No content provided' }
  }

  let summary = "无题梦境"

  // 尝试调用 AI 生成摘要
  try {
    if (cloud.extend && cloud.extend.AI) {
      const ai = cloud.extend.AI
      const model = ai.createModel('hunyuan-exp') 
      
      const res = await model.generateText({
        model: 'hunyuan-turbos-latest',
        messages: [
          { role: 'system', content: '你是专业的梦境记录员。请为以下梦境生成一个不超过10个字的充满诗意的标题。只返回标题本身，不要标点符号。' },
          { role: 'user', content: content }
        ]
      })
      summary = res.text || summary
    }
  } catch (err) {
    console.error("Summary generation failed", err)
    // Fallback to simple truncation
    summary = content.substring(0, 8) + "..."
  }

  try {
    const res = await db.collection('dreams').add({
      data: {
        _openid: OPENID,
        content: content,
        analysis: analysis, // 包含 <think> 的完整回复
        summary: summary.replace(/["《》]/g, ''), // 简单的清理
        mood: mood || 'unknown',
        clarity: clarity || 3,
        createTime: db.serverDate(),
        updatedTime: db.serverDate()
      }
    })

    return {
      success: true,
      id: res._id,
      summary: summary
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      error: err
    }
  }
}
