import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let mongo_server: MongoMemoryServer

export const connect_test_db = async () => {
  mongo_server = await MongoMemoryServer.create()
  const uri = mongo_server.getUri()
  await mongoose.connect(uri)
}

export const disconnect_test_db = async () => {
  await mongoose.disconnect()
  await mongo_server.stop()
}

export const clear_test_db = async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key]?.deleteMany({})
  }
}
