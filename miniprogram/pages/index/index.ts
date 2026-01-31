// index.ts - 首页：梦境日记 + 用户统计
const app = getApp<IAppOption>()

interface Dream {
  _id: string;
  _openid: string;
  content: string;
  summary: string;
  analysis: string;
  mood: string;
  clarity: number;
  keywords: string[];
  createTime: string;
  day: number;
  month: string;
}

interface UserStats {
  totalDreams: number;
  recentDreams: number;
  streakDays: number;
  avgClarity: string;
  dominantMood: string;
  recentDreamsList: Dream[];
}

Page({
  data: {
    // 用户统计
    stats: {
      totalDreams: 0,
      recentDreams: 0,
      streakDays: 0,
      avgClarity: '0.0',
      dominantMood: '-'
    } as UserStats,
    
    // 梦境列表
    dreams: [] as Dream[],
    
    // 加载状态
    isLoading: true,
    
    // 用户信息
    userInfo: null as WechatMiniprogram.UserInfo | null,
    
    // 每日卡片
    showDailyCard: false,
    hasDrawnCard: false
  },

  onLoad() {
    // 获取用户信息
    if (app.globalData.userInfo) {
      this.setData({ userInfo: app.globalData.userInfo });
    } else {
      app.userInfoReadyCallback = (userInfo) => {
        this.setData({ userInfo });
      };
    }
    
    // 检查今天是否已抽卡
    this.checkDailyCard();
  },
  
  /**
   * 检查今日卡片状态
   */
  checkDailyCard() {
    const today = new Date().toISOString().split('T')[0];
    const lastDraw = wx.getStorageSync('lastDrawDate');
    this.setData({ hasDrawnCard: lastDraw === today });
  },
  
  /**
   * 显示每日卡片
   */
  showDailyCard() {
    this.setData({ showDailyCard: true });
  },
  
  /**
   * 隐藏每日卡片
   */
  hideDailyCard() {
    this.setData({ showDailyCard: false });
    this.checkDailyCard(); // 更新红点状态
  },
  
  /**
   * 分享卡片
   */
  onShareCard(e: any) {
    const card = e.detail.card;
    // 可以在这里实现分享逻辑
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage']
    });
  },

  onShow() {
    // 检查是否需要刷新
    if (app.globalData.refreshDreamList) {
      this.loadData();
      app.globalData.refreshDreamList = false;
    } else {
      this.loadData();
    }
  },

  /**
   * 加载所有数据（用户统计 + 梦境列表）
   */
  async loadData() {
    this.setData({ isLoading: true });
    
    try {
      // 先加载梦境列表（核心功能）
      const dreamsRes = await this.loadDreams();
      
      // 再加载用户统计（非核心，失败不影响）
      let statsRes = {
        totalDreams: dreamsRes.length,
        recentDreams: 0,
        streakDays: 0,
        avgClarity: '0.0',
        dominantMood: '-',
        recentDreamsList: dreamsRes
      };
      
      try {
        statsRes = await this.loadUserStats();
      } catch (statsErr) {
        console.log('用户统计加载失败，使用默认值:', statsErr);
      }
      
      this.setData({
        stats: statsRes,
        dreams: dreamsRes,
        isLoading: false
      });
    } catch (err) {
      console.error('加载数据失败:', err);
      this.setData({ isLoading: false });
      wx.showToast({ title: '加载失败', icon: 'error' });
    }
  },

  /**
   * 加载用户统计
   */
  loadUserStats(): Promise<UserStats> {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'getUserStats'
      }).then((res: any) => {
        if (res.result && res.result.success) {
          resolve(res.result.stats);
        } else {
          reject(new Error((res.result && res.result.error) || '获取统计失败'));
        }
      }).catch(reject);
    });
  },

  /**
   * 加载梦境列表
   */
  loadDreams(): Promise<Dream[]> {
    return new Promise((resolve, reject) => {
      console.log('开始加载梦境列表...');
      const db = wx.cloud.database();
      db.collection('dreams')
        .orderBy('createTime', 'desc')
        .limit(20)
        .get()
        .then((res: any) => {
          console.log('梦境列表加载成功:', res.data.length, '条记录');
          console.log('原始数据:', res.data);
          
          const dreams = res.data.map((d: any) => {
            const date = new Date(d.createTime);
            return {
              ...d,
              day: date.getDate(),
              month: (date.getMonth() + 1) + '月',
              // 显示AI生成的标题，如果没有则显示内容摘要
              displayTitle: d.summary || (d.content.length > 20 ? d.content.substring(0, 20) + '...' : d.content),
              // 情绪图标映射
              moodIcon: this.getMoodIcon(d.mood),
              // 情绪颜色
              moodColor: this.getMoodColor(d.mood)
            };
          });
          console.log('处理后的梦境列表:', dreams);
          resolve(dreams);
        })
        .catch((err) => {
          console.error('加载梦境列表失败:', err);
          reject(err);
        });
    });
  },

  /**
   * 情绪图标映射
   */
  getMoodIcon(mood: string): string {
    const iconMap: Record<string, string> = {
      '焦虑': '😰',
      '恐惧': '😱',
      '喜悦': '😊',
      '悲伤': '😢',
      '困惑': '😕',
      '平静': '😌',
      '愤怒': '😠',
      '羞耻': '😳',
      'unknown': '😐'
    };
    return iconMap[mood] || '😐';
  },

  /**
   * 情绪颜色映射
   */
  getMoodColor(mood: string): string {
    const colorMap: Record<string, string> = {
      '焦虑': '#FFB74D',
      '恐惧': '#FF8A65',
      '喜悦': '#81C784',
      '悲伤': '#64B5F6',
      '困惑': '#BA68C8',
      '平静': '#4DB6AC',
      '愤怒': '#E57373',
      '羞耻': '#F06292',
      'unknown': '#9E9E9E'
    };
    return colorMap[mood] || '#9E9E9E';
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
      wx.showToast({ title: '已刷新', icon: 'success' });
    }).catch(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 跳转到聊天页
   */
  goToChat() {
    wx.navigateTo({ url: '../chat/chat' });
  },

  /**
   * 跳转到报告页
   */
  goToReport() {
    wx.navigateTo({ url: '../report/report' });
  },

  /**
   * 查看梦境详情
   */
  viewDreamDetail(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `../detail/detail?id=${id}`
    });
  },

  /**
   * 获取用户信息
   */
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户档案',
      success: (res) => {
        this.setData({ userInfo: res.userInfo });
        app.globalData.userInfo = res.userInfo;
        // 更新到云端
        wx.cloud.callFunction({
          name: 'updateUser',
          data: { userInfo: res.userInfo }
        });
      }
    });
  }
});
