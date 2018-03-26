const { Readable } = require('readable-stream')

// return the next value of the iterator but if it is a promise, resolve it and
// reinject it
//
// this enables the use of a simple generator instead of an async generator
// (which are less widely supported)
const next = async (iterator, arg) => {
  let cursor = iterator.next(arg)
  if (typeof cursor.then === 'function') {
    return cursor
  }
  let value
  while (
    !cursor.done &&
    (value = cursor.value) != null &&
    typeof value.then === 'function'
  ) {
    let success = false
    try {
      value = await value
      success = true
    } catch (error) {
      cursor = iterator.throw(error)
    }
    if (success) {
      cursor = iterator.next(value)
    }
  }
  return cursor
}

const getSymbol =
  typeof Symbol === 'function'
    ? name => {
      const symbol = Symbol[name]
      return symbol !== undefined ? symbol : `@@${name}`
    }
    : name => `@@${name}`

const $$asyncIterator = getSymbol('asyncIterator')
const $$iterator = getSymbol('iterator')

const resolveToIterator = value => {
  let tmp
  if (typeof (tmp = value[$$asyncIterator]) === 'function') {
    return tmp.call(value)() // async iterable
  }
  if (typeof (tmp = value[$$iterator]) === 'function') {
    return tmp.call(value) // iterable
  }
  return value // iterator
}

// Create a readable stream from a sync/async iterator
//
// If a generator is passed instead of an iterator, a factory is returned
// instead of a plain readable stream.
//
// The generator can be async or can yield promises to wait for them.
//
// `yield` returns the `size` parameter of the next method, the generator can
// ask for it without generating a value by yielding `undefined`.
function asyncIteratorToStream (iterable, options) {
  if (typeof iterable === 'function') {
    return function () {
      return asyncIteratorToStream(iterable.apply(this, arguments), options)
    }
  }

  const iterator = resolveToIterator(iterable)
  const readable = options instanceof Readable ? options : new Readable(options)
  readable._destroy = async (error, cb) => {
    if (error != null) {
      if ('throw' in iterator) {
        try {
          await iterator.throw(error)
        } catch (error) {
          return cb(error)
        }
      }
    } else if ('return' in iterator) {
      try {
        await iterator.return()
      } catch (error) {
        cb(error)
      }
    }
    cb(error)
  }
  readable._read = size => {
    let running = false
    const read = (readable._read = async size => {
      if (running) {
        return
      }
      running = true
      try {
        let canPush = true
        do {
          const cursor = await next(iterator, size)
          if (cursor.done) {
            return readable.push(null)
          }
          const value = cursor.value
          if (value !== undefined) {
            canPush = readable.push(value)
          }
        } while (canPush)
      } catch (error) {
        readable.emit('error', error)
      } finally {
        running = false
      }
    })
    return read(size)
  }
  return readable
}
module.exports = asyncIteratorToStream

asyncIteratorToStream.obj = (iterable, options) => asyncIteratorToStream(iterable, {
  objectMode: true,
  ...options,
})
