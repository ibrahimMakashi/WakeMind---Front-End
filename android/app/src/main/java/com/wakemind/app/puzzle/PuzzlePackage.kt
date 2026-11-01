package com.wakemind.app.puzzle

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class PuzzlePackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == PuzzleImageModule.NAME) PuzzleImageModule(reactContext) else null
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
          PuzzleImageModule.NAME to
              ReactModuleInfo(
                  PuzzleImageModule.NAME,
                  PuzzleImageModule::class.java.name,
                  false,
                  false,
                  false,
                  false,
              ),
      )
    }
  }
}
