const { uploadFile } = require('./request')

/**
 * 批量上传本地临时文件到服务器 /api/upload
 * @param {string[]} tempPaths
 * @returns {Promise<string[]>} 服务器返回的相对 URL 数组，如 ['/uploads/xxx.jpg']
 */
async function uploadImages(tempPaths) {
  if (!tempPaths || tempPaths.length === 0) return []
  const urls = []
  for (const p of tempPaths) {
    if (!p) continue
    if (p.startsWith('http') || p.startsWith('/uploads')) {
      urls.push(p)
      continue
    }
    try {
      const res = await uploadFile('/upload', p)
      if (res && res.code === 200 && res.data && res.data.url) {
        urls.push(res.data.url)
      }
    } catch (e) {
      // 单张上传失败不阻塞其他
    }
  }
  return urls
}

module.exports = { uploadImages }
