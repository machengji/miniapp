/**
 * Type definitions for Cyber Incense Mini Program
 */

/**
 * Type of incense available
 */
export type IncenseType = 'normal' | 'cyber';

/**
 * Type of prayer/blessing
 */
export type PrayerType = 'career' | 'love' | 'health' | 'enemy';

/**
 * Merit record structure for tracking accumulated merit
 */
export interface MeritRecord {
  count: number;
  types: Array<{
    type: PrayerType;
    time: number;
    amount: number;
  }>;
}

/**
 * Burn history for tracking incense burning events
 */
export interface BurnHistory {
  broken: boolean;
  time: number;
}

/**
 * Incense configuration for different incense types
 */
export interface IncenseConfig {
  id: string;
  name: string;
  cost: number | string;
  icon: string;
  desc: string;
}

/**
 * Incense burning state
 */
export interface BurningState {
  progress: number;
  isBurning: boolean;
  ashSegments: number[];
  brokenAlert: boolean;
}

/**
 * Audio engine configuration
 */
export interface AudioConfig {
  volume: number;
  loop: boolean;
  src: string;
}
