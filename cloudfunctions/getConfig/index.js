// 云函数入口函数
exports.main = async (event, context) => {
  return {
    share: {
      show: true,
      num: 3,
      text: '天天奇闻，每天带你看奇闻',
      tips: '今日奇闻已看完，转发分享可以查看更多奇闻哦'
    }
  }
}