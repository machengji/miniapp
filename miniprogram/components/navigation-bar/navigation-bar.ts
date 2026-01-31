Component({
  options: {
    multipleSlots: true
  },
  properties: {
    extClass: {
      type: String,
      value: ''
    },
    title: {
      type: String,
      value: ''
    },
    background: {
      type: String,
      value: ''
    },
    color: {
      type: String,
      value: ''
    },
    back: {
      type: Boolean,
      value: true
    },
    loading: {
      type: Boolean,
      value: false
    },
    homeButton: {
      type: Boolean,
      value: false,
    },
    animated: {
      type: Boolean,
      value: true
    },
    show: {
      type: Boolean,
      value: true,
      observer: '_showChange'
    },
    delta: {
      type: Number,
      value: 1
    },
  },
  data: {
    displayStyle: '',
    navBarHeight: 0,
    navBarTop: 0,
  },
  lifetimes: {
    attached() {
      this.calculateNavBarHeight();
    },
  },
  methods: {
    calculateNavBarHeight() {
      const systemInfo = wx.getSystemInfoSync();
      const menuButton = wx.getMenuButtonBoundingClientRect();
      const statusBarHeight = systemInfo.statusBarHeight || 20; // 默认20px

      // 胶囊按钮信息
      const menuHeight = menuButton.height || 32;
      const menuTop = menuButton.top || statusBarHeight;

      // 计算导航栏高度（胶囊上下间距）
      const navBarHeight = (menuTop - statusBarHeight) * 2 + menuHeight;

      // 右侧padding
      const rightPadding = systemInfo.windowWidth - menuButton.right;

      this.setData({
        navBarHeight: statusBarHeight + navBarHeight,
        navBarTop: statusBarHeight,
        navStyle: `height: ${statusBarHeight + navBarHeight}px; top: 0;`,
        innerPaddingRight: `padding-right: ${rightPadding}px`,
        leftWidth: `width: ${systemInfo.windowWidth - menuButton.left}px`,
        ios: systemInfo.platform !== 'android',
        statusBarHeight: statusBarHeight,
      });

      this.triggerEvent('heightready', { totalHeight: statusBarHeight + navBarHeight });
    },

    _showChange(show: boolean) {
      const animated = this.data.animated
      let displayStyle = ''
      if (animated) {
        displayStyle = `opacity: ${show ? '1' : '0'};transition:opacity 0.5s;`
      } else {
        displayStyle = `display: ${show ? '' : 'none'}`
      }
      this.setData({ displayStyle })
    },

    back() {
      const data = this.data
      if (data.delta) {
        wx.navigateBack({ delta: data.delta })
      }
      this.triggerEvent('back', { delta: data.delta }, {})
    }
  },
})
