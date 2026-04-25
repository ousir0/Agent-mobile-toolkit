package com.droidrun.portal.ui

import android.content.Context
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import com.droidrun.portal.R
import com.droidrun.portal.config.ConfigManager

object PortalLocaleManager {
    const val LANGUAGE_SYSTEM = ""
    const val LANGUAGE_ZH_CN = "zh-CN"
    const val LANGUAGE_EN = "en"

    fun applySavedLocale(context: Context) {
        val languageTag = ConfigManager.getInstance(context).appLanguageTag
        val locales = if (languageTag.isBlank()) {
            LocaleListCompat.getEmptyLocaleList()
        } else {
            LocaleListCompat.forLanguageTags(languageTag)
        }
        AppCompatDelegate.setApplicationLocales(locales)
    }

    fun updateLocale(context: Context, languageTag: String) {
        ConfigManager.getInstance(context).appLanguageTag = languageTag
        applySavedLocale(context)
    }

    fun currentLanguageTag(context: Context): String {
        return ConfigManager.getInstance(context).appLanguageTag
    }

    fun languageLabel(context: Context, languageTag: String): String {
        return when (languageTag) {
            LANGUAGE_ZH_CN -> context.getString(R.string.language_option_zh_cn)
            LANGUAGE_EN -> context.getString(R.string.language_option_en)
            else -> context.getString(R.string.language_option_system)
        }
    }
}
