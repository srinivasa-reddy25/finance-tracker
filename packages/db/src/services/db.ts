import 'colors'

import mongoose from 'mongoose'

import { env } from '../constants/env'

export const connect_db = async (): Promise<void> => {
  try {
    if (!env.db_url || env.db_url === 'NA') {
      console.error('No database URL provided, skipping connection'.yellow)
      return
    }

    await mongoose.connect(env.db_url)
    const db_name = mongoose.connection.name
    console.log(`Database [${db_name}] connected successfully`.cyan)
  } catch (error) {
    console.error('database connection error:', error)
    throw error
  }
}

export const disconnect_db = async (): Promise<void> => {
  try {
    await mongoose.disconnect()
    console.log('Database disconnected successfully'.cyan)
  } catch (error) {
    console.error('Database disconnection error:', error)
    throw error
  }
}

export const get_db_status = (): string => {
  const state = mongoose.connection.readyState

  const status_map = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  }

  return status_map[state] || 'unknown'
}
