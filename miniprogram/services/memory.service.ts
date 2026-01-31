// memory.service.ts - 长期记忆管理服务

export interface DreamRecord {
  _id: string;
  content: string;
  summary: string;
  mood: string;
  keywords: string[];
  archetypeScores: Record<string, number>;
  createTime: string;
}

export interface MemoryContext {
  text: string;
  relatedDreams: DreamRecord[];
  recurrentSymbols: string[];
  emotionTrend: string;
}

class MemoryService {
  private MAX_MEMORY_ITEMS: number;
  private MAX_CONTENT_LENGTH: number;
  private SIMILARITY_THRESHOLD: number;

  constructor() {
    this.MAX_MEMORY_ITEMS = 5;
    this.MAX_CONTENT_LENGTH = 200;
    this.SIMILARITY_THRESHOLD = 0.3;
  }

  /**
   * 加载用户的长期记忆
   * @param currentContent 当前梦境内容（用于相似度匹配）
   * @returns 记忆上下文
   */
  async loadMemoryContext(currentContent: string = ''): Promise<MemoryContext> {
    try {
      const db = wx.cloud.database();
      const { data } = await db.collection('dreams')
        .orderBy('createTime', 'desc')
        .limit(20) // 先取20条，然后筛选
        .get();

      if (data.length === 0) {
        return {
          text: '',
          relatedDreams: [],
          recurrentSymbols: [],
          emotionTrend: ''
        };
      }

      // 转换为 DreamRecord 类型
      const dreams: DreamRecord[] = data.map((d: any) => ({
        _id: d._id,
        content: d.content,
        summary: d.summary,
        mood: d.mood,
        keywords: d.keywords || [],
        archetypeScores: d.archetypeScores || {},
        createTime: d.createTime
      }));

      // 如果当前内容为空（新会话），返回最近的几条
      if (!currentContent) {
        const recentDreams = dreams.slice(0, this.MAX_MEMORY_ITEMS);
        return this.buildMemoryContext(recentDreams, dreams);
      }

      // 计算相似度，找出相关的梦境
      const scoredDreams = dreams.map(dream => ({
        dream,
        score: this.calculateSimilarity(currentContent, dream)
      }));

      // 按相似度排序，取前 N 条
      scoredDreams.sort((a, b) => b.score - a.score);
      const relatedDreams = scoredDreams
        .filter(item => item.score > this.SIMILARITY_THRESHOLD)
        .slice(0, this.MAX_MEMORY_ITEMS)
        .map(item => item.dream);

      // 如果没有相似度高的，就取最近的
      if (relatedDreams.length === 0) {
        relatedDreams.push(...dreams.slice(0, this.MAX_MEMORY_ITEMS));
      }

      return this.buildMemoryContext(relatedDreams, dreams);

    } catch (err) {
      console.error('加载记忆失败:', err);
      return {
        text: '',
        relatedDreams: [],
        recurrentSymbols: [],
        emotionTrend: ''
      };
    }
  }

  /**
   * 计算当前梦境与历史梦境的相似度
   */
  private calculateSimilarity(current: string, dream: DreamRecord): number {
    let score = 0;
    const currentLower = current.toLowerCase();

    // 1. 关键词匹配（权重最高）
    if (dream.keywords && dream.keywords.length > 0) {
      dream.keywords.forEach((keyword: string) => {
        if (currentLower.includes(keyword.toLowerCase())) {
          score += 0.4;
        }
      });
    }

    // 2. 内容文本匹配
    const dreamContentLower = dream.content.toLowerCase();
    const words = currentLower.split(/\s+/);
    words.forEach((word: string) => {
      if (word.length > 1 && dreamContentLower.includes(word)) {
        score += 0.1;
      }
    });

    return Math.min(score, 1.0);
  }

