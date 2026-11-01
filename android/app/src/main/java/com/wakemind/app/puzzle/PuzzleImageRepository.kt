package com.wakemind.app.puzzle

import android.content.Context
import android.net.Uri
import android.util.Log
import java.io.File
import org.json.JSONArray
import org.json.JSONObject

internal data class PuzzleImageRecord(
    val id: String,
    val type: String, // "bundled" | "custom"
    val title: String,
    val uri: String = "",
    val lastUsedAt: Long = System.currentTimeMillis(),
) {
  fun toJson(): JSONObject {
    return JSONObject()
        .put("id", id)
        .put("type", type)
        .put("title", title)
        .put("uri", uri)
        .put("lastUsedAt", lastUsedAt)
  }

  companion object {
    fun fromJson(json: JSONObject): PuzzleImageRecord {
      return PuzzleImageRecord(
          id = json.optString("id", ""),
          type = json.optString("type", "bundled"),
          title = json.optString("title", "Custom Photo"),
          uri = json.optString("uri", ""),
          lastUsedAt = json.optLong("lastUsedAt", 0L),
      )
    }
  }
}

internal object PuzzleImageRepository {
  private const val TAG = "PuzzleImageRepo"
  private const val PREFS_NAME = "puzzle_image_prefs"
  private const val KEY_RECENT_IMAGES = "recent_images_json"
  private const val KEY_REGISTERED_CUSTOM = "registered_custom_images_json"
  private const val MAX_RECENTS = 16
  private val lock = Any()

  fun recordRecent(context: Context, record: PuzzleImageRecord) {
    if (record.id.isBlank()) return
    synchronized(lock) {
      try {
        val recents = getRecentImagesInternal(context).toMutableList()
        recents.removeAll { it.id == record.id }
        recents.add(0, record.copy(lastUsedAt = System.currentTimeMillis()))
        val trimmed = recents.take(MAX_RECENTS)
        saveRecentImagesInternal(context, trimmed)
      } catch (e: Exception) {
        Log.e(TAG, "Failed to record recent image ${record.id}", e)
      }
    }
  }

  fun getRecentImages(context: Context): List<PuzzleImageRecord> {
    synchronized(lock) {
      return getRecentImagesInternal(context).filter { record ->
        if (record.type == "custom") {
          isCustomFileValid(record.uri)
        } else {
          true
        }
      }
    }
  }

  fun registerCustomImage(context: Context, record: PuzzleImageRecord) {
    if (record.id.isBlank()) return
    synchronized(lock) {
      try {
        val registered = getRegisteredCustomInternal(context).toMutableList()
        registered.removeAll { it.id == record.id }
        registered.add(0, record)
        saveRegisteredCustomInternal(context, registered)
        recordRecent(context, record)
      } catch (e: Exception) {
        Log.e(TAG, "Failed to register custom image ${record.id}", e)
      }
    }
  }

  fun getCustomImageById(context: Context, id: String): PuzzleImageRecord? {
    if (id.isBlank()) return null
    synchronized(lock) {
      val registered = getRegisteredCustomInternal(context)
      val found = registered.firstOrNull { it.id == id }
      if (found != null && isCustomFileValid(found.uri)) {
        return found
      }
      val recent = getRecentImagesInternal(context).firstOrNull { it.id == id && it.type == "custom" }
      if (recent != null && isCustomFileValid(recent.uri)) {
        return recent
      }
      return null
    }
  }

  private fun isCustomFileValid(uriString: String): Boolean {
    if (uriString.isBlank()) return false
    val parsed = Uri.parse(uriString)
    val path = if (parsed.scheme == "file") parsed.path else uriString
    return path != null && File(path).exists()
  }

  private fun getRecentImagesInternal(context: Context): List<PuzzleImageRecord> {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val jsonString = prefs.getString(KEY_RECENT_IMAGES, null) ?: return emptyList()
    return try {
      val array = JSONArray(jsonString)
      val list = ArrayList<PuzzleImageRecord>(array.length())
      for (i in 0 until array.length()) {
        val obj = array.getJSONObject(i)
        list.add(PuzzleImageRecord.fromJson(obj))
      }
      list
    } catch (_: Exception) {
      emptyList()
    }
  }

  private fun saveRecentImagesInternal(context: Context, list: List<PuzzleImageRecord>) {
    val array = JSONArray()
    list.forEach { array.put(it.toJson()) }
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    prefs.edit().putString(KEY_RECENT_IMAGES, array.toString()).apply()
  }

  private fun getRegisteredCustomInternal(context: Context): List<PuzzleImageRecord> {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val jsonString = prefs.getString(KEY_REGISTERED_CUSTOM, null) ?: return emptyList()
    return try {
      val array = JSONArray(jsonString)
      val list = ArrayList<PuzzleImageRecord>(array.length())
      for (i in 0 until array.length()) {
        val obj = array.getJSONObject(i)
        list.add(PuzzleImageRecord.fromJson(obj))
      }
      list
    } catch (_: Exception) {
      emptyList()
    }
  }

  private fun saveRegisteredCustomInternal(context: Context, list: List<PuzzleImageRecord>) {
    val array = JSONArray()
    list.forEach { array.put(it.toJson()) }
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    prefs.edit().putString(KEY_REGISTERED_CUSTOM, array.toString()).apply()
  }
}
