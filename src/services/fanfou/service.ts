import { MsgType, MsgOpenUrl } from '@/background/types'
import { Service } from '../service'
import { OAuth1a, Token } from '../OAuth1a'
import { encodeError } from '@/helpers/error'

export class Fanfou extends Service {
  constructor () {
    super('fanfou')
  }

  readonly maxWordCount = 140

  private oauth = new OAuth1a({
    consumer: {
      key: process.env.VUE_APP_FANFOU_CONSUMER_KEY,
      secret: process.env.VUE_APP_FANFOU_CONSUMER_SECRET
    },
    accessToken: this.token
  })

  async authorize () {
    const requestToken = await this.oauth.obtainRequestToken({
      url: 'http://fanfou.com/oauth/request_token',
      method: 'GET'
    })
    if (!requestToken) {
      throw new Error(encodeError('request_token'))
    }

    await browser.runtime.sendMessage<MsgOpenUrl>({
      type: MsgType.OpenUrl,
      url: `https://fanfou.com/oauth/authorize?oauth_callback=oob&oauth_token=${
        requestToken.key
      }`
    })

    return true
  }

  async obtainAccessToken (code: string) {
    this.token = await this.oauth.obtainAccessToken({
      url: 'http://fanfou.com/oauth/access_token',
      method: 'GET',
      data: { oauth_verifier: code }
    })
    await this.checkAccessToken()
  }

  async checkAccessToken () {
    const json = await this.oauth.send(
      'http://api.fanfou.com/account/verify_credentials.json'
    )

    if (json && json.profile_image_url_large) {
      this.user = {
        id: json.screen_name,
        name: json.name,
        avatar: json.profile_image_url_large
      }

      await this.setStorage()
    }
  }

  async postContent (text: string, img?: string | Blob) {
    const formData = new FormData()
    formData.append('status', text)
    if (img) {
      if (typeof img === 'string') {
        const response = await fetch(img)
        img = await response.blob()
      }
      formData.append('photo', img)
    }
    const json = await this.oauth.send(`http://rest.fanfou.com/statuses/`, {
      method: 'POST',
      body: formData
    })
    if (!json || !json.created_at) {
      return Promise.reject(new Error())
    }
  }
}

export default Fanfou
