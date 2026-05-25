package com.tejareddy.financetracker

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import kotlin.math.min
import kotlin.math.roundToInt

class FinanceWidgetSmall : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (id in appWidgetIds) {
            updateSmallWidget(context, appWidgetManager, id)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == FinanceWidget.ACTION_UPDATE) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(
                ComponentName(context, FinanceWidgetSmall::class.java)
            )
            for (id in ids) {
                updateSmallWidget(context, manager, id)
            }
        }
    }

    companion object {
        fun updateSmallWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
            val prefs = context.getSharedPreferences(FinanceWidget.PREFS_NAME, Context.MODE_PRIVATE)
            val todaySpent   = prefs.getFloat(FinanceWidget.KEY_SPENT, 0f).toDouble()
            val monthlySpent = prefs.getFloat(FinanceWidget.KEY_MONTHLY_SPENT, 0f).toDouble()
            val budget       = prefs.getFloat(FinanceWidget.KEY_BUDGET, 0f).toDouble()
            val currency     = prefs.getString(FinanceWidget.KEY_CURRENCY, "₹") ?: "₹"

            val views = RemoteViews(context.packageName, R.layout.widget_small)
            views.setTextViewText(R.id.ws_amount, "$currency${fmt(todaySpent)}")

            val sub = if (budget > 0) {
                val pct = (min(monthlySpent / budget, 1.0) * 100).roundToInt()
                "$pct% of budget used"
            } else {
                "$currency${fmt(monthlySpent)} this month"
            }
            views.setTextViewText(R.id.ws_sub, sub)

            val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (launch != null) {
                val pi = android.app.PendingIntent.getActivity(
                    context, 0, launch,
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT or
                            android.app.PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.ws_amount, pi)
            }

            manager.updateAppWidget(widgetId, views)
        }

        private fun fmt(n: Double): String = when {
            n >= 100000 -> String.format("%.1fL", n / 100000)
            n >= 1000   -> String.format("%.1fk", n / 1000)
            else        -> n.roundToInt().toString()
        }
    }
}
