import { Stores } from '../../types/stores'
import { MockApi } from '../mockapi'

const users: ({ username: string, password: string } & Stores.user)[] = [
  {
    username: 'bob',
    password: 'bob',
    name: 'dominique',
    age: 18,
    sex: 'male',
    token: 'davidToken'
  }, {
    username: 'lili',
    password: 'lili1',
    name: 'lily',
    age: 16,
    sex: 'female',
    token: 'liliToken'
  },
]

export default <MockApi.obj[]>[
  {
    url: '/login',
    type: 'post',
    response: (options) => {
      const failRes: MockApi.response = {
        code: 200,
        msg: 'Login failed',
        data: null
      }
      if (!options.body) return failRes
      const { username, password } = options.body
      const user = users.find(user => user.username === username)
      if (!user || user.password !== password) return failRes
      return {
        code: 200,
        msg: 'Login successful',
        data: user
      }
    }
  },
  {
    url: '/logout',
    type: 'get',
    response: {
      code: 200,
      msg: 'Logout successful',
      data: 'logout success'
    }
  },
  {
    url: '/info\\?token=.*',
    type: 'get',
    response: (options) => {
      const failRes: MockApi.response = {
        code: 200,
        msg: 'Failed to retrieve user information',
        data: null
      }
      // 获取token
      const { token } = options.params
      if (!token) return failRes
      const user = users.find(user => user.token === token)
      if (!user) return failRes
      return {
        code: 200,
        msg: 'Succeeded in retrieving user information',
        data: user
      }
    }
  }
]