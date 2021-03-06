/* eslint-env mocha */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import fs from 'fs'
import multiformats from 'multiformats/basics'
import { makeData, verifyBlocks, verifyHas, verifyRoots } from './fixture-data.js'
import { promisify } from 'util'
import dagCbor from '@ipld/dag-cbor'
import base58 from 'multiformats/bases/base58'
import Car from 'datastore-car'

chai.use(chaiAsPromised)
const { assert } = chai

const unlink = promisify(fs.unlink)

multiformats.add(dagCbor)
multiformats.multibase.add(base58)
const { writeStream, readFileComplete } = Car(multiformats)

let rawBlocks
let pbBlocks
let cborBlocks

describe('Read File & Write Stream', () => {
  before(async () => {
    const data = await makeData()
    rawBlocks = data.rawBlocks
    pbBlocks = data.pbBlocks
    cborBlocks = data.cborBlocks

    await unlink('./test.car').catch(() => {})
  })

  it('writeStream', async () => {
    const carDs = await writeStream(fs.createWriteStream('./test.car'))
    await carDs.setRoots([cborBlocks[0].cid, cborBlocks[1].cid])
    for (const block of rawBlocks.slice(0, 3).concat(pbBlocks).concat(cborBlocks)) {
      // add all but raw zzzz
      await carDs.put(block.cid, block.binary)
    }
    await carDs.close()
  })

  it('readFileComplete', async () => {
    const carDs = await readFileComplete('./test.car')
    await verifyHas(carDs)
    await verifyBlocks(carDs)
    await verifyRoots(carDs)
    await carDs.close()
  })

  it('writeStream no await', async () => {
    const roots = [cborBlocks[0].cid, cborBlocks[1].cid]
    const blocks = []
    for (const block of rawBlocks.slice(0, 3).concat(pbBlocks).concat(cborBlocks)) {
      blocks.push([block.cid, block.binary])
    }

    const carDs = await writeStream(fs.createWriteStream('./test.car'))
    carDs.setRoots(roots)
    for (const [cid, encoded] of blocks) {
      carDs.put(cid, encoded)
    }
    await carDs.close()
  })

  it('readFileComplete post no-await write', async () => {
    const carDs = await readFileComplete('./test.car')
    await verifyHas(carDs)
    await verifyBlocks(carDs)
    await verifyRoots(carDs)
    await carDs.close()
  })

  it('writeStream errors', async () => {
    const carDs = await writeStream(fs.createWriteStream('./test.car'))
    await carDs.put(cborBlocks[0].cid, cborBlocks[0].binary)
    await assert.isRejected(carDs.delete(cborBlocks[0].cid))
    await carDs.close()
    await assert.isRejected(carDs.close())
  })

  after(async () => {
    return unlink('./test.car').catch(() => {})
  })
})
