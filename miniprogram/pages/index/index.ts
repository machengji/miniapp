// index.ts - 首页：梦境日记 + 用户统计
import { conversationService, Conversation } from '../../services/conversation.service';

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

    // 对话历史列表
    conversations: [] as Conversation[],

    // 加载状态
    isLoading: true,

    // 用户信息
    userInfo: null as WechatMiniprogram.UserInfo | null,

    // 每日卡片
    showDailyCard: false,
    hasDrawnCard: false,

    // 导航栏高度
    navBarHeight: 0,
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
    
    // 加载数据
    this.loadData();
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
    wx.vibrateShort({ type: 'light' });
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
    // 只在全局标记为需要刷新时才加载数据
    if (app.globalData && app.globalData.refreshDreamList) {
      this.loadData();
      app.globalData.refreshDreamList = false;
    }
    // 否则不自动刷新，保持页面状态
  },

  /**
   * 加载所有数据（用户统计 + 梦境列表 + 对话历史）
   */
  async loadData() {
    this.setData({ isLoading: true });
    
    try {
      // 并行加载所有数据
      const [dreamsRes, conversationsRes] = await Promise.all([
        this.loadDreams(),
        this.loadConversations()
      ]);
      
      // 加载用户统计
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
        conversations: conversationsRes
      }, () => {
        // 延迟关闭 loading，确保动画平滑展示
        setTimeout(() => {
          this.setData({ isLoading: false });
        }, 800);
      });
    } catch (err) {
      console.error('加载数据失败:', err);
      // 即使失败也要关闭 loading
      setTimeout(() => {
        this.setData({ isLoading: false });
      }, 800);
      wx.showToast({ title: '加载失败', icon: 'error' });
    }
  },

  /**
   * 加载对话历史
   */
  async loadConversations(): Promise<Conversation[]> {
    console.log("[INDEX DEBUG] 开始加载对话列表...");
    try {
      const conversations = await conversationService.getConversations(20);
      console.log("[INDEX DEBUG] 加载到对话数量:", conversations.length);
      
      // 格式化时间
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      return conversations.map(conv => {
        const convTime = new Date(conv.lastMessageTime || conv.createTime);
        const diffDays = Math.floor((today.getTime() - new Date(convTime.getFullYear(), convTime.getMonth(), convTime.getDate()).getTime()) / (1000 * 60 * 60 * 24));
        
        let formattedTime: string;
        if (diffDays === 0) {
          // 今天，显示时间
          formattedTime = `${String(convTime.getHours()).padStart(2, '0')}:${String(convTime.getMinutes()).padStart(2, '0')}`;
        } else if (diffDays === 1) {
          formattedTime = '昨天';
        } else if (diffDays < 7) {
          formattedTime = `${diffDays}天前`;
        } else {
          formattedTime = `${convTime.getMonth() + 1}/${convTime.getDate()}`;
        }
        
        // 获取情绪颜色
        const moodColor = this.getMoodColor(conv.mood || 'unknown');
        
        return {
          ...conv,
          formattedTime,
          moodColor
        };
      });
    } catch (err) {
      console.error('加载对话历史失败:', err);
      return [];
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
            
            // 智能生成标题
            let displayTitle = '';
            if (d.summary && d.summary.trim() && d.summary !== '无题梦境' && d.summary !== '梦境记录') {
              // 优先使用AI生成的摘要
              displayTitle = d.summary;
            } else if (d.keywords && d.keywords.length > 0) {
              // 使用关键词组合作为标题
              displayTitle = d.keywords.slice(0, 3).join(' · ');
            } else {
              // 从内容中提取前15个字符作为标题
              const content = d.content || '';
              displayTitle = content.substring(0, 15) + (content.length > 15 ? '...' : '');
            }
            
            // 如果标题还是空的，使用默认标题
            if (!displayTitle || displayTitle.trim() === '') {
              displayTitle = '梦境片段';
            }
            
            return {
              ...d,
              day: date.getDate(),
              month: (date.getMonth() + 1) + '月',
              // 使用智能生成的标题
              displayTitle: displayTitle,
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
   * 跳转到聊天页（新建对话）
   */
  goToChat() {
    wx.vibrateShort({ type: 'light' });
    wx.navigateTo({ url: '../chat/chat' });
  },

  /**
   * 继续历史对话
   */
  continueConversation(e: any) {
    const conversationId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `../chat/chat?conversationId=${conversationId}`
    });
  },

  /**
   * 删除对话
   */
  deleteConversation(e: any) {
    const conversationId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      confirmColor: '#E57373',
      success: (res) => {
        if (res.confirm) {
          this.doDeleteConversation(conversationId);
        }
      }
    });
  },

  /**
   * 执行删除对话
   */
  async doDeleteConversation(conversationId: string) {
    wx.showLoading({ title: '删除中...' });
    
    try {
      await conversationService.deleteConversation(conversationId);
      
      // 从列表中移除
      const conversations = this.data.conversations.filter(c => c._id !== conversationId);
      this.setData({ conversations });
      
      wx.hideLoading();
      wx.showToast({ title: '已删除', icon: 'success' });
    } catch (err) {
      wx.hideLoading();
      console.error('删除对话失败:', err);
      wx.showToast({ title: '删除失败', icon: 'error' });
    }
  },

  /**
   * 跳转到报告页
   */
  goToReport() {
    console.log('点击了前往报告页按钮');
    wx.vibrateShort({ type: 'light' });
    wx.navigateTo({ 
      url: '../report/report',
      fail: (err) => {
        console.error('跳转报告页失败:', err);
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });
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
   * 导航栏高度就绪回调
   */
  onNavBarHeightReady(e: any) {
    const { totalHeight } = e.detail;
    this.setData({ navBarHeight: totalHeight });
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
