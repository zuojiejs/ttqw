// pages/index/index.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
			list: [],
			reportIds: [],
			index: 0,
			share: {
				show: false,
				num: 3,
				text: '天天奇闻，每天带你看奇闻'
			}
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
			wx.showLoading({
				title: '加载中',
			})
			this.loadShareConfig()
			const { id } = options
			this.initData(id)
		},

		// 拉取分享配置
		loadShareConfig: function () {
			let data
			const currTime = this.getCurrTime()
			const requestShare = () => {
				wx.cloud.callFunction({
					name: 'getConfig',
					data: {},
					success: res => {
						if (res && res.result && res.result.share) {
							this.setData({
								share: res.result.share
							})
							wx.setStorage({
								key: "ttqw_cache_share",
								data: JSON.stringify({
									time: currTime,
									share: res.result.share
								})
							})
						}
					}
				})
			}
			try {
				data = wx.getStorageSync('ttqw_cache_share')
			} catch (e) {
				
			}	
			if (data) {
				data = JSON.parse(data)
				let share = data.share
				const cacheTime = data.time
				if (cacheTime === currTime) {
					this.setData({
						share
					})
				} else {
					requestShare()
				}
			} else {
				requestShare()
			}
		},

		// 初始化数据
		initData: function (shareId) {
			let data
			// 取缓存数据
			try {
				data = wx.getStorageSync('ttqw_cache_list')
			} catch (e) {
				
			}					
			// 加载缓存失败或者无缓存，清掉缓存并拉数据
			if (!data) {
				this.clearCache()
				this.getList({
					shareId
				})
				return
			}

			data = JSON.parse(data)
			let list = data.list
			const currTime = this.getCurrTime()
			const cacheTime = data.time
			// 不是当天缓存，缓存过期，清掉缓存并拉数据
			if (currTime !== cacheTime) {
				this.clearCache()
				this.getList({
					shareId
				})
				return
			}
			const reportIds = []
			for (let i = 0; i < list.length; i++) {
				reportIds.push(list[i]._id)
			}
			// 页面带有分享id
			if (shareId) {
				let cacheIndex = -1
				for (let i = 0; i < list.length; i++) {
					if (list[i]._id === shareId) {
						cacheIndex = i
						break
					}
				}
				// 分享数据已在缓存中，直接展示
				if (cacheIndex !== -1) {
					wx.hideLoading()
					const cacheData = list[cacheIndex]
					list.splice(cacheIndex, 1)
					list.unshift(cacheData)
					this.setData({
						list,
						reportIds
					})
					return
				}

				// 不在缓存中，拉取分享数据再展示
				const handleLoadShareData = (res) => {
					if (res && res.result && res.result.list) {
						list = res.result.list.concat(list)
						this.setData({
							list,
							reportIds
						}, this.reportViewId)
						this.setCache(list)
					} else {
						this.handleLoadError({ shareId }, handleLoadShareData)
					}
				}
				this.getList({
					shareId
				}, handleLoadShareData)
			} else {
				wx.hideLoading()
				this.setData({
					list,
					reportIds
				})
			}
		},
		
		// 拉取数据
		getList: function (data, cb) {
			wx.cloud.callFunction({
				name: 'getList',
				data,
				success: res => {
					wx.hideLoading()
					if (cb) {
						return cb(res)
					}

					if (res && res.result && res.result.list) {
						if (res.result.list.length === 0 && this.data.list.length === 0 && !data.num) {
							wx.showModal({
								title: "提示",
								content: "小编正在加急搜索奇闻，明日再来吧",
								confirmText: "确定",
								showCancel: false
							})
							return
						}
						const list = this.data.list.concat(res.result.list)
						this.setData({
							list
						}, this.reportViewId)
						this.setCache(list)
						// 分享新增奇闻case，提示新增数目
						if (data.num && res.result.list.length > 0 && this.data.share.show) {
							wx.showToast({
								title: `已为你新增${res.result.list.length}条奇闻`,
								icon: 'success',
								duration: 2000
							})
						}
					} else {
						this.handleLoadError(data, cb)
					}
				},
				fail: err => {
					wx.hideLoading()
					this.handleLoadError(data, cb)
				}
			})
		},

		// 处理拉取失败
		handleLoadError: function (data, cb) {
			wx.showModal({
				title: "提示",
				content: "数据拉取失败，是否重试？",
				confirmText: "重试",
				success: res => {
					if (res.confirm) {
						this.getList(data, cb)
					}
				}
			})
		},

		// 前翻
		viewPre: function () {
			if (this.data.list.length === 0) return

			if (this.data.index === 0) {
				wx.showModal({
					title: "提示",
					content: "已经是第一条了",
					showCancel: false
				})
				return
			}
			this.setData({
				index: this.data.index - 1
			}, this.reportViewId)
		},

		// 后翻
		viewNext: function () {
			if (this.data.list.length === 0) return

			if (this.data.index + 1 === this.data.list.length) {
				if (this.data.share.show) {
					wx.showModal({
						title: "提示",
						content: this.data.share.tips,
						showCancel: false
					})
				} else {
					wx.showModal({
						title: "提示",
						content: "已经是最后一条了",
						showCancel: false
					})
				}
				return
			}
			this.setData({
				index: this.data.index + 1
			}, this.reportViewId)
		},

		// 上报查看的奇闻
		reportViewId: function () {
			if (!this.data.list[this.data.index]) return

			const id = this.data.list[this.data.index]._id
			if (this.data.reportIds.indexOf(id) > -1) return
			// 上报
			wx.cloud.callFunction({
				name: 'reportId',
				data: {
					id
				},
				success: res => {
					const reportIds = this.data.reportIds.concat(id)
					this.setData({
						reportIds
					})
				}
			})
		},

		// 缓存数据
		setCache: function (list) {
			if (list.length === 0) return
			const time = this.getCurrTime()
			wx.setStorage({
				key: "ttqw_cache_list",
				data: JSON.stringify({
					time,
					list
				})
			})
		},

		clearCache: function () {
			wx.removeStorageSync('ttqw_cache_list')
		},

		// 获取当天日期0点时间戳
		getCurrTime: function () {
			const year = new Date().getFullYear()
			const month = new Date().getMonth()
			const day = new Date().getDate()
			return new Date(`${year}/${month}/${day}`).getTime()
		},

		previewImage: function (e) {
			const current = e.currentTarget.dataset['image']
			const urls = []
			const currItem = this.data.list[this.data.index]
			for (let i = 0; i < currItem.data.length; i++) {
				if (currItem.data[i].image) {
					urls.push(currItem.data[i].image)
				}
			}
			wx.previewImage({
				current,
				urls
			})
		},

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function (e) {
			// 分享则新拉数据
			setTimeout(() => {
				const viewedIds = []
				for (let i = 0; i < this.data.list.length; i++) {
					viewedIds.push(this.data.list[i]._id)
				}
				this.getList({ num: this.data.share.num, viewedIds })
			}, 3000)

			if (this.data.list.lengthm > 0) {
				const currItem = this.data.list[this.data.index]
				return {
					title: this.data.share.text,
          path: 'pages/index/index?id=' + currItem._id
				}
			} else {
				return {
					title: this.data.share.text
				}
			}
    }
})