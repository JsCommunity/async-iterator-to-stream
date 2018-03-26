/* eslint-env jest */

const asyncIteratorToStream = require('./')

const getChunks = stream => new Promise(resolve => {
  const chunks = []
  stream.on('data', chunk => {
    chunks.push(chunk)
  })
  stream.on('end', () => {
    resolve(chunks)
  })
})

const makeIterator = (data, asynchronous = false) => {
  let i = 0
  return {
    next () {
      const cursor = i < data.length
        ? { done: false, value: data[i++] }
        : { done: true }
      return asynchronous ? Promise.resolve(cursor) : cursor
    },
  }
}

describe('asyncIteratorToStream', () => {
  it('works with sync iterators', async () => {
    const data = [1, 2, 3]
    const stream = asyncIteratorToStream.obj(makeIterator(data))
    expect(await getChunks(stream)).toEqual(data)
  })
  it('works with sync iterables', async () => {
    const data = [1, 2, 3]
    const stream = asyncIteratorToStream.obj({
      [asyncIteratorToStream.$$iterator]: () => makeIterator(data)
    })
    expect(await getChunks(stream)).toEqual(data)
  })
  it('works with async iterators', async () => {
    const data = [1, 2, 3]
    const stream = asyncIteratorToStream.obj(makeIterator(data, true))
    expect(await getChunks(stream)).toEqual(data)
  })
  it('works with async iterables', async () => {
    const data = [1, 2, 3]
    const stream = asyncIteratorToStream.obj({
      [asyncIteratorToStream.$$asyncIterator]: () => makeIterator(data, true)
    })
    expect(await getChunks(stream)).toEqual(data)
  })
})
