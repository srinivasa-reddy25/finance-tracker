package com.tejareddy.financetracker

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class FinanceWidgetQuickAdd : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (id in appWidgetIds) {
            updateQuickAddWidget(context, appWidgetManager, id)
        }
    }

    companion object {
        const val KEY_PENDING_CATEGORY = "pending_category"

        fun updateQuickAddWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_quick_add)

            views.setOnClickPendingIntent(R.id.qa_food,     makeCategoryIntent(context, "food",      1))
            views.setOnClickPendingIntent(R.id.qa_transport, makeCategoryIntent(context, "transport", 2))
            views.setOnClickPendingIntent(R.id.qa_shopping, makeCategoryIntent(context, "shopping",  3))
            views.setOnClickPendingIntent(R.id.qa_bills,    makeCategoryIntent(context, "bills",     4))

            manager.updateAppWidget(widgetId, views)
        }

        private fun makeCategoryIntent(context: Context, category: String, requestCode: Int): PendingIntent {
            // Write the pending category to SharedPreferences before launching the app.
            // MainActivity reads this on onCreate/onNewIntent and clears it.
            val prefs = context.getSharedPreferences(FinanceWidget.PREFS_NAME, Context.MODE_PRIVATE)
            // We write at click time via the activity's onNewIntent by passing it as an extra.
            val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
                ?: Intent(context, MainActivity::class.java)
            launch.putExtra(KEY_PENDING_CATEGORY, category)
            launch.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
            return PendingIntent.getActivity(
                context,
                requestCode,
                launch,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }

        fun bindAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, FinanceWidgetQuickAdd::class.java))
            for (id in ids) updateQuickAddWidget(context, manager, id)
        }
    }
}
