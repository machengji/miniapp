const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

/**
 * 获取用户统计信息
 * 包含：用户档案 + 梦境统计 + 情绪分布 + 连续记录
 */

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  
  if (!OPENID) {
    return { success: false, error: '未获取到用户信息' }
  }

  try {
    // 1. 获取用户档案
    const { data: users } = await db.collection('users')
      .where({ _openid: OPENID })
      .get()
    
    const userProfile = users[0] || null

    // 2. 获取梦境统计
    const { total: totalDreams } = await db.collection('dreams')
      .where({ _openid: OPENID })
      .count()

    // 3. 获取最近7天的记录数
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const { total: recentDreams } = await db.collection('dreams')
      .where({
        _openid: OPENID,
        createTime: _.gte(sevenDaysAgo)
      })
      .count()

    // 4. 获取情绪分布
    const { data: moodData } = await db.collection('dreams')
      .where({ _openid: OPENID })
      .get()
    
    const moodDistribution = {}
    let totalClarity = 0
    let clarityCount = 0
    
    moodData.forEach(dream => {
      // 情绪统计
      const mood = dream.mood || 'unknown'
      moodDistribution[mood] = (moodDistribution[mood] || 0) + 1
      
      // 清晰度统计
      if (dream.clarity) {
        totalClarity += dream.clarity
        clarityCount++
      }
    })

    // 找出主导情绪
    let dominantMood = '-'
    let maxMoodCount = 0
    for (const [mood, count] of Object.entries(moodDistribution)) {
      if (count > maxMoodCount && mood !== 'unknown') {
        maxMoodCount = count
        dominantMood = mood
      }
    }

    // 5. 获取最近5条记录（用于首页展示）
    const { data: recentDreamsList } = await db.collection('dreams')
      .where({ _openid: OPENID })
      .orderBy('createTime', 'desc')
      .limit(5)
      .get()

    // 格式化日期
    const formattedDreams = recentDreamsList.map(d => {
      const date = new Date(d.createTime)
      return {
        ...d,
        day: date.getDate(),
        month: date.getMonth() + 1 + '月',
        content: d.content.length > 25 ? d.content.substring(0, 25) + '...' : d.content
      }
    })

    return {
      success: true,
      stats: {
        // 用户档案
        profile: userProfile,
        
        // 梦境统计
        totalDreams,
        recentDreams,
        avgClarity: clarityCount > 0 ? (totalClarity / clarityCount).toFixed(1) : '0.0',
        
        // 情绪分析
        moodDistribution,
        dominantMood,
        
        // 连续记录
        streakDays: (userProfile && userProfile.streakDays) || 0,
        
        // 最近记录
        recentDreamsList: formattedDreams
      }
    }
    
  } catch (err) {
    console.error('获取统计失败:', err)
    return { success: false, error: err.message }
  }
}
