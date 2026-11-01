package com.wakemind.app.puzzle

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Log
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import kotlin.concurrent.thread

class PuzzleImageModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  companion object {
    const val NAME = "PuzzleImageModule"
    private const val REQUEST_CODE_PICK_IMAGE = 4129
    private const val PREFS_NAME = "puzzle_image_prefs"
    private const val KEY_IMAGE_ID = "selected_image_id"
    private const val KEY_IMAGE_TYPE = "selected_image_type"
    private const val KEY_IMAGE_URI = "selected_image_uri"
    private const val KEY_IMAGE_TITLE = "selected_image_title"
    private const val MAX_SAVED_CUSTOM_IMAGES = 4
  }

  private var pendingPickPromise: Promise? = null

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun pickImage(promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("ACTIVITY_UNAVAILABLE", "The Android Activity is currently unavailable.")
      return
    }

    if (pendingPickPromise != null) {
      try {
        val cancelledMap = Arguments.createMap()
        cancelledMap.putBoolean("cancelled", true)
        pendingPickPromise?.resolve(cancelledMap)
      } catch (_: Exception) {}
      pendingPickPromise = null
    }

    pendingPickPromise = promise

    try {
      val intent =
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            Intent(MediaStore.ACTION_PICK_IMAGES).apply {
              type = "image/*"
            }
          } else {
            Intent(Intent.ACTION_GET_CONTENT).apply {
              type = "image/*"
              addCategory(Intent.CATEGORY_OPENABLE)
            }
          }

      activity.startActivityForResult(intent, REQUEST_CODE_PICK_IMAGE)
    } catch (e: Exception) {
      Log.e(NAME, "Failed to launch system photo picker", e)
      pendingPickPromise = null
      promise.reject("PICKER_LAUNCH_FAILED", e.message ?: "Failed to open photo picker", e)
    }
  }

  override fun onActivityResult(
      activity: Activity,
      requestCode: Int,
      resultCode: Int,
      data: Intent?
  ) {
    if (requestCode != REQUEST_CODE_PICK_IMAGE) {
      return
    }

    val promise = pendingPickPromise ?: return
    pendingPickPromise = null

    if (resultCode != Activity.RESULT_OK || data == null || data.data == null) {
      val cancelledMap = Arguments.createMap()
      cancelledMap.putBoolean("cancelled", true)
      promise.resolve(cancelledMap)
      return
    }

    val selectedUri: Uri = data.data!!

    thread {
      try {
        // Copy to app cache to ensure reliable stream access across background threads
        val cacheFile =
            File(
                reactApplicationContext.cacheDir,
                "puzzle_picker_source_${System.currentTimeMillis()}.jpg"
            )

        reactApplicationContext.contentResolver.openInputStream(selectedUri).use { input ->
          if (input == null) {
            throw IllegalArgumentException("Cannot open stream for selected image URI")
          }
          FileOutputStream(cacheFile).use { output ->
            input.copyTo(output)
          }
        }

        // Read dimensions & EXIF orientation
        val boundsOptions = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(cacheFile.absolutePath, boundsOptions)

        val exif = ExifInterface(cacheFile.absolutePath)
        val orientation =
            exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
        val isRotated90or270 =
            orientation == ExifInterface.ORIENTATION_ROTATE_90 ||
                orientation == ExifInterface.ORIENTATION_ROTATE_270

        val displayWidth =
            if (isRotated90or270) boundsOptions.outHeight else boundsOptions.outWidth
        val displayHeight =
            if (isRotated90or270) boundsOptions.outWidth else boundsOptions.outHeight

        val resultMap = Arguments.createMap()
        resultMap.putString("uri", "file://" + cacheFile.absolutePath)
        resultMap.putInt("width", displayWidth)
        resultMap.putInt("height", displayHeight)
        resultMap.putBoolean("cancelled", false)
        promise.resolve(resultMap)
      } catch (e: Exception) {
        Log.e(NAME, "Failed to inspect picked image", e)
        promise.reject("PICKED_IMAGE_PROCESS_FAILED", e.message ?: "Could not load selected image", e)
      }
    }
  }

  override fun onNewIntent(intent: Intent) {}

  @ReactMethod
  fun cropSquareImage(options: ReadableMap, promise: Promise) {
    thread {
      try {
        val uriString = options.getString("uri")
            ?: throw IllegalArgumentException("Missing 'uri' option for cropSquareImage")
        val cropX = options.getDouble("cropX")
        val cropY = options.getDouble("cropY")
        val cropSize = options.getDouble("cropSize")
        val targetSize =
            if (options.hasKey("targetSize")) options.getInt("targetSize") else 1024

        val parsedUri = Uri.parse(uriString)
        val filePath =
            if (parsedUri.scheme == "file") parsedUri.path
            else {
              // Copy content uri to cache if needed
              val temp = File(reactApplicationContext.cacheDir, "temp_crop_source.jpg")
              reactApplicationContext.contentResolver.openInputStream(parsedUri).use { input ->
                FileOutputStream(temp).use { output -> input?.copyTo(output) }
              }
              temp.absolutePath
            }

        if (filePath == null || !File(filePath).exists()) {
          throw IllegalArgumentException("Source image file does not exist at $uriString")
        }

        // Determine orientation
        val exif = ExifInterface(filePath)
        val orientation =
            exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)

        // Decode bounds to compute optimal inSampleSize
        val boundsOptions = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(filePath, boundsOptions)
        val rawWidth = boundsOptions.outWidth
        val rawHeight = boundsOptions.outHeight

        var sampleSize = 1
        val maxDimension = maxOf(rawWidth, rawHeight)
        while (maxDimension / (sampleSize * 2) >= targetSize * 2) {
          sampleSize *= 2
        }

        val decodeOptions = BitmapFactory.Options().apply {
          inSampleSize = sampleSize
          inPreferredConfig = Bitmap.Config.ARGB_8888
        }

        val rawBitmap = BitmapFactory.decodeFile(filePath, decodeOptions)
            ?: throw IllegalStateException("Could not decode image at $filePath")

        // Apply EXIF rotation if needed
        val rotationDegrees = when (orientation) {
          ExifInterface.ORIENTATION_ROTATE_90 -> 90f
          ExifInterface.ORIENTATION_ROTATE_180 -> 180f
          ExifInterface.ORIENTATION_ROTATE_270 -> 270f
          else -> 0f
        }

        val orientedBitmap: Bitmap =
            if (rotationDegrees != 0f) {
              val matrix = Matrix().apply { postRotate(rotationDegrees) }
              val rotated =
                  Bitmap.createBitmap(
                      rawBitmap,
                      0,
                      0,
                      rawBitmap.width,
                      rawBitmap.height,
                      matrix,
                      true
                  )
              if (rotated != rawBitmap) {
                rawBitmap.recycle()
              }
              rotated
            } else {
              rawBitmap
            }

        // Scale crop coordinates to sampleSize space
        val orientedFullWidth =
            if (rotationDegrees == 90f || rotationDegrees == 270f) rawHeight else rawWidth
        val orientedFullHeight =
            if (rotationDegrees == 90f || rotationDegrees == 270f) rawWidth else rawHeight

        val scaleX = orientedBitmap.width.toDouble() / orientedFullWidth.toDouble()
        val scaleY = orientedBitmap.height.toDouble() / orientedFullHeight.toDouble()

        val requestedSize = (cropSize * scaleX).toInt()
        val maxSquare = minOf(orientedBitmap.width, orientedBitmap.height)
        val finalCropSize = requestedSize.coerceIn(1, maxSquare)

        val maxSx = maxOf(0, orientedBitmap.width - finalCropSize)
        val maxSy = maxOf(0, orientedBitmap.height - finalCropSize)

        val sx = (cropX * scaleX).toInt().coerceIn(0, maxSx)
        val sy = (cropY * scaleY).toInt().coerceIn(0, maxSy)

        val cropped = Bitmap.createBitmap(orientedBitmap, sx, sy, finalCropSize, finalCropSize)
        if (cropped != orientedBitmap) {
          orientedBitmap.recycle()
        }

        // Scale to square targetSize (1024x1024)
        val finalSquare =
            if (cropped.width != targetSize || cropped.height != targetSize) {
              val scaled = Bitmap.createScaledBitmap(cropped, targetSize, targetSize, true)
              if (scaled != cropped) {
                cropped.recycle()
              }
              scaled
            } else {
              cropped
            }

        // Save to app-private files directory
        val puzzleDir = File(reactApplicationContext.filesDir, "puzzle_custom").apply { mkdirs() }
        cleanOldCustomImages(puzzleDir, MAX_SAVED_CUSTOM_IMAGES - 1)

        val timestamp = System.currentTimeMillis()
        val outputFile = File(puzzleDir, "puzzle_crop_$timestamp.jpg")
        FileOutputStream(outputFile).use { out ->
          finalSquare.compress(Bitmap.CompressFormat.JPEG, 92, out)
        }
        finalSquare.recycle()

        val outputUri = "file://" + outputFile.absolutePath
        val imageId = "custom_$timestamp"

        val resultMap = Arguments.createMap()
        resultMap.putString("id", imageId)
        resultMap.putString("uri", outputUri)
        resultMap.putInt("width", targetSize)
        resultMap.putInt("height", targetSize)
        promise.resolve(resultMap)
      } catch (e: Exception) {
        Log.e(NAME, "Failed to crop square image", e)
        promise.reject("CROP_FAILED", e.message ?: "Failed to crop image", e)
      }
    }
  }

  private fun cleanOldCustomImages(dir: File, keepCount: Int) {
    try {
      val files = dir.listFiles { f -> f.isFile && f.name.startsWith("puzzle_crop_") }
      if (files != null && files.size > keepCount) {
        files.sortBy { it.lastModified() }
        val toDelete = files.size - keepCount
        for (i in 0 until toDelete) {
          files[i].delete()
        }
      }
    } catch (_: Exception) {}
  }

  @ReactMethod
  fun saveSelectedImage(params: ReadableMap, promise: Promise) {
    try {
      val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val editor = prefs.edit()
      editor.putString(KEY_IMAGE_ID, params.getString("id") ?: "moraine-lake")
      editor.putString(KEY_IMAGE_TYPE, params.getString("type") ?: "bundled")
      editor.putString(KEY_IMAGE_URI, if (params.hasKey("uri")) params.getString("uri") else "")
      editor.putString(KEY_IMAGE_TITLE, if (params.hasKey("title")) params.getString("title") else "")
      editor.apply()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("PREFS_SAVE_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun getSelectedImage(promise: Promise) {
    try {
      val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val id = prefs.getString(KEY_IMAGE_ID, null)
      if (id == null) {
        promise.resolve(null)
        return
      }

      val type = prefs.getString(KEY_IMAGE_TYPE, "bundled") ?: "bundled"
      val uri = prefs.getString(KEY_IMAGE_URI, "") ?: ""
      val title = prefs.getString(KEY_IMAGE_TITLE, "") ?: ""

      // If custom, verify the file still exists on disk
      if (type == "custom") {
        val parsed = Uri.parse(uri)
        val path = if (parsed.scheme == "file") parsed.path else uri
        if (path == null || !File(path).exists()) {
          promise.resolve(null)
          return
        }
      }

      val map = Arguments.createMap()
      map.putString("id", id)
      map.putString("type", type)
      map.putString("uri", uri)
      map.putString("title", title)
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("PREFS_READ_FAILED", e.message, e)
    }
  }
}
