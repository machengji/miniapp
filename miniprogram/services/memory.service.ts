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
    this.MAX_MEMORY_ITEMS = 2; // 减少到2条
    this.MAX_CONTENT_LENGTH = 100; // 减少到100字
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
        .limit(10) // 减少到10条
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
   * 构建记忆上下文文本（精简版）
   */
  private buildMemoryContext(
    relatedDreams: DreamRecord[],
    allDreams: DreamRecord[]
  ): MemoryContext {
    
    // 提取重复出现的意象
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
      .slice(0, 3)
      .map(([kw, _]) => kw);

    // 构建极简记忆文本
    let memoryText = `历史梦境${allDreams.length}次。`;
    
    if (recurrentSymbols.length > 0) {
      memoryText += `反复：${recurrentSymbols.join('、')}。`;
    }

    // 只保留最近2条梦境的极简摘要
    if (relatedDreams.length > 0) {
      memoryText += '近期：';
      relatedDreams.slice(0, 2).forEach(dream => {
        const summary = dream.summary || dream.content.substring(0, 20);
        memoryText += `${summary.substring(0, 15)}... `;
      });
    }

    return {
      text: memoryText,
      relatedDreams,
      recurrentSymbols,
      emotionTrend: ''
    };
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
