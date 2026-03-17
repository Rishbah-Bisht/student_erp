package com.student.erp

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.net.http.SslError
import android.os.Bundle
import android.os.Message
import android.view.View
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.SslErrorHandler
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebStorage
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.google.android.material.progressindicator.LinearProgressIndicator
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException

class WebViewActivity : AppCompatActivity() {
    private val authRepository by lazy { AppContainer.authRepository(applicationContext) }

    private lateinit var portalWebView: WebView
    private lateinit var webProgress: LinearProgressIndicator

    private var currentSession: AuthState? = null
    private var initialLoadComplete = false
    private var logoutInProgress = false
    private var refreshJob: Job? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        setContentView(R.layout.activity_webview)

        portalWebView = findViewById(R.id.portalWebView)
        webProgress = findViewById(R.id.webProgress)

        configureWebView()

        lifecycleScope.launch {
            bootstrapWebView(validateWithServer = true)
        }
    }

    override fun onResume() {
        super.onResume()
        if (!initialLoadComplete) {
            return
        }
        lifecycleScope.launch {
            bootstrapWebView(validateWithServer = false)
        }
    }

    override fun onDestroy() {
        refreshJob?.cancel()
        portalWebView.removeJavascriptInterface("NativeAuth")
        portalWebView.destroy()
        super.onDestroy()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        if (WebViewFeature.isFeatureSupported(WebViewFeature.START_SAFE_BROWSING)) {
            WebViewCompat.startSafeBrowsing(this) { }
        }

        CookieManager.getInstance().setAcceptCookie(false)
        CookieManager.getInstance().setAcceptThirdPartyCookies(portalWebView, false)

        portalWebView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            allowContentAccess = false
            allowFileAccess = false
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            userAgentString = "$userAgentString StudentPortalNative/${BuildConfig.VERSION_NAME}"
        }

        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

        // Only our trusted portal origin is allowed to load, which keeps this bridge scoped to first-party content.
        portalWebView.addJavascriptInterface(NativeAuthBridge(), "NativeAuth")
        portalWebView.webChromeClient = object : android.webkit.WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                webProgress.visibility = if (newProgress in 1..99) View.VISIBLE else View.GONE
                webProgress.progress = newProgress
            }

            override fun onCreateWindow(
                view: WebView?,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: Message?
            ): Boolean {
                return false
            }
        }

        portalWebView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val targetUri = request.url
                return if (isTrustedUri(targetUri)) {
                    val session = currentSession
                    if (session != null) {
                        view.loadUrl(targetUri.toString(), buildAuthHeaders(session))
                    } else {
                        handleSessionLoss("session_expired")
                    }
                    true
                } else {
                    startActivity(Intent(Intent.ACTION_VIEW, targetUri))
                    Toast.makeText(
                        this@WebViewActivity,
                        getString(R.string.error_untrusted_host),
                        Toast.LENGTH_SHORT
                    ).show()
                    true
                }
            }

            override fun onPageFinished(view: WebView, url: String) {
                currentSession?.let { injectRuntimeAuth(it) }
            }

            override fun onReceivedSslError(
                view: WebView,
                handler: SslErrorHandler,
                error: SslError
            ) {
                handler.cancel()
                Toast.makeText(
                    this@WebViewActivity,
                    getString(R.string.error_secure_connection),
                    Toast.LENGTH_LONG
                ).show()
            }

            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: WebResourceError
            ) {
                if (request.isForMainFrame) {
                    Toast.makeText(
                        this@WebViewActivity,
                        getString(R.string.error_portal_load),
                        Toast.LENGTH_LONG
                    ).show()
                }
            }

            override fun onRenderProcessGone(view: WebView, detail: android.webkit.RenderProcessGoneDetail): Boolean {
                handleSessionLoss("session_expired")
                return true
            }
        }
    }

    private suspend fun bootstrapWebView(validateWithServer: Boolean) {
        val cachedSession = authRepository.loadCachedSession()
        val canValidateWithServer = if (validateWithServer) {
            authRepository.waitForServerReady()
        } else {
            false
        }

        if (validateWithServer && !canValidateWithServer) {
            cachedSession
                ?.takeIf { authRepository.isTokenLocallyValid(it.accessToken) }
                ?.let { session ->
                    showTransientError(getString(R.string.error_server_starting))
                    applySession(session)
                    return
                }

            showTransientError(getString(R.string.error_server_starting))
            return
        }

        val session = try {
            authRepository.ensureValidSession(validateWithServer = canValidateWithServer)
        } catch (_: IOException) {
            val cached = authRepository.loadCachedSession()
            if (cached != null && authRepository.isTokenLocallyValid(cached.accessToken, 0L)) {
                cached
            } else {
                null
            }
        }

        if (session == null) {
            handleSessionLoss("session_expired")
            return
        }

        applySession(session)
    }

    private fun scheduleRefresh(session: AuthState) {
        refreshJob?.cancel()

        val refreshDelayMs = ((session.accessTokenExpiresAtEpochSeconds - 60L) * 1000L - System.currentTimeMillis())
            .coerceAtLeast(5_000L)

        refreshJob = lifecycleScope.launch {
            delay(refreshDelayMs)
            try {
                val refreshed = authRepository.ensureValidSession(forceRefresh = true)
                if (refreshed == null) {
                    handleSessionLoss("session_expired")
                    return@launch
                }

                currentSession = refreshed
                injectRuntimeAuth(refreshed)
                scheduleRefresh(refreshed)
            } catch (_: IOException) {
                currentSession?.let { scheduleRefresh(it) }
            }
        }
    }

    private fun applySession(session: AuthState) {
        currentSession = session
        scheduleRefresh(session)

        if (!initialLoadComplete) {
            portalWebView.loadUrl(BuildConfig.WEB_BASE_URL, buildAuthHeaders(session))
            initialLoadComplete = true
        } else {
            injectRuntimeAuth(session)
        }
    }

    private fun buildAuthHeaders(session: AuthState): Map<String, String> = mapOf(
        "Authorization" to "Bearer ${session.accessToken}",
        "X-Native-App" to "android"
    )

    private fun isTrustedUri(uri: Uri): Boolean {
        val trustedPortal = Uri.parse(BuildConfig.WEB_BASE_URL)
        return uri.scheme == trustedPortal.scheme &&
            uri.host == trustedPortal.host &&
            uri.port == trustedPortal.port
    }

    private fun injectRuntimeAuth(session: AuthState) {
        val payload = buildBootstrapPayload(session)
        val script = """
            (function() {
              var payload = JSON.parse(${JSONObject.quote(payload.toString())});
              window.__NATIVE_AUTH_BOOTSTRAP__ = payload;
              if (typeof window.__NATIVE_AUTH_SYNC__ === 'function') {
                window.__NATIVE_AUTH_SYNC__(payload);
              }
              if (window.__NATIVE_FETCH_PATCHED__) {
                return;
              }
              var allowedOrigins = new Set((payload.allowedOrigins || []).filter(Boolean));
              function shouldAttach(urlValue) {
                try {
                  var resolved = new URL(urlValue, window.location.href);
                  return allowedOrigins.has(resolved.origin);
                } catch (error) {
                  return false;
                }
              }
              function currentToken() {
                return window.__NATIVE_AUTH_BOOTSTRAP__ && window.__NATIVE_AUTH_BOOTSTRAP__.accessToken;
              }
              var originalFetch = window.fetch.bind(window);
              window.fetch = function(input, init) {
                var requestUrl = typeof input === 'string' ? input : input && input.url;
                if (!requestUrl || !shouldAttach(requestUrl) || !currentToken()) {
                  return originalFetch(input, init);
                }
                var headers = new Headers((init && init.headers) || (input instanceof Request ? input.headers : undefined));
                headers.set('Authorization', 'Bearer ' + currentToken());
                headers.set('X-Native-App', 'android');
                if (input instanceof Request) {
                  return originalFetch(new Request(input, Object.assign({}, init || {}, { headers: headers })));
                }
                return originalFetch(input, Object.assign({}, init || {}, { headers: headers }));
              };
              var originalOpen = XMLHttpRequest.prototype.open;
              var originalSend = XMLHttpRequest.prototype.send;
              XMLHttpRequest.prototype.open = function(method, url) {
                this.__nativeAuthUrl = url;
                return originalOpen.apply(this, arguments);
              };
              XMLHttpRequest.prototype.send = function(body) {
                if (this.__nativeAuthUrl && shouldAttach(this.__nativeAuthUrl) && currentToken()) {
                  try {
                    this.setRequestHeader('Authorization', 'Bearer ' + currentToken());
                    this.setRequestHeader('X-Native-App', 'android');
                  } catch (error) {}
                }
                return originalSend.call(this, body);
              };
              window.__NATIVE_FETCH_PATCHED__ = true;
            })();
        """.trimIndent()

        portalWebView.evaluateJavascript(script, null)
    }

    private fun buildBootstrapPayload(session: AuthState): JSONObject = JSONObject()
        .put("isNativeShell", true)
        .put("accessToken", session.accessToken)
        .put("student", session.student.toJson())
        .put(
            "allowedOrigins",
            JSONArray().apply {
                put(originOf(BuildConfig.WEB_BASE_URL))
                put(originOf(BuildConfig.API_BASE_URL))
            }
        )

    private fun clearWebViewData() {
        portalWebView.stopLoading()
        portalWebView.loadUrl("about:blank")
        portalWebView.clearHistory()
        portalWebView.clearCache(true)
        WebStorage.getInstance().deleteAllData()
        CookieManager.getInstance().removeAllCookies(null)
        CookieManager.getInstance().flush()
    }

    private fun showTransientError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    private fun handleSessionLoss(reason: String) {
        if (logoutInProgress) {
            return
        }

        logoutInProgress = true
        refreshJob?.cancel()

        lifecycleScope.launch {
            authRepository.logout()
            clearWebViewData()
            startActivity(LoginActivity.createIntent(this@WebViewActivity, normalizeReason(reason)))
            finish()
        }
    }

    private fun normalizeReason(reason: String): String {
        return reason.trim().lowercase().replace('-', '_')
    }

    private fun originOf(url: String): String = Uri.parse(url).let { uri ->
        "${uri.scheme}://${uri.host}${if (uri.port != -1) ":${uri.port}" else ""}"
    }

    private inner class NativeAuthBridge {
        @JavascriptInterface
        fun getBootstrap(): String {
            val session = currentSession ?: return "{}"
            return buildBootstrapPayload(session).toString()
        }

        @JavascriptInterface
        fun logout(reason: String?) {
            runOnUiThread {
                handleSessionLoss(reason?.takeIf { it.isNotBlank() } ?: "session_expired")
            }
        }
    }

    companion object {
        fun createIntent(context: Context): Intent = Intent(context, WebViewActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
    }
}
