const { NoWriter } = require('./lib/reader-writer-iface')
const { createBufferReader } = require('./lib/reader-browser')
const CarDatastore = require('./datastore')

/**
 * @name CarDatastore.readBuffer
 * @description
 * Read a CarDatastore from a Buffer containing the contents of an existing
 * CAR archive. Mutation operations (`put()`, `delete()` and `setRoots()`) are
 * not available.
 *
 * Because the entire CAR archive is represented in memory after being parsed,
 * this read-mode is not suitable for large data sets. `readStreaming()` should
 * be used instead for a streaming read supporting only `query()` for an
 * iterative decode.
 *
 * However, this create-mode is currently the only mode supported in a browser
 * environment.
 * @function
 * @memberof CarDatastore
 * @static
 * @async
 * @param {Buffer|Uint8Array} buffer the byte contents of a CAR archive
 * @returns {CarDatastore} a read-only CarDatastore.
 */
async function readBuffer (multiformats, buffer) {
  const reader = await createBufferReader(multiformats, buffer)
  const writer = new NoWriter()
  return new CarDatastore(multiformats, reader, writer)
}

module.exports = (multiformats) => {
  function wrap (fn) {
    return function (...args) {
      return fn(multiformats, ...args)
    }
  }

  return {
    readBuffer: wrap(readBuffer)
  }
}
module.exports.readBuffer = readBuffer
