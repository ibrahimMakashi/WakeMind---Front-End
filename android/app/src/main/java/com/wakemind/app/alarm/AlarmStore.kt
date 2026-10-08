package com.wakemind.app.alarm

import android.content.Context
import android.util.Log
import java.io.File
import java.io.IOException
import org.json.JSONArray
import org.json.JSONObject

internal class AlarmStore(context: Context) {
  private val file = File(context.filesDir, FILE_NAME)

  fun list(): List<StoredAlarm> {
    return synchronized(lock) { read().alarms }
  }

  fun get(id: String): StoredAlarm? {
    return list().firstOrNull { alarm -> alarm.id == id }
  }

  fun upsert(alarm: StoredAlarm) {
    synchronized(lock) {
      val current = read()
      val updated = current.alarms.filterNot { existing -> existing.id == alarm.id } + alarm
      write(updated.sortedBy { item -> item.triggerAtMillis })
    }
  }

  fun delete(id: String): Boolean {
    return synchronized(lock) {
      val current = read()
      val updated = current.alarms.filterNot { alarm -> alarm.id == id }
      val removed = updated.size != current.alarms.size
      if (removed) {
        write(updated)
      }
      removed
    }
  }

  fun markFired(id: String) {
    val alarm = get(id) ?: return
    upsert(alarm.copy(enabled = false))
  }

  private fun read(): AlarmFile {
    if (!file.exists()) {
      return AlarmFile(emptyList())
    }
    val text = file.readText()
    if (text.isBlank()) {
      return AlarmFile(emptyList())
    }
    val json = JSONObject(text)
    val version = json.optInt("version", -1)
    if (version != STORE_VERSION) {
      throw IllegalStateException("Unsupported alarm store version $version.")
    }
    val array = json.optJSONArray("alarms") ?: JSONArray()
    val alarms = ArrayList<StoredAlarm>(array.length())
    for (index in 0 until array.length()) {
      alarms.add(StoredAlarm.fromJson(array.getJSONObject(index)))
    }
    return AlarmFile(alarms)
  }

  private fun write(alarms: List<StoredAlarm>) {
    val array = JSONArray()
    alarms.forEach { alarm -> array.put(alarm.toJson()) }
    val json = JSONObject().put("version", STORE_VERSION).put("alarms", array)
    val directory = file.parentFile ?: throw IOException("Alarm store directory is missing.")
    val temporary = File(directory, "$FILE_NAME.tmp")
    temporary.writeText(json.toString())
    if (file.exists() && !file.delete()) {
      throw IOException("Could not replace the alarm store.")
    }
    if (!temporary.renameTo(file)) {
      temporary.copyTo(file, overwrite = true)
      if (!temporary.delete()) {
        Log.w(ALARM_LOG_TAG, "Temporary alarm store file was left behind.")
      }
    }
  }

  private data class AlarmFile(val alarms: List<StoredAlarm>)

  companion object {
    private val lock = Any()
    private const val FILE_NAME = "wakemind-alarms.json"
    private const val STORE_VERSION = 1
  }
}
