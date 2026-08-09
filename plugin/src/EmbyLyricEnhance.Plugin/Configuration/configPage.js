define([], function () {
    "use strict";

    var pluginId = "efbd3f14-8799-4a7d-a5ad-7ef93c5b0e5d";
    var pageSelector = "#EmbyLyricEnhanceConfigPage";

    function setManagedVisibility(page, isActive) {
        if (!page || !page.classList) {
            return;
        }
        if (isActive) {
            page.classList.remove("elyric-managed-hidden");
            page.removeAttribute("aria-hidden");
        } else {
            page.classList.add("elyric-managed-hidden");
            page.setAttribute("aria-hidden", "true");
        }
    }

    function activatePage(preferredPage) {
        var pages = document.querySelectorAll(pageSelector);
        if (!pages.length) {
            return preferredPage || null;
        }

        var preferredIndex = preferredPage
            ? Array.prototype.indexOf.call(pages, preferredPage)
            : -1;
        var activePage = preferredIndex >= 0
            ? preferredPage
            : pages[pages.length - 1];
        Array.prototype.forEach.call(pages, function (candidate) {
            setManagedVisibility(candidate, candidate === activePage);
        });
        return activePage;
    }

    function bindPage(page) {
        if (!page || page.getAttribute("data-elyric-config-bound") === "true") {
            return;
        }

        var form = page.querySelector("#EmbyLyricEnhanceConfigForm");
        if (!form) {
            return;
        }

        page.setAttribute("data-elyric-config-bound", "true");
        var submitButton = form.querySelector('button[type="submit"]');
        var submitLabel = page.querySelector("#elyricSubmitLabel");
        var reloadButton = page.querySelector("#elyricReloadButton");
        var loadPromise = null;
        var saving = false;
        var ready = false;

        function element(id) {
            return page.querySelector("#" + id);
        }

        function numberValue(id) {
            return Number(element(id).value);
        }

        function setValue(id, value, fallback) {
            element(id).value = null == value ? fallback : value;
        }

        function setChecked(id, value, fallback) {
            element(id).checked = null == value ? fallback : Boolean(value);
        }

        function syncColorInput() {
            element("elyricHighlightColor").disabled = element("elyricUseThemeColor").checked;
        }

        function setFormReady(value) {
            ready = Boolean(value);
            submitButton.disabled = saving || !ready;
        }

        function showStatus(message, state) {
            var status = element("elyricSaveStatus");
            status.textContent = message || "";
            status.hidden = !message;
            status.setAttribute("data-state", state || "idle");
        }

        function errorMessage(prefix, error) {
            var detail = error && error.message
                ? error.message
                : "请检查 Emby 服务器日志和浏览器网络请求。";
            showStatus(prefix + "：" + detail, "error");
            if (window.console && console.error) {
                console.error(error);
            }
        }

        function applyConfiguration(configuration) {
            var display = configuration.Display || {};
            setValue("elyricDefaultTheme", display.DefaultTheme, "classic");
            setChecked("elyricAllowUserThemeOverride", display.AllowUserThemeOverride, true);
            setValue("elyricFontSizePercent", display.FontSizePercent, 100);
            setValue("elyricLineHeight", display.LineHeight, 1.25);
            setValue("elyricFontWeight", display.FontWeight, 600);
            setChecked("elyricUseThemeColor", display.UseThemeColor, true);
            setValue("elyricHighlightColor", display.HighlightColor, "#ffffff");
            setValue("elyricPendingOpacity", display.PendingOpacity, 0.46);
            setValue("elyricGlowStrength", display.GlowStrength, 0.45);
            setValue("elyricCurrentLineScale", display.CurrentLineScale, 1.08);
            setValue("elyricOtherLinesOpacity", display.OtherLinesOpacity, 0.34);
            setValue("elyricOtherLinesBlurPixels", display.OtherLinesBlurPixels, 0.4);
            setChecked("elyricShowSecondLine", display.ShowSecondLine, true);
            setChecked("elyricShowThirdAndLaterLines", display.ShowThirdAndLaterLines, true);
            syncColorInput();
        }

        function currentSummary() {
            var themeNames = {
                classic: "经典累积",
                focus: "单字聚焦",
                gradient: "渐变扫光",
                apple: "Apple 风格",
                minimal: "简洁整行"
            };
            var theme = element("elyricDefaultTheme").value;
            return "主题「" + (themeNames[theme] || theme) + "」，字号 " +
                element("elyricFontSizePercent").value + "% / 行距 " +
                element("elyricLineHeight").value + "。";
        }

        function loadConfiguration(options) {
            options = options || {};
            if (loadPromise) {
                if (options.force) {
                    return loadPromise.catch(function () {
                        return null;
                    }).then(function () {
                        return loadConfiguration({
                            pendingMessage: options.pendingMessage,
                            readyMessage: options.readyMessage
                        });
                    });
                }
                return loadPromise;
            }

            setFormReady(false);
            showStatus(options.pendingMessage || "正在读取服务器设置…", "loading");
            Dashboard.showLoadingMsg();
            loadPromise = ApiClient.getPluginConfiguration(pluginId).then(function (configuration) {
                applyConfiguration(configuration);
                setFormReady(true);
                if (false !== options.readyMessage) {
                    showStatus(
                        options.readyMessage || "已从服务器读取设置，可以修改后保存。",
                        "ready"
                    );
                }
                return configuration;
            }).finally(function () {
                Dashboard.hideLoadingMsg();
                loadPromise = null;
            });
            return loadPromise;
        }

        function refreshConfiguration() {
            return loadConfiguration().catch(function (error) {
                setFormReady(false);
                errorMessage("读取服务器设置失败，当前页面不会提交空值", error);
                throw error;
            });
        }

        function onPageShow() {
            var activePage = activatePage(page);
            if (activePage === page) {
                refreshConfiguration().catch(function () {});
            }
        }

        page.addEventListener("pageshow", onPageShow);
        page.addEventListener("viewshow", onPageShow);
        element("elyricUseThemeColor").addEventListener("change", syncColorInput);
        reloadButton.addEventListener("click", function () {
            refreshConfiguration().catch(function () {});
        });
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            if (saving) {
                return false;
            }
            if (!ready) {
                showStatus("尚未成功读取服务器设置，请先点击“重新读取服务器设置”。", "error");
                return false;
            }

            var wasReady = ready;
            saving = true;
            setFormReady(false);
            submitLabel.textContent = "正在保存…";
            showStatus("正在保存，并等待服务器回读确认…", "loading");
            Dashboard.showLoadingMsg();
            ApiClient.getPluginConfiguration(pluginId).then(function (configuration) {
                configuration.Display = configuration.Display || {};
                var display = configuration.Display;
                display.DefaultTheme = element("elyricDefaultTheme").value;
                display.AllowUserThemeOverride = element("elyricAllowUserThemeOverride").checked;
                display.FontSizePercent = numberValue("elyricFontSizePercent");
                display.LineHeight = numberValue("elyricLineHeight");
                display.FontWeight = numberValue("elyricFontWeight");
                display.UseThemeColor = element("elyricUseThemeColor").checked;
                display.HighlightColor = element("elyricHighlightColor").value;
                display.PendingOpacity = numberValue("elyricPendingOpacity");
                display.GlowStrength = numberValue("elyricGlowStrength");
                display.CurrentLineScale = numberValue("elyricCurrentLineScale");
                display.OtherLinesOpacity = numberValue("elyricOtherLinesOpacity");
                display.OtherLinesBlurPixels = numberValue("elyricOtherLinesBlurPixels");
                display.ShowSecondLine = element("elyricShowSecondLine").checked;
                display.ShowThirdAndLaterLines = element("elyricShowThirdAndLaterLines").checked;
                return ApiClient.updatePluginConfiguration(pluginId, configuration);
            }).then(function () {
                return loadConfiguration({
                    force: true,
                    pendingMessage: "保存请求已完成，正在从服务器回读确认…",
                    readyMessage: false
                });
            }).then(function () {
                showStatus("✓ 保存成功，服务器已回读确认。当前：" + currentSummary(), "success");
            }).catch(function (error) {
                setFormReady(wasReady);
                errorMessage("保存失败，服务器没有确认修改", error);
            }).finally(function () {
                saving = false;
                submitLabel.textContent = "保存";
                submitButton.disabled = !ready;
                Dashboard.hideLoadingMsg();
            });
            return false;
        });

        setFormReady(false);
        syncColorInput();
        refreshConfiguration().catch(function () {});
    }

    return function (view) {
        bindPage(view);
        window.setTimeout(function () {
            activatePage(view);
        }, 0);
    };
});
