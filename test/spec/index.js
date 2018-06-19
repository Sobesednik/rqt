import { ok, assert, equal, deepEqual, throws } from 'zoroaster/assert'
import rqt from '../../src'
import Context from '../context'
import { version } from '../../package.json'

/** @type {Object.<string, (c: Context)>} */
const T = {
  context: Context,
  async 'should be a function'() {
    equal(typeof rqt, 'function')
  },
  async 'requests data from server' ({ setData, getParams, url }) {
    const data = 'test-data'
    setData(data)
    const res = await rqt(url)
    const { called } = getParams()
    ok(called)
    equal(res, data)
  },
  async 'fails when ENOTFOUND'() {
    const url = `http://not-a-valid-web-page-${Math.floor(Math.random() * 10000)}.io`
    await throws({
      fn: rqt,
      args: [url],
      code: 'ENOTFOUND',
    })
  },
  async 'requests data from https'() {
    const url = 'https://google.com'
    const res = await rqt(url)
    assert(/The document has moved/.test(res))
  },
  async 'sends post data'({ getParams, url }) {
    const data = 'test post data'
    const res = await rqt(url, {
      data,
      contentType: 'application/x-www-form-urlencoded',
    })
    const { called } = getParams()
    ok(called)
    equal(res, data)
  },
  async 'parses json data'({ url, getParams }) {
    const d = { data: 'test post data' }
    const data = JSON.stringify(d)
    const res = await rqt(url, {
      data,
    })
    const { called } = getParams()
    ok(called)
    deepEqual(res, d)
  },
  async 'rejects when cannot parse json data'({ url }) {
    const data = 'not-json-data'
    // await throws({
    //   fn: rqt,
    //   args: [url, { data }],
    // })
    try {
      await rqt(url, {
        data,
      })
      throw new Error('Should have thrown an error')
    } catch ({ postData, message, stack }) {
      assert.equal(postData, data)
      assert(/Unexpected token o/.test(message))
      assert(/ at rejects when cannot parse json data/.test(stack))
    }
  },
  async 'sends headers'({ url, getParams }) {
    const testHeader = 'test post header'
    await rqt(url, {
      data: 'test',
      contentType: 'application/x-www-form-urlencoded',
      headers: {
        'x-test': testHeader,
      },
    })
    const { headers } = getParams()
    equal(headers['x-test'], testHeader)
  },
  async 'sends user-agent'({ url, getParams }) {
    const expected = `Mozilla/5.0 (Node.js) rqt/${version}`
    await rqt(url, {
      data: 'test',
      contentType: 'application/x-www-form-urlencoded',
    })
    const { headers } = getParams()
    equal(headers['user-agent'], expected)
  },
  async 'requests github data'() {
    const res = await rqt('https://api.github.com/users/octocat/orgs')
    equal(res, '[]')
  },
  async 'returns binary data'({ url, setData }) {
    const d = 'test buffer'
    setData(d)
    const expected = new Buffer(d)
    const res = await rqt(url, {
      binary: true,
    })
    assert(res instanceof Buffer)
    deepEqual(res, expected)
  },
}

export default T
