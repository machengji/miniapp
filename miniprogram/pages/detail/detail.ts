// detail.ts - 梦境详情页
const app = getApp<IAppOption>()

interface DreamDetail {
  _id: string;
  content: string;
  analysis: string;
  summary: string;
  mood: string;
  clarity: number;
  keywords: string[];
  archetypeScores: Record<string, number>;
  createTime: string;
  thought: string;
  content: string;
}

Page({
  data: {
    dreamId: '',
    dream: null as DreamDetail | null,
    isLoading: true,
    isThoughtExpanded: false,
    moodIcon: '',
    moodColor: '',
    formattedDate: ''
  },

  onLoad(options: any) {
    if (options.id) {
      this.setData({ dreamId: options.id });
      this.loadDreamDetail(options.id);
    } else {
      wx.showToast({ title: '参数错误', icon: 'error' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  /**
   * 加载梦境详情
   */
  async loadDreamDetail(id: string) {
    this.setData({ isLoading: true });
    
    try {
      const db = wx.cloud.database();
      const { data } = await db.collection('dreams').doc(id).get();
      
      if (!data) {
        throw new Error('梦境记录不存在');
      }

      // 解析AI分析内容（提取 think 标签）
      const analysis = data.analysis || '';
      let thought = '';
      let content = analysis;
      
      const thinkMatch = analysis.match(/<think>([\s\S]*?)<\/think>/);
      if (thinkMatch) {
        thought = thinkMatch[1].trim();
        content = analysis.replace(/<think>[\s\S]*?<\/think>/, '').trim();
      }

      // 格式化日期
      const date = new Date(data.createTime);
      const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      this.setData({
        dream: {
          ...data,
          thought,
          content
        },
        isLoading: false,
        moodIcon: this.getMoodIcon(data.mood),
        moodColor: this.getMoodColor(data.mood),
        formattedDate
      });
    } catch (err) {
      console.error('加载梦境详情失败:', err);
      this.setData({ isLoading: false });
      wx.showToast({ title: '加载失败', icon: 'error' });
    }
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
   * 切换思考过程展开/收起
   */
  toggleThought() {
    this.setData({ isThoughtExpanded: !this.data.isThoughtExpanded });
  },

  /**
   * 复制分析内容
   */
  copyAnalysis() {
    const { dream } = this.data;
    if (!dream) return;
    
    const textToCopy = `${dream.summary}\n\n梦境内容：\n${dream.content}\n\nAI分析：\n${dream.content}`;
    
    wx.setClipboardData({
      data: textToCopy,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  /**
   * 分享梦境
   */
  onShareAppMessage() {
    const { dream } = this.data;
    if (!dream) return {};
    
    return {
      title: `我的梦境：${dream.summary || '无题梦境'}`,
      path: `/pages/detail/detail?id=${dream._id}`,
      imageUrl: '' // 可以生成分享图
    };
  },

  /**
   * 删除梦境
   */
  deleteDream() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      confirmColor: '#E57373',
      success: (res) => {
        if (res.confirm) {
          this.doDelete();
        }
      }
    });
  },

  /**
   * 执行删除
   */
  async doDelete() {
    const { dreamId } = this.data;
    
    wx.showLoading({ title: '删除中...' });
    
    try {
      const db = wx.cloud.database();
      await db.collection('dreams').doc(dreamId).remove();
      
      wx.hideLoading();
      wx.showToast({ title: '已删除', icon: 'success' });
      
      // 通知首页刷新
      const app = getApp<IAppOption>();
      if (app.globalData) {
        app.globalData.refreshDreamList = true;
      }
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } catch (err) {
      wx.hideLoading();
      console.error('删除失败:', err);
      wx.showToast({ title: '删除失败', icon: 'error' });
    }
  },

  /**
   * 返回首页
   */
  goBack() {
    wx.navigateBack();
  }
});
