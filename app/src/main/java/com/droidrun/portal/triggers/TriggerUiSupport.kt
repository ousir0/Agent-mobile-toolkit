package com.droidrun.portal.triggers

import android.content.Context
import com.droidrun.portal.R
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object TriggerUiSupport {
    private val timestampFormatter = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US)

    fun sourceLabel(context: Context, source: TriggerSource): String {
        return when (source) {
            TriggerSource.TIME_DELAY -> context.getString(R.string.trigger_source_time_delay)
            TriggerSource.TIME_ABSOLUTE -> context.getString(R.string.trigger_source_time_absolute)
            TriggerSource.TIME_DAILY -> context.getString(R.string.trigger_source_time_daily)
            TriggerSource.TIME_WEEKLY -> context.getString(R.string.trigger_source_time_weekly)
            TriggerSource.NOTIFICATION_POSTED -> context.getString(R.string.trigger_source_notification_posted)
            TriggerSource.NOTIFICATION_REMOVED -> context.getString(R.string.trigger_source_notification_removed)
            TriggerSource.APP_ENTERED -> context.getString(R.string.trigger_source_app_entered)
            TriggerSource.APP_EXITED -> context.getString(R.string.trigger_source_app_exited)
            TriggerSource.BATTERY_LOW -> context.getString(R.string.trigger_source_battery_low)
            TriggerSource.BATTERY_OKAY -> context.getString(R.string.trigger_source_battery_okay)
            TriggerSource.BATTERY_LEVEL_CHANGED -> context.getString(R.string.trigger_source_battery_level_changed)
            TriggerSource.POWER_CONNECTED -> context.getString(R.string.trigger_source_power_connected)
            TriggerSource.POWER_DISCONNECTED -> context.getString(R.string.trigger_source_power_disconnected)
            TriggerSource.USER_PRESENT -> context.getString(R.string.trigger_source_user_present)
            TriggerSource.NETWORK_CONNECTED -> context.getString(R.string.trigger_source_network_connected)
            TriggerSource.NETWORK_TYPE_CHANGED -> context.getString(R.string.trigger_source_network_type_changed)
            TriggerSource.SMS_RECEIVED -> context.getString(R.string.trigger_source_sms_received)
        }
    }

    fun sourceDescription(context: Context, source: TriggerSource): String {
        return when (source) {
            TriggerSource.TIME_DELAY -> context.getString(R.string.trigger_source_desc_time_delay)
            TriggerSource.TIME_ABSOLUTE -> context.getString(R.string.trigger_source_desc_time_absolute)
            TriggerSource.TIME_DAILY -> context.getString(R.string.trigger_source_desc_time_daily)
            TriggerSource.TIME_WEEKLY -> context.getString(R.string.trigger_source_desc_time_weekly)
            TriggerSource.NOTIFICATION_POSTED -> context.getString(R.string.trigger_source_desc_notification_posted)
            TriggerSource.NOTIFICATION_REMOVED -> context.getString(R.string.trigger_source_desc_notification_removed)
            TriggerSource.APP_ENTERED -> context.getString(R.string.trigger_source_desc_app_entered)
            TriggerSource.APP_EXITED -> context.getString(R.string.trigger_source_desc_app_exited)
            TriggerSource.BATTERY_LOW -> context.getString(R.string.trigger_source_desc_battery_low)
            TriggerSource.BATTERY_OKAY -> context.getString(R.string.trigger_source_desc_battery_okay)
            TriggerSource.BATTERY_LEVEL_CHANGED -> context.getString(R.string.trigger_source_desc_battery_level_changed)
            TriggerSource.POWER_CONNECTED -> context.getString(R.string.trigger_source_desc_power_connected)
            TriggerSource.POWER_DISCONNECTED -> context.getString(R.string.trigger_source_desc_power_disconnected)
            TriggerSource.USER_PRESENT -> context.getString(R.string.trigger_source_desc_user_present)
            TriggerSource.NETWORK_CONNECTED -> context.getString(R.string.trigger_source_desc_network_connected)
            TriggerSource.NETWORK_TYPE_CHANGED -> context.getString(R.string.trigger_source_desc_network_type_changed)
            TriggerSource.SMS_RECEIVED -> context.getString(R.string.trigger_source_desc_sms_received)
        }
    }

    fun summary(context: Context, rule: TriggerRule): String {
        return buildList {
            add(sourceLabel(context, rule.source))
            rule.packageName?.takeIf { it.isNotBlank() }?.let { add(context.getString(R.string.trigger_summary_pkg, it)) }
            rule.titleFilter?.takeIf { it.isNotBlank() }?.let { add(context.getString(R.string.trigger_summary_title, it)) }
            rule.textFilter?.takeIf { it.isNotBlank() }?.let { add(context.getString(R.string.trigger_summary_text, it)) }
            rule.networkType?.let { add(context.getString(R.string.trigger_summary_network, networkTypeLabel(context, it))) }
            rule.thresholdValue?.let {
                add(
                    context.getString(
                        R.string.trigger_summary_threshold,
                        thresholdComparisonLabel(context, rule.thresholdComparison),
                        it,
                    ),
                )
            }
            rule.phoneNumberFilter?.takeIf { it.isNotBlank() }?.let { add(context.getString(R.string.trigger_summary_phone, it)) }
            rule.delayMinutes?.let { add(context.getString(R.string.trigger_summary_delay, it)) }
            if (rule.source == TriggerSource.TIME_ABSOLUTE) {
                rule.absoluteTimeMillis?.let { add(context.getString(R.string.trigger_summary_at, formatTimestamp(it))) }
            }
            if (rule.source == TriggerSource.TIME_DAILY || rule.source == TriggerSource.TIME_WEEKLY) {
                val hour = rule.dailyHour ?: 0
                val minute = rule.dailyMinute ?: 0
                add(String.format(Locale.US, "%02d:%02d", hour, minute))
                if (rule.source == TriggerSource.TIME_WEEKLY) {
                    val labels = rule.resolvedWeeklyDaysOfWeek()
                        .mapNotNull { dayOfWeekLabel(context, it) }
                    if (labels.isNotEmpty()) {
                        add(context.getString(R.string.trigger_summary_weekdays, labels.joinToString(", ")))
                    }
                }
            }
        }.joinToString(" • ")
    }

    fun dispositionLabel(context: Context, disposition: TriggerRunDisposition): String {
        return when (disposition) {
            TriggerRunDisposition.MATCHED -> context.getString(R.string.trigger_disposition_matched)
            TriggerRunDisposition.LAUNCHED -> context.getString(R.string.trigger_disposition_launched)
            TriggerRunDisposition.SKIPPED_BUSY -> context.getString(R.string.trigger_disposition_skipped_busy)
            TriggerRunDisposition.PERMISSION_MISSING -> context.getString(R.string.trigger_disposition_permission_missing)
            TriggerRunDisposition.LAUNCH_FAILED -> context.getString(R.string.trigger_disposition_launch_failed)
            TriggerRunDisposition.RULE_DISABLED -> context.getString(R.string.trigger_disposition_rule_disabled)
            TriggerRunDisposition.TEST_LAUNCHED -> context.getString(R.string.trigger_disposition_test_launched)
        }
    }

    fun formatTimestamp(timestampMs: Long): String {
        return timestampFormatter.format(Date(timestampMs))
    }

    fun dayOfWeekEntries(context: Context): List<Pair<String, Int>> {
        return listOf(
            context.getString(R.string.weekday_sunday) to java.util.Calendar.SUNDAY,
            context.getString(R.string.weekday_monday) to java.util.Calendar.MONDAY,
            context.getString(R.string.weekday_tuesday) to java.util.Calendar.TUESDAY,
            context.getString(R.string.weekday_wednesday) to java.util.Calendar.WEDNESDAY,
            context.getString(R.string.weekday_thursday) to java.util.Calendar.THURSDAY,
            context.getString(R.string.weekday_friday) to java.util.Calendar.FRIDAY,
            context.getString(R.string.weekday_saturday) to java.util.Calendar.SATURDAY,
        )
    }

    fun dayOfWeekLabel(context: Context, dayOfWeek: Int): String? {
        return dayOfWeekEntries(context).firstOrNull { it.second == dayOfWeek }?.first
    }

    fun matchModeLabel(context: Context, mode: TriggerStringMatchMode): String {
        return when (mode) {
            TriggerStringMatchMode.CONTAINS -> context.getString(R.string.trigger_match_mode_contains)
            TriggerStringMatchMode.REGEX -> context.getString(R.string.trigger_match_mode_regex)
        }
    }

    fun thresholdComparisonLabel(context: Context, comparison: TriggerThresholdComparison): String {
        return when (comparison) {
            TriggerThresholdComparison.AT_OR_BELOW -> context.getString(R.string.trigger_threshold_at_or_below)
            TriggerThresholdComparison.AT_OR_ABOVE -> context.getString(R.string.trigger_threshold_at_or_above)
        }
    }

    fun networkTypeLabel(context: Context, type: TriggerNetworkType): String {
        return when (type) {
            TriggerNetworkType.NONE -> context.getString(R.string.trigger_network_none)
            TriggerNetworkType.WIFI -> context.getString(R.string.trigger_network_wifi)
            TriggerNetworkType.CELLULAR -> context.getString(R.string.trigger_network_cellular)
            TriggerNetworkType.ETHERNET -> context.getString(R.string.trigger_network_ethernet)
            TriggerNetworkType.OTHER -> context.getString(R.string.trigger_network_other)
        }
    }
}
