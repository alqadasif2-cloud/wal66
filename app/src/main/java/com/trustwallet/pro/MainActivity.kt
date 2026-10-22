package com.trustwallet.pro

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import java.io.InputStream

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private val TAG = "TrustWalletPro"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Setup AssetLoader to securely serve local bundled assets from inside APK
        // Configured with appassets.androidplatform.net domain
        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            // Dark background matching Trust Wallet theme (#070b13)
            // Eliminates white flashing on app launch
            setBackgroundColor(Color.parseColor("#070b13"))

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true // Required for localStorage / WalletDatabase
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                cacheMode = WebSettings.LOAD_DEFAULT
                useWideViewPort = true
                loadWithOverviewMode = true
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                loadsImagesAutomatically = true
            }

            // Enable Chrome inspect debugging for development & diagnosis
            WebView.setWebContentsDebuggingEnabled(true)

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? {
                    val url = request.url

                    // 1. Try standard WebViewAssetLoader first
                    val intercepted = assetLoader.shouldInterceptRequest(url)
                    if (intercepted != null) {
                        return intercepted
                    }

                    // 2. Fallback direct resolver for assets on appassets.androidplatform.net
                    if (url.host == "appassets.androidplatform.net") {
                        val path = url.path ?: ""
                        
                        // Clean path candidates to locate the resource inside assets directory
                        val candidates = listOf(
                            path.trimStart('/'),
                            path.removePrefix("/assets/").trimStart('/'),
                            path.removePrefix("/dist/").trimStart('/'),
                            "dist/" + path.removePrefix("/assets/").trimStart('/'),
                            "dist/" + path.trimStart('/')
                        ).filter { it.isNotEmpty() }

                        for (candidate in candidates) {
                            try {
                                val stream: InputStream = assets.open(candidate)
                                val mimeType = when {
                                    candidate.endsWith(".html") -> "text/html"
                                    candidate.endsWith(".js") -> "application/javascript"
                                    candidate.endsWith(".css") -> "text/css"
                                    candidate.endsWith(".json") -> "application/json"
                                    candidate.endsWith(".png") -> "image/png"
                                    candidate.endsWith(".jpg") || candidate.endsWith(".jpeg") -> "image/jpeg"
                                    candidate.endsWith(".svg") -> "image/svg+xml"
                                    candidate.endsWith(".woff2") -> "font/woff2"
                                    candidate.endsWith(".woff") -> "font/woff"
                                    candidate.endsWith(".ttf") -> "font/ttf"
                                    else -> "application/octet-stream"
                                }
                                Log.d(TAG, "Fallback asset loaded: $candidate as $mimeType")
                                return WebResourceResponse(mimeType, "UTF-8", stream)
                            } catch (_: Exception) {
                                // Try next candidate
                            }
                        }
                    }

                    return null
                }

                override fun onReceivedError(
                    view: WebView,
                    request: WebResourceRequest,
                    error: WebResourceError
                ) {
                    super.onReceivedError(view, request, error)
                    Log.e(TAG, "WebView error loading ${request.url}: ${error.description} (code ${error.errorCode})")
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(message: ConsoleMessage): Boolean {
                    Log.d("TrustWalletWeb", "[${message.messageLevel()}] ${message.message()} (${message.sourceId()}:${message.lineNumber()})")
                    return true
                }
            }
        }

        setContentView(webView)

        // Android back button navigation
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        // Load bundled standalone offline app from inside APK
        val localAssetUrl = "https://appassets.androidplatform.net/assets/dist/index.html"
        Log.i(TAG, "Loading initial URL: $localAssetUrl")
        webView.loadUrl(localAssetUrl)
    }
}
