// app.ts
export interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo;
    refreshDreamList?: boolean;
  };
  userInfoReadyCallback?: (userInfo: WechatMiniprogram.UserInfo) => void;
}

App<IAppOption>({
  globalData: {
    refreshDreamList: false
  },
  
  onLaunch() {
    // 云开发初始化
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用云开发能力',
        showCancel: false
      });
    } else {
      wx.cloud.init({
        env: 'ai-2gps1hrk9062b64c', // 你的云开发环境ID
        traceUser: true,
      });
      
      // 初始化用户档案
      this.initUserProfile();
    }

    // 获取用户信息
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: (res) => {
              this.globalData.userInfo = res.userInfo;
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res.userInfo);
              }
              // 更新用户档案
              this.updateUserProfile(res.userInfo);
            }
          });
        }
      }
    });
  },

  /**
   * 初始化用户档案
   */
  initUserProfile() {
    wx.cloud.callFunction({
      name: 'updateUser',
      data: {}
    }).then((res: any) => {
      console.log('用户档案初始化:', res.result);
      if (res.result && res.result.isNewUser) {
        console.log('欢迎新用户！');
      }
    }).catch(err => {
      console.error('用户档案初始化失败:', err);
    });
  },

  /**
   * 更新用户档案
   */
  updateUserProfile(userInfo?: WechatMiniprogram.UserInfo) {
    wx.cloud.callFunction({
      name: 'updateUser',
      data: { userInfo }
    }).catch(err => {
      console.error('更新用户档案失败:', err);
    });
  },

  /**
   * 记录梦境后更新用户统计
   */
  onDreamRecorded() {
    wx.cloud.callFunction({
      name: 'updateUser',
      data: { action: 'recordDream' }
    }).then(() => {
      // 标记需要刷新首页
      this.globalData.refreshDreamList = true;
    }).catch(err => {
      console.error('更新用户统计失败:', err);
    });
  }
});
