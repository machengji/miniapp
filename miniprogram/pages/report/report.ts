Page({
  data: {
    personaPercentage: 50,
    polarityInsight: "你的意识与潜意识目前处于平衡状态。",
    totalDreams: 0,
    avgClarity: "0.0",
    dominantMood: "-",
    // 荣格 12 原型 (用于雷达图)
    archetypes: [
      { name: '天真者', value: 0 }, { name: '孤儿', value: 0 }, 
      { name: '英雄', value: 0 }, { name: '照顾者', value: 0 },
      { name: '探索者', value: 0 }, { name: '反叛者', value: 0 },
      { name: '情人', value: 0 }, { name: '创造者', value: 0 },
      { name: '小丑', value: 0 }, { name: '智者', value: 0 },
      { name: '魔术师', value: 0 }, { name: '统治者', value: 0 }
    ]
  },

  onShow() {
    this.calculateStats();
  },

  calculateStats() {
    const db = wx.cloud.database();
    db.collection('dreams').get().then(res => {
      const dreams = res.data;
      if (dreams.length === 0) return;

      // 1. 基础统计
      const total = dreams.length;
      const totalClarity = dreams.reduce((acc: number, cur: any) => acc + (cur.clarity || 0), 0);
      const avgClarity = (totalClarity / total).toFixed(1);

      // 2. 情绪分析 & 简单的原型映射 (Mock Logic for MVP)
      // 真实场景应该由 AI 在分析时打标。这里我们用 mood 做一个简单映射。
      const moodCounts: any = {};
      let archetypeScores = [...this.data.archetypes];
      
      // 映射规则：Mood -> Archetype Bonus
      const mapping: any = {
        '焦虑': [1, 5], // 孤儿, 反叛者
        '恐惧': [1],    // 孤儿
        '喜悦': [0, 6], // 天真者, 情人
        '愤怒': [2, 5], // 英雄, 反叛者
        '平静': [9],    // 智者
        '困惑': [4],    // 探索者
        '悲伤': [3],    // 照顾者 (自我照顾)
        '羞耻': [11]    // 统治者 (失控)
      };

      dreams.forEach((d: any) => {
        // Mood Stat
        const m = d.mood || 'unknown';
        moodCounts[m] = (moodCounts[m] || 0) + 1;

        // Archetype Score Accumulation
        if (mapping[m]) {
          mapping[m].forEach((idx: number) => {
            archetypeScores[idx].value += 1;
          });
        }
      });

      // Normalize scores (0-100) for radar
      const maxScore = Math.max(...archetypeScores.map(a => a.value)) || 1;
      archetypeScores = archetypeScores.map(a => ({
        ...a,
        value: (a.value / maxScore) * 80 + 20 // 基础分20，防止图形太小
      }));

      // Dominant Mood
      let domMood = '-';
      let maxCount = 0;
      for (let m in moodCounts) {
        if (moodCounts[m] > maxCount) {
          maxCount = moodCounts[m];
          domMood = m;
        }
      }

      // Persona/Shadow Calculation
      // 假设：负面情绪越多，Shadow 越活跃；正面情绪多，Persona 越稳固
      // 这只是一个简单的算法演示
      const negativeMoods = ['恐惧', '焦虑', '愤怒', '羞耻', '悲伤'];
      let negCount = 0;
      dreams.forEach((d: any) => {
        if (negativeMoods.includes(d.mood)) negCount++;
      });
      const shadowRatio = negCount / total;
      // Persona % = 100 - (ShadowRatio * 100). If shadow is 0.8 (80%), Persona is 20%.
      // We want the bar to show Persona vs Shadow. Let's say Left is Persona (100%), Right is Shadow (0%)?
      // No, typical slider. Let's say value is Persona %.
      const personaPct = Math.floor((1 - shadowRatio * 0.8) * 100); 

      let insight = "你的心灵处于动态平衡中。";
      if (personaPct > 80) insight = "你的防御机制（面具）很强，可能压抑了部分真实感受。";
      if (personaPct < 40) insight = "阴影原型正在浮现，这虽令人不安，却是转化的契机。";

      this.setData({
        totalDreams: total,
        avgClarity: avgClarity,
        dominantMood: domMood,
        archetypes: archetypeScores,
        personaPercentage: personaPct,
        polarityInsight: insight
      });

      // 渲染 Canvas
      this.drawRadar(archetypeScores);
    });
  },

  drawRadar(data: any[]) {
    const query = wx.createSelectorQuery();
    query.select('#radarCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        const width = res[0].width;
        const height = res[0].height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40; // Padding

        ctx.clearRect(0, 0, width, height);

        // 1. Draw Background Grid (Spider Web)
        const levels = 4;
        ctx.strokeStyle = '#333';
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

        // Draw Axes
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 / 12) * i - Math.PI / 2;
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
        }
        ctx.stroke();

        // 2. Draw Data Shape
        ctx.beginPath();
        ctx.fillStyle = 'rgba(138, 109, 255, 0.4)'; // Purple transparent
        ctx.strokeStyle = '#8a6dff';
        ctx.lineWidth = 2;

        data.forEach((item, i) => {
          const angle = (Math.PI * 2 / 12) * i - Math.PI / 2;
          const val = item.value / 100; // Normalized 0-1
          const r = val * radius;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Draw Labels
        ctx.fillStyle = '#888';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        data.forEach((item, i) => {
          const angle = (Math.PI * 2 / 12) * i - Math.PI / 2;
          const labelRadius = radius + 20;
          const x = centerX + Math.cos(angle) * labelRadius;
          const y = centerY + Math.sin(angle) * labelRadius;
          ctx.fillText(item.name, x, y);
        });
      })
  }
})
