package com.tejareddy.financetracker

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class WidgetModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WidgetModule"

    @ReactMethod
    fun updateWidget(data: ReadableMap) {
        val prefs = reactContext.getSharedPreferences(
            FinanceWidget.PREFS_NAME, Context.MODE_PRIVATE
        )
        val editor = prefs.edit()

        if (data.hasKey("todaySpent"))
            editor.putFloat(FinanceWidget.KEY_SPENT, data.getDouble("todaySpent").toFloat())
        if (data.hasKey("monthlySpent"))
            editor.putFloat(FinanceWidget.KEY_MONTHLY_SPENT, data.getDouble("monthlySpent").toFloat())
        if (data.hasKey("budget"))
            editor.putFloat(FinanceWidget.KEY_BUDGET, data.getDouble("budget").toFloat())
        if (data.hasKey("currency"))
            editor.putString(FinanceWidget.KEY_CURRENCY, data.getString("currency"))

        editor.apply()

        // Broadcast to all 3 widget types so they all redraw
        val action = FinanceWidget.ACTION_UPDATE
        listOf(FinanceWidget::class.java, FinanceWidgetSmall::class.java, FinanceWidgetRing::class.java)
            .forEach { cls ->
                reactContext.sendBroadcast(Intent(reactContext, cls).apply { this.action = action })
            }
    }

    @ReactMethod
    fun getPendingCategory(promise: Promise) {
        val prefs = reactContext.getSharedPreferences(FinanceWidget.PREFS_NAME, Context.MODE_PRIVATE)
        val cat = prefs.getString(FinanceWidgetQuickAdd.KEY_PENDING_CATEGORY, null)
        if (cat != null) {
            prefs.edit().remove(FinanceWidgetQuickAdd.KEY_PENDING_CATEGORY).apply()
        }
        promise.resolve(cat)
    }
}
