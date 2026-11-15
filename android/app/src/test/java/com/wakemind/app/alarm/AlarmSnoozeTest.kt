package com.wakemind.app.alarm

import android.app.AlarmManager
import android.app.PendingIntent
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

    // Safe instance allocation for Android classes in JVM unit test environment
    val unsafeClass = Class.forName("sun.misc.Unsafe")
    val theUnsafeField = unsafeClass.getDeclaredField("theUnsafe").apply { isAccessible = true }
    val unsafe = theUnsafeField.get(null)
    val allocateInstanceMethod = unsafeClass.getMethod("allocateInstance", Class::class.java)

    val mockAlarmManager = allocateInstanceMethod.invoke(unsafe, AlarmManager::class.java) as AlarmManager
    val mockPendingIntent = allocateInstanceMethod.invoke(unsafe, PendingIntent::class.java) as PendingIntent

    AlarmScheduler.alarmManagerProvider = { ctx ->
      if (mockContext.failScheduling) {
        throw SecurityException("Mock exact alarm permission revoked")
      }
      mockContext.scheduleSnoozeAttempted = true
      mockAlarmManager
    }

    AlarmScheduler.pendingIntentFactory = { _, _, _, _ ->
      if (mockContext.failScheduling) null else mockPendingIntent
    }

    AlarmScheduler.pendingIntentResolver = { _, _, _, _ ->
      if (mockContext.failScheduling) null else mockPendingIntent
    }
  }

  @After
  fun tearDown() {
    AlarmScheduler.resetProviders()
    AlarmRingtoneService.isRinging = false
    AlarmRingtoneService.currentRingingAlarmId = null
    AlarmRingtoneService.currentOccurrenceId = null
    AlarmRingtoneService.currentSnoozeCount = 0
    AlarmRingtoneService.currentAlarm = null
    tempDir.deleteRecursively()
  }

  // --- Requirement 20 Tests ---

  @Test
  fun test1_distinctOccurrenceIdentity() {
    val codeA = AlarmScheduler.snoozeRequestCode("alarm-1", "occ-A")
    val codeB = AlarmScheduler.snoozeRequestCode("alarm-1", "occ-B")
    assertNotEquals("Different occurrences must have different snooze request codes", codeA, codeB)

    val actionA = AlarmNotifications.snoozeActionRequestCode("alarm-1", "occ-A")
    val actionB = AlarmNotifications.snoozeActionRequestCode("alarm-1", "occ-B")
    assertNotEquals("Different occurrences must have different action request codes", actionA, actionB)

    val normalCode = AlarmReschedule.requestCode("alarm-1")
    assertNotEquals("Normal alarm and snooze must have distinct request codes", normalCode, codeA)
  }

  @Test
  fun test2_missingOccurrenceId_rejected() {
    val alarm = createStoredAlarm("alarm-1")
    AlarmStore(mockContext).upsert(alarm)

    mockContext.startServiceAttempted = false
    val receiver = AlarmReceiver()

    // Send snooze fire intent without occurrenceId
    receiver.handleAlarmFired(mockContext, "alarm-1", isSnooze = true, occurrenceId = null)

    assertFalse("Snooze without occurrenceId must NOT start ringing", mockContext.startServiceAttempted)
    val records = SnoozeStore(mockContext).listAll()
    assertEquals("No SnoozeRecord must be created when occurrenceId is missing", 0, records.size)
  }

  @Test
  fun test3_unknownOccurrenceId_rejected() {
    val alarm = createStoredAlarm("alarm-1")
    AlarmStore(mockContext).upsert(alarm)

    mockContext.startServiceAttempted = false
    val receiver = AlarmReceiver()

    // Send snooze fire intent with random/unknown occurrenceId
    receiver.handleAlarmFired(mockContext, "alarm-1", isSnooze = true, occurrenceId = "unknown-occ-999")

    assertFalse("Snooze with unknown occurrenceId must NOT start ringing", mockContext.startServiceAttempted)
    val records = SnoozeStore(mockContext).listAll()
    assertEquals("No SnoozeRecord must be created", 0, records.size)
  }

  @Test
  fun test4_wrongAlarmIdForOccurrence_rejected() {
    val alarmA = createStoredAlarm("alarm-A")
    val alarmB = createStoredAlarm("alarm-B")
    AlarmStore(mockContext).upsert(alarmA)
    AlarmStore(mockContext).upsert(alarmB)

    val snoozeStore = SnoozeStore(mockContext)
    snoozeStore.save(createSnoozeRecord("alarm-A", "occ-1"))

    mockContext.startServiceAttempted = false
    val receiver = AlarmReceiver()

    // Fire occurrence-1 with mismatched alarmId
    receiver.handleAlarmFired(mockContext, "alarm-B", isSnooze = true, occurrenceId = "occ-1")

    assertFalse("Snooze with mismatched alarmId must be rejected and NOT start ringing", mockContext.startServiceAttempted)
  }

  @Test
  fun test5_alreadyConsumedSnooze_rejected() {
    val alarm = createStoredAlarm("alarm-1")
    AlarmStore(mockContext).upsert(alarm)

    val snoozeStore = SnoozeStore(mockContext)
    // Save record with isPending = false (already consumed)
    val consumedRecord = createSnoozeRecord("alarm-1", "occ-consumed").copy(isPending = false)
    snoozeStore.save(consumedRecord)

    mockContext.startServiceAttempted = false
    val receiver = AlarmReceiver()

    // Fire snooze that is already consumed
    receiver.handleAlarmFired(mockContext, "alarm-1", isSnooze = true, occurrenceId = "occ-consumed")

    assertFalse("Already consumed snooze must NOT start ringing again", mockContext.startServiceAttempted)
  }

  @Test
  fun test6_secondSnooze_rejected() {
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

    // Ringing from snooze fire (snoozeCount = 1)
    AlarmRingtoneService.isRinging = true
    AlarmRingtoneService.currentRingingAlarmId = "alarm-1"
    AlarmRingtoneService.currentOccurrenceId = "occ-1"
    AlarmRingtoneService.currentSnoozeCount = 1
    AlarmRingtoneService.currentAlarm = alarm

    val canSnoozeAgain = SnoozeController.canSnooze(mockContext, "alarm-1", "occ-1")
    assertFalse("Second snooze must be rejected by canSnooze", canSnoozeAgain)

    val second = SnoozeController.requestSnooze(mockContext, "alarm-1", "occ-1")
    assertFalse("requestSnooze must return false when snoozeCount >= 1", second)
  }

  @Test
  fun test7_concurrentSnoozeRequests_resolveToOneSchedule() {
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

    val allSucceeded = results.all { it.get() == true }
    assertTrue("All concurrent requests must resolve cleanly", allSucceeded)

    // Invariant: SnoozeStore has exactly ONE record for this occurrence
    val allRecords = SnoozeStore(mockContext).listAll().filter { it.occurrenceId == "occ-race" }
    assertEquals("Exactly one SnoozeRecord must be created", 1, allRecords.size)
  }

  @Test
  fun test8_schedulingFailure_rollsBackPersistenceAndKeepsRingingActive() {
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
  fun test9_puzzleCleanup_clearsOnlyCurrentOccurrence() {
    val store = SnoozeStore(mockContext)
    val recA = createSnoozeRecord("alarm-A", "occ-A")
    val recB = createSnoozeRecord("alarm-A", "occ-B")

    store.save(recA)
    store.save(recB)

    assertEquals(2, store.listAll().size)

    // Complete puzzle for occurrence-A
    AlarmRingtoneService.isRinging = true
    AlarmRingtoneService.currentRingingAlarmId = "alarm-A"
    AlarmRingtoneService.currentOccurrenceId = "occ-A"

    val dismissed = AlarmRingtoneService.dismissAfterPuzzle(mockContext, "alarm-A", "occ-A")
    assertTrue("Dismissal must succeed", dismissed)

    assertNull("occ-A must be cleared from snooze store", store.get("occ-A"))
    assertNotNull("occ-B must remain intact (not cleared by clearForAlarm)", store.get("occ-B"))
  }

  @Test
  fun test10_alarmDeletionCleanup_clearsAllSnoozesForAlarm() {
    val alarm = createStoredAlarm("alarm-del")
    val store = AlarmStore(mockContext)
    store.upsert(alarm)

    val snoozeStore = SnoozeStore(mockContext)
    snoozeStore.save(createSnoozeRecord("alarm-del", "occ-del-1"))
    snoozeStore.save(createSnoozeRecord("alarm-del", "occ-del-2"))

    // User deletes alarm
    AlarmController.delete(mockContext, "alarm-del")

    // Snooze store must be cleared for all occurrences of this alarm
    assertNull(snoozeStore.get("occ-del-1"))
    assertNull(snoozeStore.get("occ-del-2"))

    // Stale snooze fire for deleted alarm must NOT ring
    mockContext.startServiceAttempted = false
    val receiver = AlarmReceiver()
    receiver.handleAlarmFired(mockContext, "alarm-del", isSnooze = true, occurrenceId = "occ-del-1")
    assertFalse("Snooze fire for deleted alarm must not start ringing", mockContext.startServiceAttempted)
  }

  @Test
  fun test11_weeklyRecurrence_unmodifiedBySnooze() {
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

    // Setup valid pending snooze record for this occurrence
    val snoozeStore = SnoozeStore(mockContext)
    snoozeStore.save(createSnoozeRecord("weekly-iso", "occ-iso", now - 1000L))

    // Snooze fire intent (isSnooze = true)
    val receiver = AlarmReceiver()
    receiver.handleAlarmFired(mockContext, "weekly-iso", isSnooze = true, occurrenceId = "occ-iso")

    val afterSnoozeFire = store.get("weekly-iso")
    assertNotNull(afterSnoozeFire)
    assertEquals("Weekly trigger time must remain unmodified", weekly.triggerAtMillis, afterSnoozeFire!!.triggerAtMillis)
    assertEquals(listOf("mon", "wed", "fri"), afterSnoozeFire.repeatDays)
    assertTrue(afterSnoozeFire.enabled)
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
    assertEquals("Occurrence ID must remain the same", "occ-boot", record.occurrenceId)
    assertTrue(mockContext.scheduleSnoozeAttempted)
  }

  @Test
  fun test13_timezoneChangeRecovery_sameOccurrenceRescheduled() {
    val alarm = createStoredAlarm("alarm-tz")
    AlarmStore(mockContext).upsert(alarm)

    val snoozeStore = SnoozeStore(mockContext)
    val futureTrigger = System.currentTimeMillis() + 250_000L
    snoozeStore.save(
        createSnoozeRecord("alarm-tz", "occ-tz", futureTrigger),
    )

    // Trigger recovery as would happen in TimeChangeReceiver
    SnoozeController.recoverPendingSnoozes(mockContext)

    val record = snoozeStore.get("occ-tz")
    assertNotNull(record)
    assertTrue(record!!.isPending)
    assertEquals("Occurrence ID must remain identical during timezone recovery", "occ-tz", record.occurrenceId)
    assertTrue(mockContext.scheduleSnoozeAttempted)
  }

  @Test
  fun test14_timeSetAndZoneActions_handledByTimeChangeReceiver() {
    val alarm = createStoredAlarm("alarm-time-receiver")
    AlarmStore(mockContext).upsert(alarm)

    val snoozeStore = SnoozeStore(mockContext)
    val futureTrigger = System.currentTimeMillis() + 150_000L
    snoozeStore.save(
        createSnoozeRecord("alarm-time-receiver", "occ-time-action", futureTrigger),
    )

    val receiver = TimeChangeReceiver()

    // 1. Test android.intent.action.TIME_SET
    val timeSetIntent = Intent("android.intent.action.TIME_SET")
    receiver.onReceive(mockContext, timeSetIntent)

    val recordAfterTimeSet = snoozeStore.get("occ-time-action")
    assertNotNull(recordAfterTimeSet)
    assertTrue(recordAfterTimeSet!!.isPending)

    // 2. Test Intent.ACTION_TIMEZONE_CHANGED
    val tzIntent = Intent(Intent.ACTION_TIMEZONE_CHANGED)
    receiver.onReceive(mockContext, tzIntent)

    val recordAfterTz = snoozeStore.get("occ-time-action")
    assertNotNull(recordAfterTz)
    assertTrue(recordAfterTz!!.isPending)
  }

  // --- Additional Invariant Tests ---

  @Test
  fun test15_exactDuration_is300000ms() {
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
  fun test16_expiredSnoozeRecovery_handledOnceWithoutDuplicates() {
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
        return null
      }
      return null
    }
  }
}
