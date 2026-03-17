package com.student.erp

import android.content.Context
import android.os.Build
import android.provider.Settings
import org.json.JSONObject

data class StudentSession(
    val id: String,
    val name: String,
    val rollNo: String,
    val className: String,
    val batch: String,
    val isFirstLogin: Boolean,
    val profileImage: String?,
    val needsSetup: Boolean
) {
    fun toJson(): JSONObject = JSONObject()
        .put("id", id)
        .put("name", name)
        .put("rollNo", rollNo)
        .put("class", className)
        .put("batch", batch)
        .put("isFirstLogin", isFirstLogin)
        .put("profileImage", profileImage)
        .put("needsSetup", needsSetup)

    companion object {
        fun fromJson(json: JSONObject): StudentSession = StudentSession(
            id = json.optString("id"),
            name = json.optString("name"),
            rollNo = json.optString("rollNo"),
            className = json.optString("class"),
            batch = json.optString("batch"),
            isFirstLogin = json.optBoolean("isFirstLogin", false),
            profileImage = json.optString("profileImage").takeIf { it.isNotBlank() },
            needsSetup = json.optBoolean("needsSetup", false)
        )
    }
}

data class AuthState(
    val accessToken: String,
    val refreshToken: String,
    val accessTokenExpiresAtEpochSeconds: Long,
    val student: StudentSession
) {
    fun toJson(): JSONObject = JSONObject()
        .put("accessToken", accessToken)
        .put("refreshToken", refreshToken)
        .put("accessTokenExpiresAtEpochSeconds", accessTokenExpiresAtEpochSeconds)
        .put("student", student.toJson())

    companion object {
        fun fromJson(json: JSONObject): AuthState? {
            val accessToken = json.optString("accessToken")
            val refreshToken = json.optString("refreshToken")
            val expiry = json.optLong("accessTokenExpiresAtEpochSeconds", 0L)
            val studentJson = json.optJSONObject("student") ?: return null

            if (accessToken.isBlank() || refreshToken.isBlank() || expiry <= 0L) {
                return null
            }

            return AuthState(
                accessToken = accessToken,
                refreshToken = refreshToken,
                accessTokenExpiresAtEpochSeconds = expiry,
                student = StudentSession.fromJson(studentJson)
            )
        }
    }
}

data class ServerHealth(
    val status: String,
    val mongodb: String,
    val redis: String?,
    val lastConnectedAt: String?
) {
    val isDatabaseReady: Boolean
        get() = mongodb.equals("connected", ignoreCase = true)

    companion object {
        fun fromJson(json: JSONObject): ServerHealth = ServerHealth(
            status = json.optString("status"),
            mongodb = json.optString("mongodb"),
            redis = json.optString("redis").takeIf { it.isNotBlank() },
            lastConnectedAt = json.optString("lastConnectedAt").takeIf { it.isNotBlank() }
        )
    }
}

data class DevicePayload(
    val platform: String,
    val model: String,
    val manufacturer: String,
    val appVersion: String,
    val deviceId: String,
    val appType: String,
    val packageName: String
) {
    fun toJson(): JSONObject = JSONObject()
        .put("platform", platform)
        .put("model", model)
        .put("manufacturer", manufacturer)
        .put("appVersion", appVersion)
        .put("deviceId", deviceId)
        .put("appType", appType)
        .put("packageName", packageName)

    companion object {
        fun fromContext(context: Context): DevicePayload = DevicePayload(
            platform = "android",
            model = Build.MODEL.orEmpty(),
            manufacturer = Build.MANUFACTURER.orEmpty(),
            appVersion = BuildConfig.VERSION_NAME,
            deviceId = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ANDROID_ID
            )?.orEmpty() ?: Build.FINGERPRINT.orEmpty(),
            appType = "android-native",
            packageName = context.packageName
        )
    }
}
