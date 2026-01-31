// components/daily-card/daily-card.ts
import { memoryService } from '../../services/memory.service';

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    visible: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    isFlipped: false,
    isDrawing: false,
    hasDrawn: false,
    todayCard: null as any,
    cardTypes: [
      { type: 'archetype', name: '原型', icon: '🔮', color: '#8a6dff' },
      { type: 'symbol', name: '象征', icon: '🌙', color: '#FFD54F' },
      { type: 'insight', name: '洞察', icon: '✨', color: '#4DB6AC' }
    ]
  },

  lifetimes: {
    attached() {
      this.checkTodayCard();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 检查今天是否已经抽过卡片
     */
    async checkTodayCard() {
      const today = new Date().toISOString().split('T')[0];
      const drawnDate = wx.getStorageSync('lastDrawDate');
      
      if (drawnDate === today) {
        // 今天已经抽过，显示已抽的卡片
        const savedCard = wx.getStorageSync('todayCard');
        if (savedCard) {
          this.setData({
            hasDrawn: true,
            isFlipped: true,
            todayCard: savedCard
          });
        }
      }
    },

    /**
     * 抽取卡片
     */
    async drawCard() {
      if (this.data.isDrawing || this.data.hasDrawn) return;
      
      this.setData({ isDrawing: true });
      
      try {
        // 加载用户记忆
        const memory = await memoryService.loadMemoryContext();
        
        // 生成卡片
        const card = await this.generateCard(memory);
        
        // 保存到本地
        const today = new Date().toISOString().split('T')[0];
        wx.setStorageSync('lastDrawDate', today);
        wx.setStorageSync('todayCard', card);
        
        // 动画效果
        setTimeout(() => {
          this.setData({
            isFlipped: true,
            todayCard: card,
            isDrawing: false,
            hasDrawn: true
          });
        }, 800);
        
      } catch (err) {
        console.error('抽卡失败:', err);
        this.setData({ isDrawing: false });
        wx.showToast({ title: '抽卡失败', icon: 'error' });
      }
    },

    /**
     * 生成卡片内容
     */
    async generateCard(memory: any): Promise<any> {
      // 随机选择卡片类型
      const types = this.data.cardTypes;
      const type = types[Math.floor(Math.random() * types.length)];
      
      // 基于用户记忆生成内容
      let title = '';
      let content = '';
      let advice = '';
      
      const today = new Date();
      const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
      
      if (memory.recurrentSymbols && memory.recurrentSymbols.length > 0) {
        // 基于反复出现的意象生成
        const symbol = memory.recurrentSymbols[0];
        
        if (type.type === 'archetype') {
          const archetypes = ['英雄', '智者', '探索者', '魔术师', '照顾者'];
          const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
          title = `${archetype}的原型`;
          content = `你反复梦见"${symbol}"，这与${archetype}原型的能量相呼应。`;
          advice = '今天试着以英雄的姿态面对挑战，相信你有足够的力量。';
        } else if (type.type === 'symbol') {
          title = `${symbol}的象征`;
          content = `"${symbol}"在你的梦境中反复出现，它象征着潜意识试图传达的重要信息。`;
          advice = '留意今天生活中与这个意象相关的事物，可能有特别的意义。';
        } else {
          title = '潜意识的洞察';
          content = `基于你对"${symbol}"的反复关注，你的潜意识正在经历重要的转化。`;
          advice = '这是一个适合自我反思的日子，试着记录下今天的感悟。';
        }
      } else {
        // 新用户，使用通用卡片
        const universalCards = [
          {
            title: '新的开始',
            content: '每一个梦境都是潜意识送给你的礼物，它们携带着转化与成长的信息。',
            advice: '今天开始记录你的第一个梦境，开启这段内在探索之旅。'
          },
          {
            title: '倾听内在',
            content: '在忙碌的生活中，我们常常忽略了内心的声音。梦境是潜意识与你对话的方式。',
            advice: '今天找一个安静的时刻，闭上眼睛，倾听你内在的声音。'
          },
          {
            title: '阴影与光明',
            content: '荣格说："除非你使无意识变得有意识，否则它将指导你的生活，而你会称之为命运。"',
            advice: '今天留意那些让你有强烈情绪反应的事物，它们可能是潜意识的信号。'
          }
        ];
        
        const card = universalCards[Math.floor(Math.random() * universalCards.length)];
        title = card.title;
        content = card.content;
        advice = card.advice;
      }
      
      return {
        type: type.type,
        typeName: type.name,
        icon: type.icon,
        color: type.color,
        date: dateStr,
        title,
        content,
        advice
      };
    },

    /**
     * 关闭卡片
     */
    closeCard() {
      this.setData({ visible: false });
      this.triggerEvent('close');
    },

    /**
     * 分享卡片
     */
    shareCard() {
      const { todayCard } = this.data;
      if (!todayCard) return;
      
      this.triggerEvent('share', { card: todayCard });
    },

    /**
     * 阻止冒泡
     */
    stopPropagation() {
      // 阻止事件冒泡
    }
  }
});
