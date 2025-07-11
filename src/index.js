// const logger = require('@varnxy/logger')
// logger.setDirectory('/Users/zhang/Work/WorkSpaces/WebWorkSpace/picgo-plugin-web-uploader/logs')
// let log = logger('plugin')

module.exports = (ctx) => {
  const register = () => {
    ctx.helper.uploader.register('web-uploader', {
      handle,
      name: '自定义api接口上传',
      config: config
    })
  }
  const handle = async function (ctx) {
    let userConfig = ctx.getConfig('picBed.web-uploader')
    if (!userConfig) {
      throw new Error('Can\'t find uploader config')
    }
    const url = userConfig.url
    const paramName = userConfig.paramName
    const jsonPath = userConfig.jsonPath
    const customHeader = userConfig.customHeader
    const customBody = userConfig.customBody
    const prefix = userConfig.prefix
    try {
      let imgList = ctx.output
      for (let i in imgList) {
        let image = imgList[i].buffer
        if (!image && imgList[i].base64Image) {
          image = Buffer.from(imgList[i].base64Image, 'base64')
        }
        const postConfig = postOptions(image, customHeader, customBody, url, paramName, imgList[i].fileName)
        let body = await ctx.Request.request(postConfig)

        delete imgList[i].base64Image
        delete imgList[i].buffer
        if (!jsonPath) {
          imgList[i]['imgUrl'] = body
        } else {
          body = JSON.parse(body)
          let imgUrl = body
          for (let field of jsonPath.split('.')) {
            imgUrl = imgUrl[field]
          }
          if (imgUrl) {
            if (prefix) {
              imgUrl = prefix + imgUrl
            }
            imgList[i]['imgUrl'] = imgUrl
          } else {
            ctx.emit('notification', {
              title: '返回解析失败',
              body: '请检查JsonPath设置'
            })
          }
        }
      }
    } catch (err) {
      ctx.emit('notification', {
        title: '上传失败',
        body: JSON.stringify(err)
      })
    }
  }

  const postOptions = (image, customHeader, customBody, url, paramName, fileName) => {
    let headers = {
      contentType: 'multipart/form-data',
      'User-Agent': 'PicGo'
    }
    if (customHeader) {
      headers = Object.assign(headers, JSON.parse(customHeader))
    }
    let formData = {}
    if (customBody) {
      formData = Object.assign(formData, JSON.parse(customBody))
    }
    const opts = {
      method: 'POST',
      url: url,
      headers: headers,
      formData: formData
    }
    opts.formData[paramName] = {}
    opts.formData[paramName].value = image
    opts.formData[paramName].options = {
      filename: fileName
    }
    return opts
  }

  const config = ctx => {
    let userConfig = ctx.getConfig('picBed.web-uploader')
    if (!userConfig) {
      userConfig = {}
    }
    return [
      {
        name: 'url',
        type: 'input',
        default: userConfig.url,
        required: true,
        message: '例如: https://api.example.com/upload',
        alias: '图床上传API地址'
      },
      {
        name: 'paramName',
        type: 'input',
        default: userConfig.paramName,
        required: true,
        message: '例如: imgName',
        alias: '接口图片参数名'
      },
      {
        name: 'jsonPath',
        type: 'input',
        default: userConfig.jsonPath,
        required: false,
        message: '例如: data.url',
        alias: '返回值取值路径'
      },
      {
        name: 'customHeader',
        type: 'input',
        default: userConfig.customHeader,
        required: false,
        message: '例如: {"token":"xxxxxxxxxx"}',
        alias: '自定义 headers'
      },
      {
        name: 'prefix',
        type: 'input',
        default: userConfig.prefix,
        required: false,
        message: 'jsonPath 字段返回值前缀拼接',
        alias: 'jsonPath 前缀拼接'
      },
      {
        name: 'customBody',
        type: 'input',
        default: userConfig.customBody,
        required: false,
        message: '例如: {"key":"value"}',
        alias: '自定义 Body'
      },
    ]
  }
  return {
    uploader: 'web-uploader',
    // transformer: 'web-uploader',
    // config: config,
    register

  }
}
