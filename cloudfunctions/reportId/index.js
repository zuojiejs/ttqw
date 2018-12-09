// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const id = event.id
  const res = await db.collection('viewed_db').where({
    openid
  }).get()
  if (res && res.data && res.data.length > 0) {
    const data = res.data[0]
    const _id = data._id
    const ids = JSON.parse(data.ids)
    if (ids.indexOf(id) > -1) {
      return {
        code: 201,
        msg: 'id is already exist.'
      }
    } else {
      ids.push(id)
       return await db.collection('viewed_db').where({
        openid
      }).update({
        data: {
          openid,
          ids: JSON.stringify(ids)
        }
      })
    }
  } else {
    return await db.collection('viewed_db').add({
     data: {
       openid,
       ids: JSON.stringify([id])
     }
   })
  }
}