/**
 * Incense Canvas Component - Burning animation
 */

import { BurningState, IncenseType } from '../../utils/types';

Component({
  data: {
    progress: 100,
    isBurning: false,
    ashSegments: [],
    brokenAlert: false
  } as BurningState,

  properties: {
    incenseType: {
      type: String,
      value: 'normal' as IncenseType
    }
  },

  lifetimes: {
    ready(): void {
      this.initCanvas();
    }
  },

  methods: {
    private canvas: unknown | null = null;
    private ctx: unknown | null = null;
    private animationFrame: number | null = null;
    private burningInterval: number | null = null;

    /**
     * Initialize Canvas
     */
    initCanvas(): void {
      const query = (wx as any).createSelectorQuery();
      query.select('#incenseCanvas')
        .fields({ node: true, size: true })
        .exec((res: any) => {
          if (!res || !res[0]) {
            return;
          }

          this.canvas = res[0].node;
          this.ctx = this.canvas.getContext('2d');

          // Set canvas size
          const dpr = (wx as any).getSystemInfoSync().pixelRatio;
          this.canvas.width = res[0].width * dpr;
          this.canvas.height = res[0].height * dpr;
          this.ctx.scale(dpr, dpr);
        });
    },

    /**
     * Start burning animation
     */
    startBurning(): void {
      if (this.data.isBurning) {
        return;
      }

      this.setData({
        isBurning: true,
        progress: 100,
        ashSegments: [],
        brokenAlert: false
      });

      const burnRate = this.properties.incenseType === 'cyber' ? 0.8 : 0.5;
      let progress = 100;

      this.burningInterval = setInterval(() => {
        progress -= burnRate;

        // Random break check (1% probability)
        if (Math.random() < 0.01 && progress < 80 && progress > 20) {
          this.handleBrokenIncense(progress);
          return;
        }

        // Add ash segments
        if (progress < 90 && Math.random() < 0.1) {
          const ashSegments = [...this.data.ashSegments, progress];
          this.setData({ ashSegments });
        }

        this.setData({ progress });

        // Draw incense
        if (this.ctx && this.canvas) {
          this.drawIncense(this.ctx, progress, this.properties.incenseType);
        }

        // Check for completion
        if (progress <= 0) {
          this.handleBurnComplete();
        }
      }, 100);
    },

    /**
     * Draw incense with gradient
     */
    drawIncense(ctx: unknown, progress: number, type: string): void {
      const canvas = this.canvas;
      if (!canvas || !ctx) {
        return;
      }

      const canvasWidth = (canvas as any).width / (wx as any).getSystemInfoSync().pixelRatio;
      const canvasHeight = (canvas as any).height / (wx as any).getSystemInfoSync().pixelRatio;

      // Clear canvas
      (ctx as any).clearRect(0, 0, canvasWidth, canvasHeight);

      const centerX = canvasWidth / 2;
      const baseY = canvasHeight - 100;
      const height = (canvasHeight - 150) * (progress / 100);

      // Draw censer base
      this.drawCenser(ctx, centerX, baseY);

      // Draw ash segments
      this.drawAshSegments(ctx, centerX, baseY);

      // Draw incense body with gradient
      const gradient = (ctx as any).createLinearGradient(centerX, baseY - height, centerX, baseY);

      if (type === 'cyber') {
        // Cyber neon gradient
        gradient.addColorStop(0, '#00ff9d');
        gradient.addColorStop(0.5, '#00ccff');
        gradient.addColorStop(0.9, '#0066ff');
        gradient.addColorStop(1, '#ff00ff');
      } else {
        // Normal incense gradient
        gradient.addColorStop(0, '#8b4513');
        gradient.addColorStop(0.9, '#d4a373');
        gradient.addColorStop(1, '#ff4500');
      }

      (ctx as any).beginPath();
      (ctx as any).moveTo(centerX, baseY);
      (ctx as any).lineTo(centerX, baseY - height);
      (ctx as any).lineWidth = type === 'cyber' ? 6 : 4;
      (ctx as any).lineCap = 'round';
      (ctx as any).strokeStyle = gradient;
      (ctx as any).stroke();

      // Draw burning point with glow
      if (progress > 0) {
        this.drawBurningPoint(ctx, centerX, baseY - height, type);
      }

      // Draw smoke particles
      this.drawSmoke(ctx, centerX, baseY - height);
    },

    /**
     * Draw censer (incense holder)
     */
    drawCenser(ctx: unknown, x: number, y: number): void {
      const c = ctx as any;

      c.beginPath();
      c.ellipse(x, y, 80, 30, 0, 0, Math.PI * 2);
      c.fillStyle = '#2c3e50';
      c.fill();
      c.strokeStyle = '#34495e';
      c.lineWidth = 3;
      c.stroke();

      // Draw censer decorations
      c.beginPath();
      c.arc(x, y - 20, 60, Math.PI, 0);
      c.strokeStyle = '#f1c40f';
      c.lineWidth = 2;
      c.stroke();
    },

    /**
     * Draw ash segments
     */
    drawAshSegments(ctx: unknown, centerX: number, baseY: number): void {
      const c = ctx as any;
      const canvasHeight = (this.canvas as any).height / (wx as any).getSystemInfoSync().pixelRatio;

      this.data.ashSegments.forEach((seg: number) => {
        const height = (canvasHeight - 150) * (seg / 100);
        const y = baseY - height;

        c.beginPath();
        c.moveTo(centerX - 5, y);
        c.lineTo(centerX + 5, y);
        c.strokeStyle = '#808080';
        c.lineWidth = 2;
        c.stroke();
      });
    },

    /**
     * Draw burning point with glow effect
     */
    drawBurningPoint(ctx: unknown, x: number, y: number, type: string): void {
      const c = ctx as any;

      // Draw glow
      c.shadowColor = type === 'cyber' ? '#00ff9d' : '#ff4500';
      c.shadowBlur = type === 'cyber' ? 15 : 8;

      c.beginPath();
      c.arc(x, y, 4, 0, Math.PI * 2);
      c.fillStyle = type === 'cyber' ? '#00ff9d' : '#ff4500';
      c.fill();

      // Reset shadow
      c.shadowBlur = 0;
    },

    /**
     * Draw smoke particles
     */
    drawSmoke(ctx: unknown, x: number, y: number): void {
      const c = ctx as any;

      for (let i = 0; i < 5; i++) {
        const offsetX = (Math.random() - 0.5) * 10;
        const offsetY = -Math.random() * 20;
        const size = Math.random() * 6 + 2;
        const opacity = Math.random() * 0.3 + 0.1;

        c.beginPath();
        c.arc(x + offsetX, y + offsetY, size, 0, Math.PI * 2);
        c.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        c.fill();
      }
    },

    /**
     * Handle broken incense
     */
    handleBrokenIncense(breakPoint: number): void {
      this.stopBurning();

      this.setData({
        progress: breakPoint,
        brokenAlert: true
      });

      // Trigger broken event
      this.triggerEvent('incenseBroken', {
        penalty: 10,
        progress: breakPoint
      });

      // Draw broken effect
      if (this.ctx && this.canvas) {
        this.drawBrokenEffect(this.ctx, breakPoint);
      }

      // Vibrate
      (wx as any).vibrateShort({ type: 'heavy' });
    },

    /**
     * Draw broken incense effect
     */
    drawBrokenEffect(ctx: unknown, breakPoint: number): void {
      const c = ctx as any;
      const canvas = this.canvas;
      if (!canvas || !ctx) {
        return;
      }

      const canvasWidth = (canvas as any).width / (wx as any).getSystemInfoSync().pixelRatio;
      const canvasHeight = (canvas as any).height / (wx as any).getSystemInfoSync().pixelRatio;

      const centerX = canvasWidth / 2;
      const baseY = canvasHeight - 100;
      const height = (canvasHeight - 150) * (breakPoint / 100);

      // Draw broken pieces
      c.beginPath();
      c.moveTo(centerX - 10, baseY - height);
      c.lineTo(centerX + 10, baseY - height - 20);
      c.strokeStyle = '#e74c3c';
      c.lineWidth = 2;
      c.stroke();

      // Draw red X mark
      const x = centerX;
      const y = baseY - height - 50;
      const size = 20;

      c.beginPath();
      c.moveTo(x - size, y - size);
      c.lineTo(x + size, y + size);
      c.moveTo(x + size, y - size);
      c.lineTo(x - size, y + size);
      c.strokeStyle = '#e74c3c';
      c.lineWidth = 4;
      c.stroke();
    },

    /**
     * Handle burn complete
     */
    handleBurnComplete(): void {
      this.stopBurning();

      this.setData({
        progress: 0,
        isBurning: false
      });

      // Trigger complete event
      this.triggerEvent('burnComplete', {
        type: this.properties.incenseType
      });
    },

    /**
     * Stop burning animation
     */
    stopBurning(): void {
      if (this.burningInterval) {
        clearInterval(this.burningInterval);
        this.burningInterval = null;
      }

      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
    },

    /**
     * Reset component state
     */
    reset(): void {
      this.stopBurning();
      this.setData({
        progress: 100,
        isBurning: false,
        ashSegments: [],
        brokenAlert: false
      });

      // Clear canvas
      if (this.ctx && this.canvas) {
        const canvasWidth = (this.canvas as any).width / (wx as any).getSystemInfoSync().pixelRatio;
        const canvasHeight = (this.canvas as any).height / (wx as any).getSystemInfoSync().pixelRatio;
        (this.ctx as any).clearRect(0, 0, canvasWidth, canvasHeight);
      }
    }
  }
});
