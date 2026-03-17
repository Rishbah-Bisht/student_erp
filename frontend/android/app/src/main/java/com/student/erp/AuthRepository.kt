package com.student.erp

import android.content.Context
import kotlinx.coroutines.delay
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.io.IOException

class AuthRepository(
    context: Context,
    private val api: AuthApi,
    private val secureTokenStore: SecureTokenStore
) {
    private val appContext = context.applicationContext
    private val refreshMutex = Mutex()

    suspend fun login(rollNo: String, password: String): AuthState {
        val session = api.login(rollNo, password, DevicePayload.fromContext(appContext))
        secureTokenStore.write(session)
        return session
    }

    fun loadCachedSession(): AuthState? = secureTokenStore.read()

    suspend fun ensureValidSession(
        validateWithServer: Boolean = false,
        forceRefresh: Boolean = false
    ): AuthState? = refreshMutex.withLock {
        val cached = secureTokenStore.read() ?: return@withLock null

        if (forceRefresh || !isTokenLocallyValid(cached.accessToken, 60L)) {
            return@withLock refreshOrInvalidate(cached)
        }

        if (!validateWithServer) {
            return@withLock cached
        }

        return@withLock try {
            val student = api.session(cached.accessToken)
            val updated = cached.copy(student = student)
            secureTokenStore.write(updated)
            updated
        } catch (error: ApiException) {
            when {
                isHardAuthFailure(error) -> refreshOrInvalidate(cached)
                isDatabaseUnavailable(error) -> cached
                else -> cached
            }
        } catch (_: IOException) {
            cached
        }
    }

    suspend fun waitForServerReady(maxRetries: Int = 3, delayMs: Long = 1_500L): Boolean {
        repeat(maxRetries) { attempt ->
            try {
                val health = api.getHealthStatus()
                if (health.isDatabaseReady) {
                    return true
                }
            } catch (_: IOException) {
                // The caller treats readiness checks as best-effort and falls back to local token checks.
            }

            if (attempt < maxRetries - 1) {
                delay(delayMs)
            }
        }

        return false
    }

    fun isTokenLocallyValid(token: String, skewSeconds: Long = 30L): Boolean {
        return !JwtUtils.isExpired(token, skewSeconds)
    }

    suspend fun logout() {
        val cached = secureTokenStore.read()

        try {
            if (cached?.refreshToken?.isNotBlank() == true) {
                api.logout(cached.refreshToken)
            }
        } catch (_: Exception) {
            // Logout is best-effort server-side; local credentials are still wiped below.
        } finally {
            secureTokenStore.clear()
        }
    }

    suspend fun refreshOrInvalidate(cached: AuthState): AuthState? = try {
        val refreshed = api.refresh(cached.refreshToken, DevicePayload.fromContext(appContext))
        secureTokenStore.write(refreshed)
        refreshed
    } catch (error: ApiException) {
        if (isHardAuthFailure(error)) {
            secureTokenStore.clear()
            null
        } else if (isDatabaseUnavailable(error) || isTokenLocallyValid(cached.accessToken, 0L)) {
            cached
        } else {
            throw error
        }
    } catch (error: IOException) {
        if (isTokenLocallyValid(cached.accessToken, 0L)) {
            cached
        } else {
            throw error
        }
    }

    private fun isHardAuthFailure(error: ApiException): Boolean {
        return error.statusCode == 401 && !isDatabaseUnavailable(error)
    }

    private fun isDatabaseUnavailable(error: ApiException): Boolean {
        return error.statusCode == 503 || normalizedReason(error.reason) == "db_unavailable"
    }

    private fun normalizedReason(reason: String?): String? {
        return reason
            ?.trim()
            ?.lowercase()
            ?.replace('-', '_')
            ?.takeIf { it.isNotBlank() }
    }
}
