package com.tejareddy.financetracker

import android.content.Context
import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "mobile"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        savePendingCategory(intent)
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        savePendingCategory(intent)
    }

    private fun savePendingCategory(intent: Intent?) {
        val cat = intent?.getStringExtra(FinanceWidgetQuickAdd.KEY_PENDING_CATEGORY) ?: return
        getSharedPreferences(FinanceWidget.PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(FinanceWidgetQuickAdd.KEY_PENDING_CATEGORY, cat)
            .apply()
    }
}
