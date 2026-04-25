package com.droidrun.portal.triggers

import android.content.Context
import com.droidrun.portal.R
import io.mockk.every
import io.mockk.mockk

fun mockTriggerContext(): Context {
    val context = mockk<Context>(relaxed = true)
    val strings = mapOf(
        R.string.required to "Required",
        R.string.enter_zero_or_positive_number to "Enter zero or a positive number",
        R.string.enter_positive_number to "Enter a positive number",
        R.string.enter_battery_level_range to "Enter a battery level between 0 and 100",
        R.string.trigger_choose_delay_longer_than_zero to "Choose a delay longer than zero minutes",
        R.string.trigger_choose_date_and_time to "Choose a date and time",
        R.string.trigger_choose_future_date_time to "Choose a future date and time",
        R.string.trigger_choose_recurring_time to "Choose a recurring time",
        R.string.trigger_choose_weekday to "Choose at least one weekday",
        R.string.trigger_source_desc_time_delay to "Run once after the selected delay.",
        R.string.trigger_source_desc_time_absolute to "Run once at the selected date and time.",
        R.string.trigger_source_desc_time_daily to "Run every day at the selected time.",
        R.string.trigger_source_desc_time_weekly to "Run on the selected weekdays at the selected time.",
        R.string.trigger_source_desc_notification_posted to "Run when a matching notification appears.",
        R.string.trigger_source_desc_notification_removed to "Run when a matching notification is dismissed or disappears.",
        R.string.trigger_source_desc_app_entered to "Run when the selected app comes to the foreground.",
        R.string.trigger_source_desc_app_exited to "Run when the selected app leaves the foreground.",
        R.string.trigger_source_desc_battery_low to "Run when Android reports that the battery is low.",
        R.string.trigger_source_desc_battery_okay to "Run when Android reports that the battery is okay again.",
        R.string.trigger_source_desc_battery_level_changed to "Run when the battery level crosses the selected threshold.",
        R.string.trigger_source_desc_power_connected to "Run when charging starts.",
        R.string.trigger_source_desc_power_disconnected to "Run when charging stops.",
        R.string.trigger_source_desc_user_present to "Run when the device is unlocked and the user becomes active.",
        R.string.trigger_source_desc_network_connected to "Run when the device gains network connectivity.",
        R.string.trigger_source_desc_network_type_changed to "Run when the connection type changes, such as Wi-Fi to cellular.",
        R.string.trigger_source_desc_sms_received to "Run when a matching SMS arrives.",
    )

    every { context.getString(any()) } answers {
        strings[firstArg<Int>()] ?: "res-${firstArg<Int>()}"
    }
    every { context.applicationContext } returns context

    return context
}
