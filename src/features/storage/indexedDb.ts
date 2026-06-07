import { openDB, type IDBPDatabase } from 'idb'
import type { PlaylistRecord } from '../playlist/playlistTypes'

const DB_NAME = 'iptv-player'
const DB_VERSION = 1

interface IptvDbSchema {
  playlists: {
    key: string
    value: PlaylistRecord
    indexes: {
      'by-date': number
    }
  }
  favorites: {
    key: string
    value: { id: string; channelIds: string[] }
  }
  recent: {
    key: string
    value: { id: string; channelIds: string[]; updatedAt: number }
  }
}

let dbPromise: Promise<IDBPDatabase<IptvDbSchema>> | null = null

function getDb(): Promise<IDBPDatabase<IptvDbSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<IptvDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('playlists')) {
          const store = db.createObjectStore('playlists', { keyPath: 'id' })
          store.createIndex('by-date', 'importedAt')
        }
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('recent')) {
          db.createObjectStore('recent', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function savePlaylist(record: PlaylistRecord): Promise<void> {
  const db = await getDb()
  await db.put('playlists', record)
}

export async function getLastPlaylist(): Promise<PlaylistRecord | undefined> {
  const db = await getDb()
  const index = db.transaction('playlists').store.index('by-date')
  const cursor = await index.openCursor(null, 'prev')
  return cursor?.value
}

export async function getAllPlaylists(): Promise<PlaylistRecord[]> {
  const db = await getDb()
  return db.getAll('playlists')
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('playlists', id)
}

export async function saveFavorites(channelIds: string[]): Promise<void> {
  const db = await getDb()
  await db.put('favorites', { id: 'main', channelIds })
}

export async function loadFavorites(): Promise<string[]> {
  const db = await getDb()
  const record = await db.get('favorites', 'main')
  return record?.channelIds ?? []
}

export async function saveRecent(channelIds: string[]): Promise<void> {
  const db = await getDb()
  await db.put('recent', { id: 'main', channelIds, updatedAt: Date.now() })
}

export async function loadRecent(): Promise<string[]> {
  const db = await getDb()
  const record = await db.get('recent', 'main')
  return record?.channelIds ?? []
}
