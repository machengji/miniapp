/**
 * Audio Engine for Cyber Incense Mini Program
 * Handles ASMR sound effects, burning sounds, and merit sounds
 */

import { AudioConfig } from './types';

// Declare wx global for TypeScript
declare const wx: unknown;

/**
 * AudioEngine class for managing all audio playback
 */
class AudioEngine {
  private burningSound: unknown | null = null;
  private audioContext: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private crackleInterval: number | null = null;
  private config: AudioConfig;

  constructor(config: AudioConfig = { volume: 0.3, loop: true, src: '' }) {
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize audio contexts
   */
  private initialize(): void {
    try {
      // Initialize innerAudioContext for burning sound
      if (typeof wx !== 'undefined' && wx.createInnerAudioContext) {
        this.burningSound = wx.createInnerAudioContext();
        (this.burningSound as any).src = this.config.src;
        (this.burningSound as any).loop = this.config.loop;
        (this.burningSound as any).volume = this.config.volume;
      }

      // Initialize Web Audio API for white noise
      if (typeof AudioContext !== 'undefined') {
        this.audioContext = new AudioContext();
        this.setupNoiseBuffer();
      }
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
    }
  }

  /**
   * Start burning sound (loop)
   */
  public startBurningSound(): void {
    if (!this.burningSound) {
      console.warn('Burning sound not initialized');
      return;
    }

    try {
      (this.burningSound as any).play();
      this.scheduleCrackles();
    } catch (error) {
      console.error('Failed to start burning sound:', error);
    }
  }

  /**
   * Stop burning sound
   */
  public stopBurningSound(): void {
    if (!this.burningSound) {
      return;
    }

    try {
      (this.burningSound as any).stop();
      if (this.crackleInterval) {
        clearInterval(this.crackleInterval);
        this.crackleInterval = null;
      }
    } catch (error) {
      console.error('Failed to stop burning sound:', error);
    }
  }

  /**
   * Play merit ding sound (clear bell)
   */
  public playMeritSound(): void {
    try {
      const meritSound = wx.createInnerAudioContext();
      meritSound.src = '/assets/audio/merit-ding.mp3';
      meritSound.volume = 0.8;
      meritSound.play();

      meritSound.onEnded(() => {
        meritSound.destroy();
      });
    } catch (error) {
      console.error('Failed to play merit sound:', error);
    }
  }

  /**
   * Play broken incense sound (low/deep)
   */
  public playBrokenSound(): void {
    try {
      const brokenSound = wx.createInnerAudioContext();
      brokenSound.src = '/assets/audio/broken-sad.mp3';
      brokenSound.volume = 0.6;
      brokenSound.play();

      // Vibrate for tactile feedback
      if (typeof wx !== 'undefined' && wx.vibrateShort) {
        wx.vibrateShort({ type: 'heavy' });
      }

      brokenSound.onEnded(() => {
        brokenSound.destroy();
      });
    } catch (error) {
      console.error('Failed to play broken sound:', error);
    }
  }

  /**
   * Schedule random crackle sounds during burning
   */
  private scheduleCrackles(): void {
    if (this.crackleInterval) {
      clearInterval(this.crackleInterval);
    }

    this.crackleInterval = setInterval(() => {
      // Random crackle between 2-5 seconds
      if (Math.random() < 0.3) {
        this.playCrackle();
      }
    }, 2000);
  }

  /**
   * Play a single crackle sound
   */
  private playCrackle(): void {
    try {
      const crackleSound = wx.createInnerAudioContext();
      crackleSound.src = '/assets/audio/burning-paper.mp3';
      crackleSound.volume = Math.random() * 0.3 + 0.2; // Random volume
      crackleSound.play();

      crackleSound.onEnded(() => {
        crackleSound.destroy();
      });
    } catch (error) {
      console.error('Failed to play crackle sound:', error);
    }
  }

  /**
   * Setup white noise buffer for burning sound
   */
  private setupNoiseBuffer(): void {
    if (!this.audioContext) {
      return;
    }

    try {
      const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate white noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.noiseBuffer = buffer;
    } catch (error) {
      console.error('Failed to setup noise buffer:', error);
    }
  }

  /**
   * Play white noise (alternative burning sound)
   */
  public playNoiseSound(duration: number = 1): void {
    if (!this.audioContext || !this.noiseBuffer) {
      return;
    }

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = this.noiseBuffer;
      source.loop = true;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.1;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start(0);

      // Stop after duration
      setTimeout(() => {
        source.stop();
      }, duration * 1000);
    } catch (error) {
      console.error('Failed to play noise sound:', error);
    }
  }

  /**
   * Set volume for burning sound
   */
  public setVolume(volume: number): void {
    if (!this.burningSound) {
      return;
    }

    (this.burningSound as any).volume = volume;
  }

  /**
   * Destroy audio engine
   */
  public destroy(): void {
    this.stopBurningSound();

    if (this.burningSound) {
      (this.burningSound as any).destroy();
      this.burningSound = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export singleton instance
const audioEngine = new AudioEngine();
export default audioEngine;
