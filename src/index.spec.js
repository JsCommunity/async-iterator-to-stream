/* eslint-env jest */

const asyncIteratorToStream = require("./");

const getChunks = stream =>
  new Promise(resolve => {
    const chunks = [];
    stream.on("data", chunk => {
      chunks.push(chunk);
    });
    stream.on("end", () => {
      resolve(chunks);
    });
  });

const makeIterator = (data, asynchronous = false) => {
  let i = 0;
  return {
    next() {
      const cursor =
        i < data.length ? { done: false, value: data[i++] } : { done: true };
      return asynchronous ? Promise.resolve(cursor) : cursor;
    },
  };
};

describe("asyncIteratorToStream", () => {
  it("works with sync iterators", async () => {
    const data = [1, 2, 3];
    const stream = asyncIteratorToStream.obj(makeIterator(data));
    expect(await getChunks(stream)).toEqual(data);
  });
  it("works with sync iterables", async () => {
    const data = [1, 2, 3];
    const stream = asyncIteratorToStream.obj({
      [asyncIteratorToStream.$$iterator]: () => makeIterator(data),
    });
    expect(await getChunks(stream)).toEqual(data);
  });
  it("works with async iterators", async () => {
    const data = [1, 2, 3];
    const stream = asyncIteratorToStream.obj(makeIterator(data, true));
    expect(await getChunks(stream)).toEqual(data);
  });
  it("works with async iterables", async () => {
    const data = [1, 2, 3];
    const stream = asyncIteratorToStream.obj({
      [asyncIteratorToStream.$$asyncIterator]: () => makeIterator(data, true),
    });
    expect(await getChunks(stream)).toEqual(data);
  });
  describe("with generators", () => {
    it("sync", async () => {
      const expectedThis = {};
      const expectedArgs = ["foo", "bar"];
      const stream = asyncIteratorToStream
        .obj(function*(...args) {
          // this is forwarded
          expect(this).toBe(expectedThis);

          // args are forwarded
          expect(args).toEqual(expectedArgs);

          // can yield undefined to ask for the requested size
          expect(typeof (yield undefined)).toBe("number");

          // can yield a value
          yield 1;

          // can yield a promise to wait for its resolution
          expect(yield Promise.resolve("foo")).toBe("foo");
          try {
            yield Promise.reject(new Error("bar"));
            expect(false).toBe(true);
          } catch (error) {
            expect(error.message).toBe("bar");
          }

          yield 2;
        })
        .apply(expectedThis, expectedArgs);

      expect(await getChunks(stream)).toEqual([1, 2]);
    });
    it("async", async () => {
      const expectedThis = {};
      const expectedArgs = ["foo", "bar"];
      const stream = asyncIteratorToStream
        .obj(async function*(...args) {
          // this is forwarded
          expect(this).toBe(expectedThis);

          // args are forwarded
          expect(args).toEqual(expectedArgs);

          // can yield undefined to ask for the requested size
          expect(typeof (yield undefined)).toBe("number");

          // can yield a value
          yield 1;

          // promises are correctly handled
          expect(await Promise.resolve("foo")).toBe("foo");
          try {
            yield Promise.reject(new Error("bar"));
            expect(false).toBe(true);
          } catch (error) {
            expect(error.message).toBe("bar");
          }

          yield 2;
        })
        .apply(expectedThis, expectedArgs);

      expect(await getChunks(stream)).toEqual([1, 2]);
    });
  });
});
