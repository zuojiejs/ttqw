// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database()

const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { shareId, num, viewedIds } = event
  let list = []
  let limit = num || 6
  let filterIds = viewedIds || []

  const vieweds = await db.collection('viewed_db').where({
    openid
  }).get()
  if (vieweds && vieweds.data && vieweds.data.length) {
    const oldViewedIds = JSON.parse(vieweds.data[0].ids)
    filterIds = filterIds.concat(oldViewedIds)
  }

  if (shareId) {
    const shareRes = await db.collection('qw_db').where({
      _id: shareId
    }).get()
    if (shareRes && shareRes.data && shareRes.data.length) {
      list.push(shareRes.data[0])
      limit -= 1
      if (filterIds.indexOf(shareId) === -1) {
        filterIds.push(shareId)
      }
    }
  }

  const res = await db.collection('qw_db').where({
    _id: _.nin(filterIds)
  }).limit(limit).get()
  if (res && res.data) {
    list = list.concat(res.data)
  }
  
  return {
    list
  }
}