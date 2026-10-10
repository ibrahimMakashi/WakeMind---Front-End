package com.wakemind.app

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    // react-native-screens restores its own fragments. Passing null avoids a
    // duplicate restore that can crash the activity. Alarm delivery is unchanged.
    super.onCreate(null)
  }

  override fun getMainComponentName(): String = "WakeMind"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
