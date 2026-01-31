const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

/**
 * 更新用户档案
 * 
 * 数据库 Schema (users 集合):
 * - _openid: string - 用户唯一标识
 * - nickName: string - 微信昵称
 * - avatarUrl: string - 头像URL
 * - joinDate: Date - 注册时间
 * - lastActive: Date - 最后活跃
 * - totalDreams: number - 累计记录梦境数
 * - streakDays: number - 连续记录天数
 * - lastDreamDate: string - 最后记录日期 YYYY-MM-DD
 * - preferences: object - 用户偏好设置
 */

exports.main = async (event, context) => {
  const { userInfo, action } = event
  const { OPENID } = cloud.getWXContext()
  
  if (!OPENID) {
    return { success: false, error: '未获取到用户信息' }
  }

  const today = new Date().toISOString().split('T')[0]

  try {
    // 先查询用户是否存在
    const { data: existingUsers } = await db.collection('users')
      .where({ _openid: OPENID })
      .get()

    if (existingUsers.length === 0) {
      // 新用户，创建档案
      const newUser = {
        _openid: OPENID,
        nickName: (userInfo && userInfo.nickName) || '匿名用户',
        avatarUrl: (userInfo && userInfo.avatarUrl) || '',
        joinDate: db.serverDate(),
        lastActive: db.serverDate(),
        totalDreams: 0,
        streakDays: 0,
        lastDreamDate: '',
        preferences: {
          theme: 'dark',
          notification: true,
          analysisDepth: 'deep'
        }
      }
      
      await db.collection('users').add({ data: newUser })
      return { success: true, isNewUser: true, user: newUser }
    }

    // 老用户，更新信息
    const user = existingUsers[0]
    const updateData = {
      lastActive: db.serverDate()
    }

    // 如果有用户信息，更新昵称和头像
    if (userInfo) {
      if (userInfo.nickName) updateData.nickName = userInfo.nickName
      if (userInfo.avatarUrl) updateData.avatarUrl = userInfo.avatarUrl
    }

    // 如果 action 是 'recordDream'，更新统计
    if (action === 'recordDream') {
      updateData.totalDreams = _.inc(1)
      
      // 计算连续记录天数
      if (user.lastDreamDate) {
        const lastDate = new Date(user.lastDreamDate)
        const todayDate = new Date(today)
        const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 1) {
          // 连续记录
          updateData.streakDays = _.inc(1)
        } else if (diffDays > 1) {
          // 中断后重新计数
          updateData.streakDays = 1
        }
        // diffDays === 0 同一天多条，不增加连续天数
      } else {
        // 首次记录
        updateData.streakDays = 1
      }
      
      updateData.lastDreamDate = today
    }

    await db.collection('users')
      .doc(user._id)
      .update({ data: updateData })

    return { success: true, isNewUser: false }
    
  } catch (err) {
    console.error('更新用户失败:', err)
    return { success: false, error: err.message }
  }
}
