package com.student.erp

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class ApiException(
    val statusCode: Int,
    val reason: String?,
    override val message: String
) : IOException(message)

class AuthApi {
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()
    private val baseUrl = BuildConfig.API_BASE_URL.trimEnd('/') + "/"

    private val client: OkHttpClient by lazy {
        val builder = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(20, TimeUnit.SECONDS)

        if (BuildConfig.DEBUG) {
            builder.addInterceptor(
                HttpLoggingInterceptor().apply {
                    level = HttpLoggingInterceptor.Level.BASIC
                }
            )
        }

        builder.build()
    }

    suspend fun login(rollNo: String, password: String, devicePayload: DevicePayload): AuthState {
        val body = devicePayload.toJson()
            .put("rollNo", rollNo)
            .put("password", password)
        return parseAuthState(postJson("student/mobile/login", body))
    }

    suspend fun refresh(refreshToken: String, devicePayload: DevicePayload): AuthState {
        val body = devicePayload.toJson()
            .put("refreshToken", refreshToken)
        return parseAuthState(postJson("student/mobile/refresh", body))
    }

    suspend fun logout(refreshToken: String) {
        postJson(
            path = "student/mobile/logout",
            body = JSONObject().put("refreshToken", refreshToken)
        )
    }

    suspend fun getHealthStatus(): ServerHealth {
        val json = executeJson(
            Request.Builder()
                .url(baseUrl + "health")
                .get()
                .build()
        )

        return ServerHealth.fromJson(json)
    }

    suspend fun session(accessToken: String): StudentSession {
        val json = executeJson(
            Request.Builder()
                .url(baseUrl + "student/mobile/session")
                .header("Authorization", "Bearer $accessToken")
                .get()
                .build()
        )

        return StudentSession.fromJson(json.getJSONObject("student"))
    }

    private suspend fun postJson(path: String, body: JSONObject): JSONObject = executeJson(
        Request.Builder()
            .url(baseUrl + path)
            .header("Content-Type", "application/json")
            .post(body.toString().toRequestBody(jsonMediaType))
            .build()
    )

    private suspend fun executeJson(request: Request): JSONObject = withContext(Dispatchers.IO) {
        client.newCall(request).execute().use { response ->
            val rawBody = response.body?.string().orEmpty()
            val jsonBody = parseJson(rawBody)

            if (!response.isSuccessful) {
                val message = jsonBody.optString("message")
                    .takeIf { it.isNotBlank() }
                    ?: rawBody.takeIf { it.isNotBlank() }
                    ?: "Request failed with status ${response.code}"
                val reason = jsonBody.optString("error")
                    .takeIf { it.isNotBlank() }
                    ?: jsonBody.optString("reason").takeIf { it.isNotBlank() }
                throw ApiException(response.code, reason = reason, message = message)
            }

            jsonBody
        }
    }

    private fun parseJson(rawBody: String): JSONObject {
        if (rawBody.isBlank()) {
            return JSONObject()
        }

        return try {
            JSONObject(rawBody)
        } catch (_: Exception) {
            JSONObject().put("message", rawBody)
        }
    }

    private fun parseAuthState(json: JSONObject): AuthState {
        val accessToken = json.optString("accessToken").ifBlank { json.optString("token") }
        val refreshToken = json.optString("refreshToken")
        val student = StudentSession.fromJson(json.getJSONObject("student"))
        val expiry = JwtUtils.getExpiryEpochSeconds(accessToken)
            ?: throw IOException("Access token is missing an expiry.")

        return AuthState(
            accessToken = accessToken,
            refreshToken = refreshToken,
            accessTokenExpiresAtEpochSeconds = expiry,
            student = student
        )
    }
}
