package com.tejareddy.financetracker

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.view.View
import android.widget.RemoteViews
import kotlin.math.min
import kotlin.math.roundToInt

class FinanceWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (id in appWidgetIds) {
            updateWidget(context, appWidgetManager, id)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_UPDATE) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(
                ComponentName(context, FinanceWidget::class.java)
            )
            for (id in ids) {
                updateWidget(context, manager, id)
            }
        }
    }

    companion object {
        const val ACTION_UPDATE = "com.tejareddy.financetracker.WIDGET_UPDATE"
        const val PREFS_NAME = "FinanceWidgetPrefs"
        const val KEY_SPENT = "today_spent"
        const val KEY_MONTHLY_SPENT = "monthly_spent"
        const val KEY_BUDGET = "monthly_budget"
        const val KEY_CURRENCY = "currency"

        fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
            val prefs        = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val todaySpent   = prefs.getFloat(KEY_SPENT, 0f).toDouble()
            val monthlySpent = prefs.getFloat(KEY_MONTHLY_SPENT, 0f).toDouble()
            val budget       = prefs.getFloat(KEY_BUDGET, 0f).toDouble()
            val currency     = prefs.getString(KEY_CURRENCY, "₹") ?: "₹"

            val views = RemoteViews(context.packageName, R.layout.finance_widget)

            views.setTextViewText(R.id.widget_spent, "$currency${fmt(todaySpent)}")

            if (budget > 0) {
                val remaining = budget - monthlySpent
                val pct = (min(monthlySpent / budget, 1.0) * 100).roundToInt()

                views.setTextViewText(
                    R.id.widget_budget_label,
                    "${currency}${fmt(monthlySpent)} of ${currency}${fmt(budget)} this month"
                )
                views.setViewVisibility(R.id.widget_progress, View.VISIBLE)
                views.setProgressBar(R.id.widget_progress, 100, pct, false)
                views.setViewVisibility(R.id.widget_remaining, View.VISIBLE)

                val remainingText = if (remaining >= 0)
                    "${currency}${fmt(remaining)} left"
                else
                    "${currency}${fmt(-remaining)} over budget"
                views.setTextViewText(R.id.widget_remaining, remainingText)
                // White text for remaining — use green tint when healthy, red when over
                views.setTextColor(
                    R.id.widget_remaining,
                    if (remaining >= 0) Color.parseColor("#FFFFFF")
                    else Color.parseColor("#FF6B6B")
                )
            } else {
                views.setTextViewText(
                    R.id.widget_budget_label,
                    "${currency}${fmt(monthlySpent)} this month"
                )
                views.setViewVisibility(R.id.widget_progress, View.GONE)
                views.setViewVisibility(R.id.widget_remaining, View.GONE)
            }

            val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (launch != null) {
                val pi = android.app.PendingIntent.getActivity(
                    context, 0, launch,
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT or
                            android.app.PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_spent, pi)
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
