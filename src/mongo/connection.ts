import { MongoClient, type Db } from 'mongodb'
import { env } from '../../env.ts'

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

export const getMongoClient = async () => {
  if (client) {
    return client
  }

  if (!clientPromise) {
    const nextClient = new MongoClient(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    })

    clientPromise = nextClient
      .connect()
      .then((connectedClient) => {
        client = connectedClient
        return connectedClient
      })
      .catch((error) => {
        clientPromise = null
        throw error
      })
  }

  return clientPromise
}

export const getMongoDb = async (): Promise<Db> => {
  const connectedClient = await getMongoClient()

  return connectedClient.db(env.MONGODB_DB_NAME)
}

export const closeMongoConnection = async () => {
  if (!client) {
    return
  }

  await client.close()
  client = null
  clientPromise = null
}
