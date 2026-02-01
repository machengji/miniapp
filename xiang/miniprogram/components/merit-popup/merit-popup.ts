/**
 * Merit Popup Component - Floating "+1 merit" animation
 * TODO: Implement full merit popup animation
 */

Component({
  properties: {
    amount: {
      type: Number,
      value: 1
    },
    position: {
      type: Object,
      value: { x: 0, y: 0 }
    }
  },

  lifetimes: {
    ready(): void {
      // TODO: Trigger animation on ready
    }
  },

  methods: {
    onAnimationEnd(): void {
      // TODO: Destroy component when animation ends
    }
  }
});
