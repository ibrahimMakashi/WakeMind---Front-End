package com.wakemind.app.alarm

import android.content.Context
import java.io.File
import java.io.IOException
import org.json.JSONArray
import org.json.JSONObject

internal class SnoozeStore(context: Context) {
  private val file = File(context.filesDir, FILE_NAME)

  fun listAll(): List<SnoozeRecord> =
      synchronized(lock) {
        read().records
      }

  fun listPending(): List<SnoozeRecord> =
      synchronized(lock) {
        read().records.filter { it.isPending }
      }

  fun get(occurrenceId: String): SnoozeRecord? =
      synchronized(lock) {
        listAll().firstOrNull { it.occurrenceId == occurrenceId }
      }

  fun getPendingForAlarm(alarmId: String): SnoozeRecord? =
      synchronized(lock) {
        listPending().firstOrNull { it.alarmId == alarmId }
      }

  fun save(record: SnoozeRecord) {
    synchronized(lock) {
      val current = read().records
      val updated = current.filterNot { it.occurrenceId == record.occurrenceId } + record
      write(updated)
    }
  }

  fun markFired(occurrenceId: String) {
    synchronized(lock) {
      val existing = get(occurrenceId) ?: return
      save(existing.copy(isPending = false))
    }
  }

  /**
   * Atomically validates and consumes a pending snooze record.
   * Returns the valid SnoozeRecord if successful, or null if invalid, already consumed, or mismatched.
   */
  fun consumePending(alarmId: String, occurrenceId: String): SnoozeRecord? =
      synchronized(lock) {
        val record = get(occurrenceId) ?: return null
        if (record.alarmId != alarmId) {
          return null
        }
        if (record.occurrenceId != occurrenceId) {
          return null
        }
        if (!record.isPending) {
          return null
        }
        if (record.snoozeCount != 1) {
          return null
        }
        val consumed = record.copy(isPending = false)
        save(consumed)
        return consumed
      }

  /**
   * Occurrence-specific cleanup: removes only the snooze record for the specified occurrenceId.
   * This is used upon puzzle completion for that specific occurrence.
   */
  fun clear(occurrenceId: String): Boolean {
    synchronized(lock) {
      val current = read().records
      val updated = current.filterNot { it.occurrenceId == occurrenceId }
      val removed = updated.size != current.size
      if (removed) {
        write(updated)
      }
      return removed
    }
  }

  /**
   * Clears all snooze sessions belonging to an alarm.
   * Reserved strictly for when the user deletes the entire alarm.
   */
  fun clearForAlarm(alarmId: String): Boolean {
    synchronized(lock) {
      val current = read().records
      val updated = current.filterNot { it.alarmId == alarmId }
      val removed = updated.size != current.size
      if (removed) {
        write(updated)
      }
      return removed
    }
  }

  private fun read(): SnoozeFile {
    if (!file.exists()) {
      return SnoozeFile(emptyList())
    }
    val text = file.readText()
    if (text.isBlank()) {
      return SnoozeFile(emptyList())
    }
    val json = JSONObject(text)
    val version = json.optInt("version", -1)
    if (version != STORE_VERSION) {
      throw IllegalStateException("Unsupported snooze store version $version.")
    }
    val array = json.optJSONArray("records") ?: JSONArray()
    val records = ArrayList<SnoozeRecord>(array.length())
    for (index in 0 until array.length()) {
      records.add(SnoozeRecord.fromJson(array.getJSONObject(index)))
    }
    return SnoozeFile(records)
  }

  private fun write(records: List<SnoozeRecord>) {
    val array = JSONArray()
    records.forEach { record -> array.put(record.toJson()) }
    val json = JSONObject()
    json.put("version", STORE_VERSION)
    json.put("records", array)
    val directory = file.parentFile ?: throw IOException("Snooze store directory is missing.")
    val temporary = File(directory, "$FILE_NAME.tmp")
    temporary.writeText(json.toString())
    if (file.exists() && !file.delete()) {
      throw IOException("Could not replace the snooze store.")
    }
    if (!temporary.renameTo(file)) {
      temporary.copyTo(file, overwrite = true)
      temporary.delete()
    }
  }

  private data class SnoozeFile(val records: List<SnoozeRecord>)

  companion object {
    private const val FILE_NAME = "snooze_sessions.json"
    private const val STORE_VERSION = 1
    private val lock = Any()
  }
}
