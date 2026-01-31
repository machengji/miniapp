import { memoryService } from '../../services/memory.service';

Page({
  data: {
    // Persona/Shadow 平衡
    personaPercentage: 50,
    polarityInsight: "你的心灵处于动态平衡中。",

    // 基础统计
    totalDreams: 0,
    avgClarity: "0.0",
    dominantMood: "-",
    streakDays: 0,

    // 荣格 12 原型 (用于雷达图)
    archetypes: [
      { name: '天真者', value: 0, icon: '👶' },
      { name: '孤儿', value: 0, icon: '🏃' },
      { name: '英雄', value: 0, icon: '⚔️' },
      { name: '照顾者', value: 0, icon: '🤱' },
      { name: '探索者', value: 0, icon: '🔍' },
      { name: '反叛者', value: 0, icon: '🔥' },
      { name: '情人', value: 0, icon: '❤️' },
      { name: '创造者', value: 0, icon: '🎨' },
      { name: '小丑', value: 0, icon: '🃏' },
      { name: '智者', value: 0, icon: '📚' },
      { name: '魔术师', value: 0, icon: '🔮' },
      { name: '统治者', value: 0, icon: '👑' }
    ],

    // 情绪分布
    moodDistribution: [] as {mood: string, count: number, percentage: number}[]

    // 反复出现的意象
    recurrentSymbols: [] as string[]

    // 加载状态
    isLoading: true,

    // 导航栏高度
    navBarHeight: 0,
  },

  onShow() {
    this.loadReportData();
  },

  /**
   * 加载报告数据
   */
  async loadReportData() {
    this.setData({ isLoading: true });
    
    try {
      // 并行加载数据
      const [dreamsRes, memoryRes] = await Promise.all([
        this.loadDreams(),
        memoryService.loadMemoryContext()
      ]);
      
      const dreams = dreamsRes;
      
      if (dreams.length === 0) {
        this.setData({ isLoading: false });
        return;
      }

      // 1. 基础统计
      const total = dreams.length;
      const totalClarity = dreams.reduce((acc: number, cur: any) => acc + (cur.clarity || 0), 0);
      const avgClarity = (totalClarity / total).toFixed(1);

      // 2. 计算原型得分（结合云端存储的 archetypeScores）
      const archetypeScores = this.calculateArchetypeScores(dreams);

      // 3. 情绪分布
      const moodDistribution = this.calculateMoodDistribution(dreams);
      const dominantMood = moodDistribution.length > 0 ? moodDistribution[0].mood : '-';

      // 4. Persona/Shadow 计算
      const { personaPercentage, insight } = this.calculatePersonaShadow(dreams);

      // 5. 反复出现的意象
      const recurrentSymbols = memoryRes.recurrentSymbols.slice(0, 6);

      this.setData({
        totalDreams: total,
        avgClarity: avgClarity,
        dominantMood: dominantMood,
        archetypes: archetypeScores,
        personaPercentage: personaPercentage,
        polarityInsight: insight,
        moodDistribution: moodDistribution,
        recurrentSymbols: recurrentSymbols,
        isLoading: false
      });

      // 渲染 Canvas
      this.drawRadar(archetypeScores);
      
    } catch (err) {
      console.error('加载报告失败:', err);
      this.setData({ isLoading: false });
    }
  },

  /**
   * 加载梦境列表
   */
  loadDreams(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database();
      db.collection('dreams')
        .orderBy('createTime', 'desc')
        .get()
        .then(res => resolve(res.data))
        .catch(reject);
    });
  },

  /**
   * 计算原型得分
   */
  calculateArchetypeScores(dreams: any[]) {
    // 初始分数
    const scores = [
      { name: '天真者', value: 20, icon: '👶', key: 'innocent' },
      { name: '孤儿', value: 20, icon: '🏃', key: 'orphan' },
      { name: '英雄', value: 20, icon: '⚔️', key: 'hero' },
      { name: '照顾者', value: 20, icon: '🤱', key: 'caregiver' },
      { name: '探索者', value: 20, icon: '🔍', key: 'explorer' },
      { name: '反叛者', value: 20, icon: '🔥', key: 'rebel' },
      { name: '情人', value: 20, icon: '❤️', key: 'lover' },
      { name: '创造者', value: 20, icon: '🎨', key: 'creator' },
      { name: '小丑', value: 20, icon: '🃏', key: 'jester' },
      { name: '智者', value: 20, icon: '📚', key: 'sage' },
      { name: '魔术师', value: 20, icon: '🔮', key: 'magician' },
      { name: '统治者', value: 20, icon: '👑', key: 'ruler' }
    ];

    // 累加每条梦境的原型得分
    dreams.forEach(dream => {
      if (dream.archetypeScores) {
        scores.forEach((score, idx) => {
          if (dream.archetypeScores[score.key]) {
            scores[idx].value += dream.archetypeScores[score.key] - 20; // 减去基础分
          }
        });
      }
    });

    // 归一化到 0-100
    const maxScore = Math.max(...scores.map(s => s.value)) || 1;
    const minScore = Math.min(...scores.map(s => s.value)) || 0;
    const range = maxScore - minScore || 1;
    
    return scores.map(s => ({
      ...s,
      value: Math.round(((s.value - minScore) / range) * 80 + 10) // 10-90的范围
    }));
  },

  /**
   * 计算情绪分布
   */
  calculateMoodDistribution(dreams: any[]) {
    const moodCounts: Record<string, number> = {};
    
    dreams.forEach(dream => {
      const mood = dream.mood || '未知';
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });

    const total = dreams.length;
    const distribution = Object.entries(moodCounts)
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // 只显示前5种情绪

    return distribution;
  },

  /**
   * 计算 Persona/Shadow 比例
   */
  calculatePersonaShadow(dreams: any[]) {
    const negativeMoods = ['恐惧', '焦虑', '愤怒', '羞耻', '悲伤'];
    let negCount = 0;
    
    dreams.forEach(dream => {
      if (negativeMoods.includes(dream.mood)) negCount++;
    });

    const shadowRatio = negCount / dreams.length;
    const personaPercentage = Math.floor((1 - shadowRatio * 0.8) * 100);

    let insight = "你的心灵处于动态平衡中。";
    if (personaPercentage > 80) {
      insight = "你的防御机制（面具）很强，可能压抑了部分真实感受。试着允许自己展现脆弱。";
    } else if (personaPercentage < 40) {
      insight = "阴影原型正在浮现，这虽令人不安，却是转化的契机。拥抱你的阴影。";
    } else if (personaPercentage > 60) {
      insight = "你的意识与潜意识保持着良好的对话，这是心理健康的表现。";
    }

    return { personaPercentage, insight };
  },

  /**
   * 绘制雷达图 - 添加动画
   */
  drawRadar(data: any[]) {
    const query = wx.createSelectorQuery();
    query.select('#radarCanvas')
      .fields({ node: true, size:rect true })
      .exec((res: any) => {
        if (!res[0]) return;
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        const dpr = wx.getSystemInfoSync().pixelRatio;
       
        
        // 设置 Canvas 尺寸
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        const width = res[0].width;
        const height = res[0].height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 50;

        ctx.clearRect(0, 0, width, height);

        // 绘制背景网格
        this.drawRadarGrid(ctx, centerX, centerY, radius);

        // 动画绘制数据
        this.animateRadarDrawing(ctx, centerX, centerY, radius, data);

        // 动画绘制标签
        setTimeout(() => {
          this.animateRadarLabels(ctx, centerX, centerY, radius, data);
        }, 300);
      });
  },

  /**
   * 动画绘制雷达数据
   */
  animateRadarDrawing(ctx: any, centerX: number, centerY: number, radius: number, data: any[]) {
    const sides = data.length;
    const angleStep = (Math.PI * 2) / sides;
    
    // 逐个点进行动画
    data.forEach((item: any, index: number) => {
      setTimeout(() => {
        this.drawRadarPolygon(ctx, centerX, centerY, radius, data.slice(0, index + 1));
        
        // 绘制当前点的标签
        this.drawRadarLabel(ctx, centerX, centerY, radius, item, index);
      }, index * 100); // 每个点延迟 100ms
    });
  },

  drawRadarPolygon(ctx: any, centerX: number, centerY: number, radius: number, data: any[]) {
    const sides = data.length;
    const angleStep = (Math.PI * 2) / sides;

    // 绘制填充区域
    ctx.beginPath();
    data.forEach((item: any, index: number) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.closePath();
    ctx.fillStyle = 'rgba(201, 168, 108, 0.2)';
    ctx.fill();

    // 绘制数据线
    ctx.beginPath();
    data.forEach((item: any, index: number) => {
      const angle = index * angleStep - Math.PI / 2;
      const value = item.value || 0;
      const r = (value / 100) * radius;
      
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.closePath();
    ctx.strokeStyle = '#c9a86c';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 绘制数据点
    data.forEach((item: any, index: number) => {
      const angle = index * angleStep - Math.PI / 2;
      const value = item.value || 0;
      const r = (value / 100) * radius;
      
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#c9a86c';
      ctx.fill();
      
      // 绘制图标
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.icon, x, y - 2);
    });
  },

  drawRadarLabel(ctx: any, centerX: number, centerY: number, radius: number, item: any, index: number) {
    const sides = 12;
    const angleStep = (Math.PI * 2) / sides;
    const angle = index * angleStep - Math.PI / 2;
    const value = item.value || 0;
    const r = (value / 100) * radius + 20;
    
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    
    ctx.fillStyle = '#888';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.name, x, y);
  },

  animateRadarLabels(ctx: any, centerX:ari: number, centerY: number, radius: number, data: any[]) {
    const sides = data.length;
    const angleStep = (Math.PI * 2) / sides;
    
    data.forEach((item: any, index: number) => {
      setTimeout(() => {
        this.drawRadarLabel(ctx, centerX, centerY, radius, item, index);
      }, index * 80);
    });
  },

  /**
   * 绘制雷达图网格
   */
  drawRadarGrid(ctx: any, centerX: number, centerY: number, radius: number) {
    const levels = 4;
    
    // 绘制同心多边形
    ctx.strokeStyle = 'rgba(138, 109, 255, 0.2)';
    ctx.lineWidth = 1;
    
    for (let j = 1; j <= levels; j++) {
      ctx.beginPath();
      const currRadius = (radius / levels) * j;
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i - Math.PI / 2;
        const x = centerX + Math.cos(angle) * currRadius;
        const y = centerY + Math.sin(angle) * currRadius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 绘制轴线
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i - Math.PI / 2;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
    }
    ctx.stroke();
  },

  /**
   * 绘制雷达图数据
   */
  drawRadarData(ctx: any, centerX: number, centerY: number, radius: number, data: any[]) {
    // 创建渐变
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(138, 109, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(138, 109, 255, 0.1)');

    ctx.beginPath();
    data.forEach((item, i) => {
      const angle = (Math.PI * 2 / 12) * i - Math.PI / 2;
      const val = item.value / 100;
      const r = val * radius;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // 绘制边框
    ctx.strokeStyle = '#8a6dff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 绘制数据点
    data.forEach((item, i) => {
      const angle = (Math.PI * 2 / 12) * i - Math.PI / 2;
      const val = item.value / 100;
      const r = val * radius;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#8a6dff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  },

  /**
   * 绘制雷达图标签
   */
  drawRadarLabels(ctx: any, centerX: number, centerY: number, radius: number, data: any[]) {
    ctx.fillStyle = '#aaa';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    data.forEach((item, i) => {
      const angle = (Math.PI * 2 / 12) * i - Math.PI / 2;
      const labelRadius = radius + 25;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;
      
      // 绘制图标
      ctx.font = '14px sans-serif';
      ctx.fillText(item.icon, x, y - 8);
      
      // 绘制名称
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#888';
      ctx.fillText(item.name, x, y + 8);
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
   * 分享报告
   */
  onShareAppMessage() {
    return {
      title: `我的心灵报告 - ${this.data.totalDreams}个梦境的分析`,
      path: '/pages/report/report'
    };
  }
});