  /**
   * 构建记忆上下文文本
   */
  private buildMemoryContext(
    relatedDreams: DreamRecord[],
    allDreams: DreamRecord[]
  ): MemoryContext {
    
    // 提取重复出现的意象（在多条梦境中出现的关键词）
    const keywordCounts: Record<string, number> = {};
    allDreams.forEach(dream => {
      if (dream.keywords) {
        dream.keywords.forEach((kw: string) => {
          keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
        });
      }
    });
    
    const recurrentSymbols = Object.entries(keywordCounts)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([kw, _]) => kw);

    // 分析情绪趋势
    const emotionTrend = this.analyzeEmotionTrend(allDreams);

    // 构建记忆文本
    let memoryText = '\n\n【长期记忆档案】\n';
    memoryText += `该用户累计记录 ${allDreams.length} 个梦境。\n\n`;
    
    if (recurrentSymbols.length > 0) {
      memoryText += `【反复出现的意象】${recurrentSymbols.join('、')}\n\n`;
    }

    if (emotionTrend) {
      memoryText += `【情绪趋势】${emotionTrend}\n\n`;
    }

    memoryText += '【相关历史梦境】（按时间倒序）：\n';
    
    relatedDreams.forEach((dream, index) => {
      const date = new Date(dream.createTime);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      
      // 截断内容，避免过长
      let content = dream.content;
      if (content.length > this.MAX_CONTENT_LENGTH) {
        content = content.substring(0, this.MAX_CONTENT_LENGTH) + '...';
      }
      
      memoryText += `${index + 1}. [${dateStr}] `;
      if (dream.summary) {
        memoryText += `《${dream.summary}》`;
      }
      if (dream.mood && dream.mood !== 'unknown') {
        memoryText += `[${dream.mood}]`;
      }
      memoryText += `：${content}\n`;
      
      if (dream.keywords && dream.keywords.length > 0) {
        memoryText += `   关键词：${dream.keywords.slice(0, 3).join('、')}\n`;
      }
    });

    memoryText += '\n【分析指令】\n';
    memoryText += '1. 寻找重复意象：上述历史中是否有意象再次出现？形态有何变化？\n';
    memoryText += '2. 对比情绪曲线：用户当前情绪与历史相比是恶化了还是改善了？\n';
    memoryText += '3. 指出联系：在回复中显式地指出与历史的联系（例如：“这让你想起了...”）\n';

    return {
      text: memoryText,
      relatedDreams,
      recurrentSymbols,
      emotionTrend
    };
  }

  /**
   * 分析情绪趋势
   */
  private analyzeEmotionTrend(dreams: DreamRecord[]): string {
    if (dreams.length < 2) return '';

    // 情绪权重（负面到正面）
    const emotionWeights: Record<string, number> = {
      '喜悦': 2,
      '平静': 1,
      '困惑': 0,
      '焦虑': -1,
      '恐惧': -2,
      '悲伤': -2,
      '愤怒': -2,
      '羞耻': -2
    };

    // 最近3次的情绪
    const recentMoods = dreams.slice(0, 3).map(d => d.mood);
    const recentWeights = recentMoods.map(m => emotionWeights[m] || 0);
    const recentAvg = recentWeights.reduce((a, b) => a + b, 0) / recentWeights.length;

    // 更早的情绪（第4-6次）
    const olderMoods = dreams.slice(3, 6).map(d => d.mood);
    const olderWeights = olderMoods.map(m => emotionWeights[m] || 0);
    const olderAvg = olderWeights.length > 0 
      ? olderWeights.reduce((a, b) => a + b, 0) / olderWeights.length 
      : 0;

    if (recentAvg > olderAvg + 0.5) {
      return '近期情绪有明显好转，积极情绪增多';
    } else if (recentAvg < olderAvg - 0.5) {
      return '近期情绪波动较大，可能存在压抑或焦虑';
    } else {
      return '近期情绪相对稳定';
    }
  }

  /**
   * 检查是否为新用户（没有历史记录）
   */
  async isNewUser(): Promise<boolean> {
    try {
      const db = wx.cloud.database();
      const { total } = await db.collection('dreams').count();
      return total === 0;
    } catch {
      return true;
    }
  }
}

export const memoryService = new MemoryService();
