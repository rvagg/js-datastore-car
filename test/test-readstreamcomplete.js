/* eslint-env mocha */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import fs from 'fs'
import path from 'path'
import multiformats from 'multiformats/basics'
import { acid, makeData, verifyBlocks, verifyHas, verifyRoots } from './fixture-data.js'
import dagCbor from '@ipld/dag-cbor'
import base58 from 'multiformats/bases/base58'
import Car from 'datastore-car'
import { fileURLToPath } from 'url'

chai.use(chaiAsPromised)
const { assert } = chai

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

multiformats.add(dagCbor)
multiformats.multibase.add(base58)
const { readStreamComplete } = Car(multiformats)

let rawBlocks

describe('Read Stream', () => {
  before(async () => {
    const data = await makeData()
    rawBlocks = data.rawBlocks
  })

  it('read existing', async () => {
    const carDs = await readStreamComplete(fs.createReadStream(path.join(__dirname, 'go.car')))
    await verifyHas(carDs)
    await verifyBlocks(carDs)
    await verifyRoots(carDs)
    await assert.isRejected(carDs.get(rawBlocks[3].cid)) // doesn't exist
    await carDs.close()
  })

  it('verify only roots', async () => {
    // tests deferred open for getRoots()
    const carDs = await readStreamComplete(fs.createReadStream(path.join(__dirname, 'go.car')))
    await verifyRoots(carDs)
    await carDs.close()
  })

  // when we instantiate from a Stream, CarDatastore should be immutable
  it('immutable', async () => {
    const carDs = await readStreamComplete(fs.createReadStream(path.join(__dirname, 'go.car')))
    await assert.isRejected(carDs.put(acid, new TextEncoder().encode('blip')))
    await assert.isRejected(carDs.delete(acid, new TextEncoder().encode('blip')))
    await assert.isRejected(carDs.setRoots(acid))
    await assert.isRejected(carDs.setRoots([acid]))
  })
})
