package com.wakemind.app.alarm

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class AlarmPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == AlarmModule.NAME) AlarmModule(reactContext) else null
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
          AlarmModule.NAME to
              ReactModuleInfo(
                  AlarmModule.NAME,
                  AlarmModule::class.java.name,
                  false,
                  false,
                  false,
                  false,
              ),
      )
    }
  }
}
