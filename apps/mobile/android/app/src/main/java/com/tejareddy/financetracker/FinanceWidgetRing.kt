package com.tejareddy.financetracker

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.*
import android.widget.RemoteViews
import kotlin.math.min
import kotlin.math.roundToInt

class FinanceWidgetRing : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (id in appWidgetIds) {
            updateRingWidget(context, appWidgetManager, id)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == FinanceWidget.ACTION_UPDATE) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(
                ComponentName(context, FinanceWidgetRing::class.java)
            )
            for (id in ids) {
                updateRingWidget(context, manager, id)
            }
        }
    }

    companion object {
        fun updateRingWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
            val prefs        = context.getSharedPreferences(FinanceWidget.PREFS_NAME, Context.MODE_PRIVATE)
            val monthlySpent = prefs.getFloat(FinanceWidget.KEY_MONTHLY_SPENT, 0f).toDouble()
            val budget       = prefs.getFloat(FinanceWidget.KEY_BUDGET, 0f).toDouble()
            val currency     = prefs.getString(FinanceWidget.KEY_CURRENCY, "₹") ?: "₹"

            val pct    = if (budget > 0) min(monthlySpent / budget, 1.0) else 0.0
            val bitmap = drawRing(pct, "$currency${fmt(monthlySpent)}", "${(pct * 100).roundToInt()}%")

            val views = RemoteViews(context.packageName, R.layout.widget_ring)
            views.setImageViewBitmap(R.id.wr_ring, bitmap)

            val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (launch != null) {
                val pi = android.app.PendingIntent.getActivity(
                    context, 0, launch,
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT or
                            android.app.PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.wr_ring, pi)
            }

            manager.updateAppWidget(widgetId, views)
        }

        private fun drawRing(pct: Double, amountText: String, pctText: String): Bitmap {
            val size    = 300
            val bmp     = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
            val canvas  = Canvas(bmp)
            val cx      = size / 2f
            val cy      = size / 2f
            val strokeW = 30f
            val radius  = cx - strokeW - 10f
            val oval    = RectF(cx - radius, cy - radius, cx + radius, cy + radius)

            // Track (30% white)
            val trackPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style       = Paint.Style.STROKE
                strokeWidth = strokeW
                color       = Color.parseColor("#4DFFFFFF")
                strokeCap   = Paint.Cap.ROUND
            }
            canvas.drawArc(oval, -90f, 360f, false, trackPaint)

            // Indigo progress arc
            if (pct > 0.0) {
                val progressPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    style       = Paint.Style.STROKE
                    strokeWidth = strokeW
                    color       = Color.parseColor("#4F46E5")
                    strokeCap   = Paint.Cap.ROUND
                }
                canvas.drawArc(oval, -90f, (pct * 360f).toFloat(), false, progressPaint)
            }

            // Center: "of budget" label (top)
            val labelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color     = Color.parseColor("#80FFFFFF")
                textAlign = Paint.Align.CENTER
                textSize  = 22f
                typeface  = Typeface.DEFAULT
            }

            // Center: amount (middle)
            val amtPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color     = Color.WHITE
                textAlign = Paint.Align.CENTER
                textSize  = 46f
                typeface  = Typeface.create("sans-serif-black", Typeface.NORMAL)
            }

            // Center: % (bottom)
            val pctPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color     = Color.parseColor("#99FFFFFF")
                textAlign = Paint.Align.CENTER
                textSize  = 28f
                typeface  = Typeface.DEFAULT
            }

            val amtBounds = Rect()
            amtPaint.getTextBounds(amountText, 0, amountText.length, amtBounds)
            val lineH = amtBounds.height().toFloat()

            canvas.drawText("of budget", cx, cy - lineH / 2f - 12f, labelPaint)
            canvas.drawText(amountText, cx, cy + lineH / 2f, amtPaint)
            canvas.drawText(pctText, cx, cy + lineH / 2f + 36f, pctPaint)

            return bmp
        }

        private fun fmt(n: Double): String = when {
            n >= 100000 -> String.format("%.1fL", n / 100000)
            n >= 1000   -> String.format("%.1fk", n / 1000)
            else        -> n.roundToInt().toString()
        }
    }
}
