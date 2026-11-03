package com.wakemind.app.alarm

import android.content.ComponentName
import android.content.ContextWrapper
import android.content.Intent
import java.io.File
import java.nio.file.Files
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class AlarmReceiverTest {
  private lateinit var tempDir: File
  private lateinit var mockContext: ReceiverMockContext

  @Before
  fun setUp() {
    tempDir = Files.createTempDirectory("wakemind-alarm-receiver-test").toFile()
    mockContext = ReceiverMockContext(tempDir)
  }

  @After
  fun tearDown() {
    tempDir.deleteRecursively()
  }

  @Test
  fun oneTimeAlarmFires_disablesAlarmInStoreAndAttemptsToRing() {
    val store = AlarmStore(mockContext)
    val oneTimeAlarm =
        StoredAlarm(
            id = "one-time-1",
            hour = 8,
            minute = 0,
            enabled = true,
            vibrate = true,
            label = "Morning",
            repeat = AlarmDefaults.REPEAT_ONCE,
            difficulty = AlarmDefaults.DIFFICULTY_EASY,
            sound = AlarmDefaults.SOUND_SYSTEM_ALARM,
            triggerAtMillis = 1_000L,
            createdAtMillis = 500L,
            repeatDays = emptyList(),
        )
    store.upsert(oneTimeAlarm)

    val receiver = AlarmReceiver()
    receiver.handleAlarmFired(mockContext, "one-time-1")

    val updated = store.get("one-time-1")
    assertNotNull(updated)
    // One-time alarm must be disabled after firing
    assertFalse(updated!!.enabled)
    // Ringtone service must be started
    assertTrue(mockContext.startServiceAttempted)
  }

  @Test
  fun recurringAlarmFires_remainsEnabledAndAdvancesTriggerEvenIfSchedulerFails() {
    val store = AlarmStore(mockContext)
    val now = System.currentTimeMillis()
    val recurringAlarm =
        StoredAlarm(
            id = "recurring-1",
            hour = 9,
            minute = 30,
            enabled = true,
            vibrate = true,
            label = "Work",
            repeat = AlarmDefaults.REPEAT_WEEKLY,
            difficulty = AlarmDefaults.DIFFICULTY_EASY,
            sound = AlarmDefaults.SOUND_SYSTEM_ALARM,
            triggerAtMillis = now - 1000L, // past trigger
            createdAtMillis = now - 50000L,
            repeatDays = listOf("mon", "wed", "fri"),
        )
    store.upsert(recurringAlarm)

    val receiver = AlarmReceiver()
    // AlarmScheduler will fail because mockContext doesn't provide AlarmManager service
    receiver.handleAlarmFired(mockContext, "recurring-1")

    val updated = store.get("recurring-1")
    assertNotNull(updated)
    // Recurring alarm must REMAIN enabled
    assertTrue(updated!!.enabled)
    // Trigger must be advanced strictly into the future
    assertTrue(updated.triggerAtMillis > now)
    // Ringing must STILL be attempted despite scheduling failure
    assertTrue(mockContext.startServiceAttempted)
  }

  private class ReceiverMockContext(private val baseDir: File) : ContextWrapper(null) {
    var startServiceAttempted = false

    override fun getFilesDir(): File = baseDir

    override fun getPackageName(): String = "com.wakemind.app"

    override fun startForegroundService(service: Intent?): ComponentName {
      startServiceAttempted = true
      return ComponentName("com.wakemind.app", "AlarmRingtoneService")
    }

    override fun startService(service: Intent?): ComponentName {
      startServiceAttempted = true
      return ComponentName("com.wakemind.app", "AlarmRingtoneService")
    }

    override fun getSystemService(name: String): Any? = null
  }
}
