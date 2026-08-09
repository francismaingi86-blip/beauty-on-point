import type { Table } from 'dexie'

interface Syncable {
  id: string
  synced: boolean
}

/**
 * Like Dexie's bulkPut, but skips any row whose local copy still has
 * unsynced (pending) changes. Without this, pulling fresh data from the
 * server after reconnecting could silently overwrite an edit made while
 * offline, right before it had a chance to push — the local edit would
 * just vanish with no warning. The pending edit will still sync out and
 * then get correctly picked up on the next refresh.
 */
export async function safeBulkPut<T extends Syncable>(table: Table<T, string>, serverRows: T[]): Promise<void> {
  const localRows = await table.bulkGet(serverRows.map((r) => r.id))
  const toWrite: T[] = []

  serverRows.forEach((serverRow, i) => {
    const local = localRows[i]
    if (local && !local.synced) {
      // Local has a pending change we haven't pushed yet — don't clobber it.
      return
    }
    toWrite.push(serverRow)
  })

  if (toWrite.length > 0) {
    await table.bulkPut(toWrite)
  }
}
