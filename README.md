# async-iterator-to-stream

[![Package Version](https://badgen.net/npm/v/async-iterator-to-stream)](https://npmjs.org/package/async-iterator-to-stream) [![Build Status](https://travis-ci.org/JsCommunity/async-iterator-to-stream.png?branch=master)](https://travis-ci.org/JsCommunity/async-iterator-to-stream) [![PackagePhobia](https://badgen.net/packagephobia/install/async-iterator-to-stream)](https://packagephobia.now.sh/result?p=async-iterator-to-stream) [![Latest Commit](https://badgen.net/github/last-commit/JsCommunity/async-iterator-to-stream)](https://github.com/JsCommunity/async-iterator-to-stream/commits/master)

> Convert an async iterator/iterable to a readable stream

Even though this library is dedicated to async iterators, it is fully
compatible with synchronous ones.

Furthermore, generators can be used to create readable stream factories!

## Install

Installation of the [npm package](https://npmjs.org/package/async-iterator-to-stream):

```
> npm install --save async-iterator-to-stream
```

## Usage

```js
const asyncIteratorToStream = require("async-iterator-to-stream");

// sync/async iterators
asyncIteratorToStream(new Set(["foo", "bar"]).values()).pipe(output);

// sync/async iterables
asyncIteratorToStream.obj([1, 2, 3]).pipe(output);

// if you pass a sync/async generator, it will return a factory instead of a
// stream
const createRangeStream = asyncIteratorToStream.obj(function*(n) {
  for (let i = 0; i < n; ++i) {
    yield i;
  }
});
createRangeStream(10).pipe(output);
```

## Example

Let's implement a simpler `fs.createReadStream` to illustrate the usage of this
library.

```js
const asyncIteratorToStream = require("async-iterator-to-stream");

// promisified fs
const fs = require("mz/fs");

const createReadStream = asyncIteratorToStream(async function*(file) {
  const fd = await fs.open(file, "r");
  try {
    let size = yield;
    while (true) {
      const buf = Buffer.alloc(size);
      const [n] = await fs.read(fd, buf, 0, size, null);
      if (n < size) {
        yield buf.slice(0, n);
        return;
      }
      size = yield buf;
    }
  } finally {
    await fs.close(fd);
  }
});

createReadStream("foo.txt").pipe(process.stdout);
```

> If your environment does not support async generators, you may use a sync
> generator instead and `yield` promises to wait for them.

## Development

```
# Install dependencies
> npm

# Run the tests
> npm test

# Continuously compile
> npm run dev

# Continuously run the tests
> npm run dev-test

# Build for production
> npm run build
```

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/JsCommunity/async-iterator-to-stream/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Julien Fontanet](https://github.com/julien-f)
