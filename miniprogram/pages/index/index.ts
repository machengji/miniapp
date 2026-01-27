// index.ts
const app = getApp<IAppOption>()

Page({
  data: {
    dreams: [] as any[]
  },

  onShow() {
    this.loadDreams();
  },

  loadDreams() {
    const db = wx.cloud.database();
    db.collection('dreams')
      .orderBy('createTime', 'desc')
      .get()
      .then((res: any) => {
        const dreams = res.data.map((d: any) => {
          const date = new Date(d.createTime);
          return {
            ...d,
            day: date.getDate(),
            month: date.getMonth() + 1 + '月',
            // Simple truncation for preview
            content: d.content.length > 20 ? d.content.substring(0, 20) + '...' : d.content
          };
        });
        this.setData({ dreams });
      })
      .catch((err: any) => {
        console.error("Failed to load dreams", err);
        // If collection doesn't exist yet, it's fine, just empty list
      });
  },

  goToChat() {
    wx.navigateTo({
      url: '../chat/chat'
    })
  },

  goToReport() {
    wx.navigateTo({
      url: '../report/report'
    })
  }
})