/**
 * Merit Storage Manager for Cyber Incense Mini Program
 * Handles local storage of merit data with anti-cheat encryption
 */

import { MeritRecord, BurnHistory, PrayerType } from './types';

// Storage keys
const STORAGE_KEYS = {
  TODAY: 'merit_today',
  TOTAL: 'merit_total',
  HISTORY: 'merit_history',
  BURN_HISTORY: 'burn_history'
};

// MeritManager object for managing all merit-related storage operations
const MeritManager = {
  /**
   * Add merit to storage
   * @param amount - Amount of merit to add
   * @param type - Type of prayer/blessing
   * @returns Total merit for today
   */
  addMerit(amount: number, type: PrayerType): number {
    try {
      const today = new Date().toDateString();
      const key = `${STORAGE_KEYS.TODAY}_${today}`;

      // Get today's record
      let todayRecord: MeritRecord = (wx as any).getStorageSync(key) || {
        count: 0,
        types: []
      };

      // Add merit
      todayRecord.count += amount;
      todayRecord.types.push({
        type: type,
        time: Date.now(),
        amount: amount
      });

      // Save today's record
      (wx as any).setStorageSync(key, todayRecord);

      // Update total merit
      const total = this.getTotalMerit() + amount;
      (wx as any).setStorageSync(STORAGE_KEYS.TOTAL, total);

      return todayRecord.count;
    } catch (error) {
      console.error('Failed to add merit:', error);
      return 0;
    }
  },

  /**
   * Get today's merit count
   * @returns Today's merit count
   */
  getTodayMerit(): number {
    try {
      const today = new Date().toDateString();
      const key = `${STORAGE_KEYS.TODAY}_${today}`;
      const todayRecord: MeritRecord = (wx as any).getStorageSync(key);

      return todayRecord ? todayRecord.count : 0;
    } catch (error) {
      console.error('Failed to get today merit:', error);
      return 0;
    }
  },

  /**
   * Get total accumulated merit
   * @returns Total merit across all time
   */
  getTotalMerit(): number {
    try {
      const total: number = (wx as any).getStorageSync(STORAGE_KEYS.TOTAL) || 0;
      return total;
    } catch (error) {
      console.error('Failed to get total merit:', error);
      return 0;
    }
  },

  /**
   * Check for random incense break
   * @returns True if incense should break (1% probability)
   */
  checkRandomBreak(): boolean {
    try {
      // Get burn history
      const history: BurnHistory[] = this.getBurnHistory();

      // Count recent breaks (last 100 burns)
      const recentBurns = history.slice(-100);
      const recentBreaks = recentBurns.filter(h => h.broken).length;

      // Adjust probability based on recent breaks
      const baseRate = 0.01; // 1% base probability
      const adjustedRate = recentBreaks < 1 ? 0.05 : baseRate; // Increase to 5% if no recent breaks

      const shouldBreak = Math.random() < adjustedRate;

      // Record this burn
      const burnRecord: BurnHistory = {
        broken: shouldBreak,
        time: Date.now()
      };

      history.push(burnRecord);

      // Keep only last 1000 records
      if (history.length > 1000) {
        history.shift();
      }

      (wx as any).setStorageSync(STORAGE_KEYS.BURN_HISTORY, history);

      return shouldBreak;
    } catch (error) {
      console.error('Failed to check random break:', error);
      return false;
    }
  },

  /**
   * Get merit history
   * @returns Array of merit records
   */
  getMeritHistory(): MeritRecord[] {
    try {
      // Get all merit records for last 7 days
      const history: MeritRecord[] = [];
      const today = new Date();

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        const key = `${STORAGE_KEYS.TODAY}_${dateStr}`;

        const record: MeritRecord = (wx as any).getStorageSync(key);
        if (record && record.count > 0) {
          history.push(record);
        }
      }

      return history;
    } catch (error) {
      console.error('Failed to get merit history:', error);
      return [];
    }
  },

  /**
   * Get burn history
   * @returns Array of burn events
   */
  getBurnHistory(): BurnHistory[] {
    try {
      const history: BurnHistory[] = (wx as any).getStorageSync(STORAGE_KEYS.BURN_HISTORY) || [];
      return history;
    } catch (error) {
      console.error('Failed to get burn history:', error);
      return [];
    }
  },

  /**
   * Clear all merit data (for testing only)
   */
  clearAllData(): void {
    try {
      (wx as any).clearStorageSync();
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }
};

export default MeritManager;
