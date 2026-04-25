package com.droidrun.portal.triggers

import android.content.Context
import com.droidrun.portal.R

object TriggerRuleValidator {
    enum class Field {
        NAME,
        PROMPT_TEMPLATE,
        COOLDOWN_SECONDS,
        THRESHOLD_VALUE,
        DELAY_MINUTES,
        ABSOLUTE_TIME,
        RECURRING_TIME,
        WEEKLY_DAYS,
        MAX_LAUNCH_COUNT,
    }

    data class Issue(
        val field: Field,
        val message: String,
    )

    data class Result(
        val rule: TriggerRule?,
        val issues: List<Issue>,
    ) {
        val isValid: Boolean
            get() = rule != null && issues.isEmpty()

        fun firstIssueFor(field: Field): Issue? = issues.firstOrNull { it.field == field }

        fun firstMessage(): String? = issues.firstOrNull()?.message
    }

    fun validateForSave(
        context: Context,
        rule: TriggerRule,
        nowMs: Long = System.currentTimeMillis(),
    ): Result {
        val capabilities = TriggerEditorSupport.capabilitiesFor(rule.source)
        val trimmedName = rule.name.trim()
        val trimmedPromptTemplate = rule.promptTemplate.trim()
        val preparedRule = rule.copy(
            name = trimmedName,
            promptTemplate = trimmedPromptTemplate,
        )
        val issues = mutableListOf<Issue>()

        if (trimmedName.isBlank()) {
            issues += Issue(Field.NAME, context.getString(R.string.required))
        }
        if (trimmedPromptTemplate.isBlank()) {
            issues += Issue(Field.PROMPT_TEMPLATE, context.getString(R.string.required))
        }
        if (capabilities.supportsCooldown && rule.cooldownSeconds < 0) {
            issues += Issue(Field.COOLDOWN_SECONDS, context.getString(R.string.enter_zero_or_positive_number))
        }
        if (capabilities.supportsRunLimit && rule.maxLaunchCount != null && rule.maxLaunchCount <= 0) {
            issues += Issue(Field.MAX_LAUNCH_COUNT, context.getString(R.string.enter_positive_number))
        }

        when (preparedRule.source) {
            TriggerSource.BATTERY_LEVEL_CHANGED -> {
                if (preparedRule.thresholdValue == null || preparedRule.thresholdValue !in 0..100) {
                    issues += Issue(Field.THRESHOLD_VALUE, context.getString(R.string.enter_battery_level_range))
                }
            }

            TriggerSource.TIME_DELAY -> {
                if (preparedRule.delayMinutes == null || preparedRule.delayMinutes <= 0) {
                    issues += Issue(Field.DELAY_MINUTES, context.getString(R.string.trigger_choose_delay_longer_than_zero))
                }
            }

            TriggerSource.TIME_ABSOLUTE -> {
                when {
                    preparedRule.absoluteTimeMillis == null ->
                        issues += Issue(Field.ABSOLUTE_TIME, context.getString(R.string.trigger_choose_date_and_time))

                    preparedRule.absoluteTimeMillis <= nowMs ->
                        issues += Issue(Field.ABSOLUTE_TIME, context.getString(R.string.trigger_choose_future_date_time))
                }
            }

            TriggerSource.TIME_DAILY,
            TriggerSource.TIME_WEEKLY,
            -> {
                if (preparedRule.dailyHour == null || preparedRule.dailyMinute == null) {
                    issues += Issue(Field.RECURRING_TIME, context.getString(R.string.trigger_choose_recurring_time))
                }
                if (
                    preparedRule.source == TriggerSource.TIME_WEEKLY &&
                    preparedRule.resolvedWeeklyDaysOfWeek().isEmpty()
                ) {
                    issues += Issue(Field.WEEKLY_DAYS, context.getString(R.string.trigger_choose_weekday))
                }
            }

            else -> Unit
        }

        return if (issues.isEmpty()) {
            Result(TriggerEditorSupport.sanitize(preparedRule), emptyList())
        } else {
            Result(null, issues)
        }
    }
}
