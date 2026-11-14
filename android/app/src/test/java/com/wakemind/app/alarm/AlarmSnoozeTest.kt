package com.wakemind.app.alarm

import android.app.AlarmManager
import android.content.ComponentName
import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import java.io.File
import java.nio.file.Files
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class AlarmSnoozeTest {
  private lateinit var tempDir: File
  private lateinit var mockContext: SnoozeMockContext

  @Before
  fun setUp() {
    tempDir = Files.createTempDirectory("wakemind-snooze-test").toFile()
    mockContext = SnoozeMockContext(tempDir)
    AlarmRingtoneService.isRinging = false
    AlarmRingtoneService.currentRingingAlarmId = null
    AlarmRingtoneService.currentOccurrenceId = null
    AlarmRingtoneService.currentSnoozeCount = 0
    AlarmRingtoneService.currentAlarm = null
  }

  @After
  fun tearDown() {
    AlarmRingtoneService.isRinging = false
    AlarmRingtoneService.currentRingingAlarmId = null
    AlarmRingtoneService.currentOccurrenceId = null
    AlarmRingtoneService.currentSnoozeCount = 0
    AlarmRingtoneService.currentAlarm = null
    tempDir.deleteRecursively()
  }

  @Test
  fun test1_occurrenceValidation_mismatchedOccurrenceRejected() {
    AlarmRingtoneService.isRinging = true
    AlarmRingtoneService.currentRingingAlarmId = "alarm-1"
    AlarmRingtoneService.currentOccurrenceId = "occ-A"
    AlarmRingtoneService.currentSnoozeCount = 0

    val allowed = SnoozeController.canSnooze(mockContext, "alarm-1", "occ-B")
    assertFalse("Snooze must be rejected when occurrenceId does not match active occurrence", allowed)

    val result = SnoozeController.requestSnooze(mockContext, "alarm-1", "occ-B")
    assertFalse("requestSnooze must return false when occurrenceId does not match", result)
  }

  @Test
  fun test2_correctOccurrenceAccepted() {
    val alarm = createStoredAlarm("alarm-1")
    AlarmStore(mockContext).upsert(alarm)

    AlarmRingtoneService.isRinging = true
    AlarmRingtoneService.currentRingingAlarmId = "alarm-1"
    AlarmRingtoneService.currentOccurrenceId = "occ-A"
    AlarmRingtoneService.currentSnoozeCount = 0
    AlarmRingtoneService.currentAlarm = alarm

    val allowed = SnoozeController.canSnooze(mockContext, "alarm-1", "occ-A")
    assertTrue("Snooze must be allowed when occurrenceId matches active occurrence", allowed)

    val result = SnoozeController.requestSnooze(mockContext, "alarm-1", "occ-A")
    assertTrue("requestSnooze must succeed for matching occurrence", result)

    val record = SnoozeStore(mockContext).get("occ-A")
    assertNotNull(record)
    assertTrue(record!!.isPending)
    assertEquals(1, record.snoozeCount)
  }

  @Test
  fun test3_maximumOneSnooze_secondSnoozeRejected() {
    val alarm = createStoredAlarm("alarm-1")
    AlarmStore(mockContext).upsert(alarm)

    // First snooze
    AlarmRingtoneService.isRinging = true
    AlarmRingtoneService.currentRingingAlarmId = "alarm-1"
    AlarmRingtoneService.currentOccurrenceId = "occ-1"
    AlarmRingtoneService.currentSnoozeCount = 0
    AlarmRingtoneService.currentAlarm = alarm

    val first = SnoozeController.requestSnooze(mockContext, "alarm-1", "occ-1")
    assertTrue("First snooze must succeed", first)

    // Now simulated ringing from snooze fire (snoozeCount = 1)
    AlarmRingtoneService.isRinging = true
    AlarmRingtoneService.currentRingingAlarmId = "alarm-1"
    AlarmRingtoneService.currentOccurrenceId = "occ-1"
    AlarmRingtoneService.currentSnoozeCount = 1
    AlarmRingtoneService.currentAlarm = alarm

    val canSnoozeAgain = SnoozeController.canSnooze(mockContext, "alarm-1", "occ-1")
    assertFalse("Second snooze must be rejected", canSnoozeAgain)

    val second = SnoozeController.requestSnooze(mockContext, "alarm-1", "occ-1")
    assertFalse("requestSnooze must return false when snoozeCount >= 1", second)
  }

  @Test
  fun test4_exactDuration_is300000ms() {
    assertEquals(300_000L, AlarmTime.SNOOZE_DURATION_MILLIS)

    val alarm = createStoredAlarm("alarm-dur")
    AlarmStore(mockContext).upsert(alarm)

    AlarmRingtoneService.isRinging = true
    AlarmRingtoneService.currentRingingAlarmId = "alarm-dur"
    AlarmRingtoneService.currentOccurrenceId = "occ-dur"
    AlarmRingtoneService.currentSnoozeCount = 0
    AlarmRingtoneService.currentAlarm = alarm

    val before = System.currentTimeMillis()
    SnoozeController.requestSnooze(mockContext, "alarm-dur", "occ-dur")
    val after = System.currentTimeMillis()

    val record = SnoozeStore(mockContext).get("occ-dur")
    assertNotNull(record)
    val diff = record!!.triggerAtMillis - before
    assertTrue(diff in 300_000L..(300_000L + (after - before) + 100L))
  }

  @Test
  fun test5_raceCondition_concurrentRequestsResolveToSingleSchedule() {
    val alarm = createStoredAlarm("alarm-race")
    AlarmStore(mockContext).upsert(alarm)

    AlarmRingtoneService.isRinging = true
    AlarmRingtoneService.currentRingingAlarmId = "alarm-race"
    AlarmRingtoneService.currentOccurrenceId = "occ-race"
    AlarmRingtoneService.currentSnoozeCount = 0
    AlarmRingtoneService.currentAlarm = alarm

    val executor = Executors.newFixedThreadPool(8)
    val tasks =
        (1..8).map {
          Callable {
            SnoozeController.requestSnooze(mockContext, "alarm-race", "occ-race")
          }
        }

    val results = executor.invokeAll(tasks)
    executor.shutdown()

    // At least one succeeded, and the rest resolved idempotently
    val allSucceeded = results.all { it.get() == true }
    assertTrue(allSucceeded)

    // Invariant: SnoozeStore has exactly ONE record for this occurrence
    val allRecords = SnoozeStore(mockContext).listAll().filter { it.occurrenceId == "occ-race" }
    assertEquals(1, allRecords.size)
  }

  @Test
  fun test6_schedulingFailure_rollsBackPersistenceAndKeepsRingingActive() {
    val alarm = createStoredAlarm("alarm-fail")
    AlarmStore(mockContext).upsert(alarm)

    AlarmRingtoneService.isRinging = true
    AlarmRingtoneService.currentRingingAlarmId = "alarm-fail"
    AlarmRingtoneService.currentOccurrenceId = "occ-fail"
    AlarmRingtoneService.currentSnoozeCount = 0
    AlarmRingtoneService.currentAlarm = alarm

    mockContext.failScheduling = true

    try {
      SnoozeController.requestSnooze(mockContext, "alarm-fail", "occ-fail")
    } catch (_: Exception) {
      // Expected exception
    }

    // Invariant: SnoozeStore rolled back
    val record = SnoozeStore(mockContext).get("occ-fail")
    assertNull("Snooze record must be rolled back on scheduling failure", record)

    // Invariant: Alarm remains ringing!
    assertTrue("Alarm must remain ringing when snooze scheduling fails", AlarmRingtoneService.isRinging)
  }

  @Test
  fun test7_differentOccurrences_produceDistinctPendingIntentIdentities() {
    val codeA = AlarmScheduler.snoozeRequestCode("alarm-1", "occ-A")
    val codeB = AlarmScheduler.snoozeRequestCode("alarm-1", "occ-B")
    assertNotEquals("Different occurrences must have different snooze request codes", codeA, codeB)

    val actionA = AlarmNotifications.snoozeActionRequestCode("alarm-1", "occ-A")
    val actionB = AlarmNotifications.snoozeActionRequestCode("alarm-1", "occ-B")
    assertNotEquals("Different occurrences must have different action request codes", actionA, actionB)
  }

  @Test
  fun test8_normalAlarmVsSnooze_distinctIdentities() {
    val normalCode = AlarmReschedule.requestCode("alarm-1")
    val snoozeCode = AlarmScheduler.snoozeRequestCode("alarm-1", "occ-1")
    assertNotEquals("Normal alarm and snooze must have distinct request codes", normalCode, snoozeCode)
  }

  @Test
  fun test9_weeklyRecurrenceIsolation_snoozeDoesNotModifyWeeklySchedule() {
    val store = AlarmStore(mockContext)
    val now = System.currentTimeMillis()
    val weekly =
        StoredAlarm(
            id = "weekly-iso",
            hour = 7,
            minute = 0,
            enabled = true,
            vibrate = true,
            label = "Morning",
            repeat = AlarmDefaults.REPEAT_WEEKLY,
            difficulty = AlarmDefaults.DIFFICULTY_EASY,
            sound = "classic_alarm",
            triggerAtMillis = now + 86400000L,
            createdAtMillis = now,
            repeatDays = listOf("mon", "wed", "fri"),
        )
    store.upsert(weekly)

    // Snooze fire intent (isSnooze = true)
    val receiver = AlarmReceiver()
    receiver.handleAlarmFired(mockContext, "weekly-iso", isSnooze = true, occurrenceId = "occ-iso")

    val afterSnoozeFire = store.get("weekly-iso")
    assertNotNull(afterSnoozeFire)
    assertEquals(weekly.triggerAtMillis, afterSnoozeFire!!.triggerAtMillis)
    assertEquals(listOf("mon", "wed", "fri"), afterSnoozeFire.repeatDays)
    assertTrue(afterSnoozeFire.enabled)
  }

  @Test
  fun test10_deletedAlarm_pendingSnoozeCanceledAndDoesNotRing() {
    val alarm = createStoredAlarm("alarm-del")
    val store = AlarmStore(mockContext)
    store.upsert(alarm)

    val snoozeStore = SnoozeStore(mockContext)
    snoozeStore.save(
        SnoozeRecord(
            alarmId = "alarm-del",
            occurrenceId = "occ-del",
            triggerAtMillis = System.currentTimeMillis() + 300_000L,
            snoozeCount = 1,
            isPending = true,
            label = "Morning",
            vibrate = true,
            puzzleImageId = AlarmDefaults.DEFAULT_PUZZLE_IMAGE_ID,
            puzzleImageType = AlarmDefaults.DEFAULT_PUZZLE_IMAGE_TYPE,
            difficulty = AlarmDefaults.DIFFICULTY_EASY,
            sound = AlarmDefaults.DEFAULT_ALARM_SOUND_ID,
        ),
    )

    // User deletes alarm
    AlarmController.delete(mockContext, "alarm-del")

    // Snooze store must be cleared for this alarm
    assertNull(snoozeStore.get("occ-del"))

    // If snooze fire somehow executes for deleted alarm, it must not ring
    mockContext.startServiceAttempted = false
    val receiver = AlarmReceiver()
    receiver.handleAlarmFired(mockContext, "alarm-del", isSnooze = true, occurrenceId = "occ-del")
    assertFalse("Snooze fire for deleted alarm must not start ringing", mockContext.startServiceAttempted)
  }

  @Test
  fun test11_occurrenceCleanup_clearOccurrenceADoesNotRemoveOccurrenceB() {
    val store = SnoozeStore(mockContext)
    val recA = createSnoozeRecord("alarm-1", "occ-A")
    val recB = createSnoozeRecord("alarm-1", "occ-B")

    store.save(recA)
    store.save(recB)

    assertEquals(2, store.listAll().size)

    store.clear("occ-A")

    assertNull("occ-A must be cleared", store.get("occ-A"))
    assertNotNull("occ-B must remain intact", store.get("occ-B"))
  }

  @Test
  fun test12_rebootRecovery_futureSnoozeRescheduled() {
    val alarm = createStoredAlarm("alarm-boot")
    AlarmStore(mockContext).upsert(alarm)

    val snoozeStore = SnoozeStore(mockContext)
    val futureTrigger = System.currentTimeMillis() + 200_000L
    snoozeStore.save(
        createSnoozeRecord("alarm-boot", "occ-boot", futureTrigger),
    )

    SnoozeController.recoverPendingSnoozes(mockContext)

    val record = snoozeStore.get("occ-boot")
    assertNotNull(record)
    assertTrue("Future snooze must remain pending after reboot recovery", record!!.isPending)
    assertTrue(mockContext.scheduleSnoozeAttempted)
  }

  @Test
  fun test13_expiredSnoozeRecovery_handledOnceWithoutDuplicates() {
    val alarm = createStoredAlarm("alarm-exp")
    AlarmStore(mockContext).upsert(alarm)

    val snoozeStore = SnoozeStore(mockContext)
    val pastTrigger = System.currentTimeMillis() - 5_000L
    snoozeStore.save(
        createSnoozeRecord("alarm-exp", "occ-exp", pastTrigger),
    )

    mockContext.startServiceAttempted = false
    SnoozeController.recoverPendingSnoozes(mockContext)

    val record = snoozeStore.get("occ-exp")
    assertNotNull(record)
    assertFalse("Expired snooze must be marked consumed after recovery", record!!.isPending)
    assertTrue("Expired snooze must trigger ringing once", mockContext.startServiceAttempted)

    // Running recovery a second time must NOT ring again
    mockContext.startServiceAttempted = false
    SnoozeController.recoverPendingSnoozes(mockContext)
    assertFalse("Expired snooze must not be recovered twice", mockContext.startServiceAttempted)
  }

  private fun createStoredAlarm(id: String): StoredAlarm =
      StoredAlarm(
          id = id,
          hour = 7,
          minute = 0,
          enabled = true,
          vibrate = true,
          label = "Test Alarm",
          repeat = AlarmDefaults.REPEAT_ONCE,
          difficulty = AlarmDefaults.DIFFICULTY_EASY,
          sound = "gentle_morning",
          triggerAtMillis = System.currentTimeMillis() + 60_000L,
          createdAtMillis = System.currentTimeMillis(),
          repeatDays = emptyList(),
      )

  private fun createSnoozeRecord(
      alarmId: String,
      occurrenceId: String,
      triggerAt: Long = System.currentTimeMillis() + 300_000L,
  ): SnoozeRecord =
      SnoozeRecord(
          alarmId = alarmId,
          occurrenceId = occurrenceId,
          triggerAtMillis = triggerAt,
          snoozeCount = 1,
          isPending = true,
          label = "Test Alarm",
          vibrate = true,
          puzzleImageId = AlarmDefaults.DEFAULT_PUZZLE_IMAGE_ID,
          puzzleImageType = AlarmDefaults.DEFAULT_PUZZLE_IMAGE_TYPE,
          difficulty = AlarmDefaults.DIFFICULTY_EASY,
          sound = "gentle_morning",
      )

  private class SnoozeMockContext(private val baseDir: File) : ContextWrapper(null) {
    var startServiceAttempted = false
    var scheduleSnoozeAttempted = false
    var failScheduling = false

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

    override fun getSystemService(name: String): Any? {
      if (name == Context.ALARM_SERVICE) {
        if (failScheduling) {
          throw SecurityException("Mock exact alarm permission revoked")
        }
        scheduleSnoozeAttempted = true
        return null // In tests using mock context, return null or handle gracefully
      }
      return null
    }
  }
}
