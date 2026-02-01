/**
 * Main Hall Page - Select prayer type
 */

import { PrayerType } from '../../utils/types';

Page({
  data: {
    prayerTypes: [
      { id: 'career' as PrayerType, name: '事业', icon: '💼', desc: '职场顺遂，步步高升' },
      { id: 'love' as PrayerType, name: '姻缘', icon: '💕', desc: '桃花朵朵，美满良缘' },
      { id: 'health' as PrayerType, name: '健康', icon: '🏥', desc: '身体健康，平安喜乐' },
      { id: 'enemy' as PrayerType, name: '冤家退散', icon: '🚫', desc: '消除小人，远离是非' }
    ],
    selectedType: '' as PrayerType | '',
    todayMerit: 0
  },

  onLoad(): void {
    this.loadTodayMerit();
  },

  onShow(): void {
    this.loadTodayMerit();
  },

  /**
   * Load today's merit
   */
  loadTodayMerit(): void {
    const MeritManager = require('../../utils/merit-storage').default;
    this.setData({
      todayMerit: MeritManager.getTodayMerit()
    });
  },

  /**
   * Handle prayer type selection
   */
  onPrayerSelect(event: any): void {
    const prayerType = event.currentTarget.dataset.type;
    this.setData({
      selectedType: prayerType
    });

    // Navigate to altar page with prayer type
    wx.navigateTo({
      url: `/pages/altar/altar?type=${prayerType}`
    });
  },

  /**
   * Navigate to merit book
   */
  onShowMerit(): void {
    wx.navigateTo({
      url: '/pages/merit/merit'
    });
  },

  /**
   * Navigate to shop
   */
  onShowShop(): void {
    wx.navigateTo({
      url: '/pages/shop/shop'
    });
  }
});
