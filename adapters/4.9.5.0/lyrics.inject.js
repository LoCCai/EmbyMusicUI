/* ELYRIC_ENHANCE_BEGIN:4.9.5.0 */
;(function () {
    "use strict";

    var TICKS_PER_SECOND = 10000000;
    var MAX_INTERPOLATION_MS = 800;
    var THEME_STORAGE_KEY = "emby-lyric-enhance.theme";
    var LAYOUT_STORAGE_KEY = "emby-lyric-enhance.player-layout";
    var ARTWORK_ROTATION_STORAGE_KEY = "emby-lyric-enhance.artwork-rotation";
    var PUBLIC_CONFIGURATION_PATH = "EmbyLyricEnhance/PublicConfiguration";
    var NATIVE_PLAYER_SELECTORS = {
        back: [".headerBackButton"],
        cast: [".headerCastButton"],
        previous: [".btnPreviousTrack"],
        playPause: [".videoOsd-btnPause"],
        stop: [".btnVideoOsd-stop"],
        next: [".btnNextTrack", ".btnNextTrackTopRight"],
        lyrics: [".btnLyrics"],
        shuffle: [".btnOsdShuffle-bottom", ".btnOsdShuffle-topright", ".btnOsdShuffle"],
        repeat: [".btnOsdRepeatMode-bottom", ".btnOsdRepeatMode-topright", ".btnOsdRepeatMode"],
        queue: [".btnPlayQueue"],
        mute: [".buttonMute"],
        volume: [".videoOsdVolumeSlider"],
        seek: [".videoOsdPositionSlider"]
    };
    var PLAYER_LAYOUTS = [
        { id: "album", label: "专辑双栏" },
        { id: "vinyl", label: "唱片机" },
        { id: "lyrics", label: "歌词优先" }
    ];
    var THEMES = [
        { id: "classic", label: "经典累积" },
        { id: "focus", label: "单字聚焦" },
        { id: "gradient", label: "渐变扫光" },
        { id: "apple", label: "Apple 风格" },
        { id: "minimal", label: "简洁整行" }
    ];
    var DEFAULT_DISPLAY_CONFIGURATION = {
        defaultTheme: "classic",
        allowUserThemeOverride: true,
        fontSizePercent: 100,
        lineHeight: 1.25,
        fontWeight: 600,
        useThemeColor: true,
        highlightColor: "#ffffff",
        pendingOpacity: .46,
        glowStrength: .45,
        currentLineScale: 1.08,
        otherLinesOpacity: .34,
        otherLinesBlurPixels: .4,
        showSecondLine: true,
        showThirdAndLaterLines: true
    };
    var serverConfigurationPromise = null;
    var originalGetItemsInternal = LyricsRenderer.prototype.getItemsInternal;
    var originalOnTimeUpdate = LyricsRenderer.prototype.onTimeUpdate;
    var originalDestroy = LyricsRenderer.prototype.destroy;

    function cloneEvent(event) {
        var clone = {};
        var key;
        for (key in event) {
            if (Object.prototype.hasOwnProperty.call(event, key)) {
                clone[key] = event[key];
            }
        }
        return clone;
    }

    function parseTimeTag(minutes, seconds, fraction) {
        var fractionTicks = 0;
        if (fraction) {
            fractionTicks = Math.round(Number("0." + fraction) * TICKS_PER_SECOND);
        }
        return (Number(minutes) * 60 + Number(seconds)) * TICKS_PER_SECOND + fractionTicks;
    }

    function parseEnhancedLine(value, fallbackEndTicks, allowOpenEnded) {
        var text = null == value ? "" : String(value);
        var pattern = /<(\d{1,4}):([0-5]\d)(?:[.:](\d{1,3}))?>/g;
        var markers = [];
        var match;

        while ((match = pattern.exec(text))) {
            markers.push({
                start: match.index,
                end: pattern.lastIndex,
                ticks: parseTimeTag(match[1], match[2], match[3])
            });
        }

        if (markers.length < 2 || text.slice(0, markers[0].start).trim()) {
            return null;
        }

        var words = [];
        var plainText = "";
        var i;
        for (i = 0; i < markers.length; i++) {
            if (i && markers[i].ticks < markers[i - 1].ticks) {
                return null;
            }

            var segmentEnd = i + 1 < markers.length ? markers[i + 1].start : text.length;
            var segment = text.slice(markers[i].end, segmentEnd);
            if (!segment) {
                if (i !== markers.length - 1) {
                    return null;
                }
                continue;
            }

            var endTicks = i + 1 < markers.length ? markers[i + 1].ticks : fallbackEndTicks;
            if (!(endTicks > markers[i].ticks)) {
                if (allowOpenEnded && i === markers.length - 1) {
                    endTicks = markers[i].ticks + TICKS_PER_SECOND;
                } else {
                    return null;
                }
            }

            words.push({
                text: segment,
                startTicks: markers[i].ticks,
                endTicks: endTicks
            });
            plainText += segment;
        }

        if (!words.length) {
            return null;
        }

        return {
            text: plainText,
            words: words,
            lastBoundaryTicks: Math.max(
                markers[markers.length - 1].ticks,
                words[words.length - 1].endTicks
            )
        };
    }

    function prepareEnhancedLyrics(events) {
        if (!Array.isArray(events) || !events.length) {
            return events || [];
        }

        var sorted = events.map(function (event, index) {
            return { event: cloneEvent(event), index: index };
        });

        sorted.sort(function (left, right) {
            var leftTicks = Number(left.event.StartPositionTicks);
            var rightTicks = Number(right.event.StartPositionTicks);
            var leftValid = isFinite(leftTicks);
            var rightValid = isFinite(rightTicks);
            if (leftValid && rightValid && leftTicks !== rightTicks) {
                return leftTicks - rightTicks;
            }
            if (leftValid !== rightValid) {
                return leftValid ? -1 : 1;
            }
            return left.index - right.index;
        });

        var groups = [];
        sorted.forEach(function (entry) {
            var ticks = Number(entry.event.StartPositionTicks);
            var previous = groups.length ? groups[groups.length - 1] : null;
            if (isFinite(ticks) && previous && previous.startTicks === ticks) {
                previous.events.push(entry.event);
            } else {
                groups.push({
                    startTicks: isFinite(ticks) ? ticks : null,
                    events: [entry.event]
                });
            }
        });

        return groups.map(function (group, groupIndex) {
            var item = cloneEvent(group.events[0]);
            if (null == group.startTicks) {
                return item;
            }

            var nextGroup = groupIndex + 1 < groups.length ? groups[groupIndex + 1] : null;
            var nextStartTicks = nextGroup && null != nextGroup.startTicks ? nextGroup.startTicks : null;
            var declaredEndTicks = group.startTicks;
            group.events.forEach(function (event) {
                var endTicks = Number(event.EndPositionTicks);
                if (isFinite(endTicks) && endTicks > declaredEndTicks) {
                    declaredEndTicks = endTicks;
                }
            });

            var fallbackEndTicks = nextStartTicks > group.startTicks
                ? nextStartTicks
                : declaredEndTicks > group.startTicks
                    ? declaredEndTicks
                    : group.startTicks + 5 * TICKS_PER_SECOND;

            var lastBoundaryTicks = group.startTicks;
            var allowOpenEnded = !(nextStartTicks > group.startTicks);
            var sublines = group.events.map(function (event) {
                var parsed = parseEnhancedLine(event.Text, fallbackEndTicks, allowOpenEnded);
                if (parsed) {
                    if (parsed.lastBoundaryTicks > lastBoundaryTicks) {
                        lastBoundaryTicks = parsed.lastBoundaryTicks;
                    }
                    return { text: parsed.text, words: parsed.words };
                }
                return { text: null == event.Text ? "" : String(event.Text), words: null };
            });

            var endPositionTicks = nextStartTicks > group.startTicks
                ? nextStartTicks
                : Math.max(declaredEndTicks, lastBoundaryTicks, fallbackEndTicks);

            item.Id = String(item.Id || "lyrics") + "_elyric_" + groupIndex;
            item.StartPositionTicks = group.startTicks;
            item.EndPositionTicks = endPositionTicks;
            item.Text = sublines.map(function (line) { return line.text; }).join(" · ");
            item.__elyric = {
                startTicks: group.startTicks,
                endTicks: endPositionTicks,
                sublines: sublines
            };
            return item;
        });
    }

    function appendTextWithBreaks(parent, value) {
        var parts = String(value).split(/<br\s*\/?>/gi);
        parts.forEach(function (part, index) {
            if (index) {
                parent.appendChild(document.createElement("br"));
            }
            parent.appendChild(document.createTextNode(part));
        });
    }

    function isKnownTheme(themeId) {
        for (var i = 0; i < THEMES.length; i++) {
            if (THEMES[i].id === themeId) {
                return true;
            }
        }
        return false;
    }

    function configValue(source, camelName, pascalName) {
        if (!source) {
            return undefined;
        }
        if (Object.prototype.hasOwnProperty.call(source, camelName)) {
            return source[camelName];
        }
        return source[pascalName];
    }

    function finiteNumber(value, minimum, maximum, fallback) {
        value = Number(value);
        return isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
    }

    function booleanValue(value, fallback) {
        return "boolean" === typeof value ? value : fallback;
    }

    function normalizeColor(value) {
        value = null == value ? "" : String(value).trim();
        if (!/^#[0-9a-f]{6}$/i.test(value)) {
            return "#ffffff";
        }
        return value.toLowerCase();
    }

    function normalizeDisplayConfiguration(source) {
        var defaultTheme = configValue(source, "defaultTheme", "DefaultTheme");
        var fontWeight = finiteNumber(
            configValue(source, "fontWeight", "FontWeight"),
            300,
            900,
            DEFAULT_DISPLAY_CONFIGURATION.fontWeight
        );
        fontWeight = Math.round(fontWeight / 100) * 100;

        return {
            defaultTheme: isKnownTheme(defaultTheme) ? defaultTheme : DEFAULT_DISPLAY_CONFIGURATION.defaultTheme,
            allowUserThemeOverride: booleanValue(
                configValue(source, "allowUserThemeOverride", "AllowUserThemeOverride"),
                DEFAULT_DISPLAY_CONFIGURATION.allowUserThemeOverride
            ),
            fontSizePercent: finiteNumber(
                configValue(source, "fontSizePercent", "FontSizePercent"),
                70,
                180,
                DEFAULT_DISPLAY_CONFIGURATION.fontSizePercent
            ),
            lineHeight: finiteNumber(
                configValue(source, "lineHeight", "LineHeight"),
                1,
                2,
                DEFAULT_DISPLAY_CONFIGURATION.lineHeight
            ),
            fontWeight: fontWeight,
            useThemeColor: booleanValue(
                configValue(source, "useThemeColor", "UseThemeColor"),
                DEFAULT_DISPLAY_CONFIGURATION.useThemeColor
            ),
            highlightColor: normalizeColor(configValue(source, "highlightColor", "HighlightColor")),
            pendingOpacity: finiteNumber(
                configValue(source, "pendingOpacity", "PendingOpacity"),
                .1,
                .9,
                DEFAULT_DISPLAY_CONFIGURATION.pendingOpacity
            ),
            glowStrength: finiteNumber(
                configValue(source, "glowStrength", "GlowStrength"),
                0,
                1,
                DEFAULT_DISPLAY_CONFIGURATION.glowStrength
            ),
            currentLineScale: finiteNumber(
                configValue(source, "currentLineScale", "CurrentLineScale"),
                1,
                1.25,
                DEFAULT_DISPLAY_CONFIGURATION.currentLineScale
            ),
            otherLinesOpacity: finiteNumber(
                configValue(source, "otherLinesOpacity", "OtherLinesOpacity"),
                .1,
                1,
                DEFAULT_DISPLAY_CONFIGURATION.otherLinesOpacity
            ),
            otherLinesBlurPixels: finiteNumber(
                configValue(source, "otherLinesBlurPixels", "OtherLinesBlurPixels"),
                0,
                4,
                DEFAULT_DISPLAY_CONFIGURATION.otherLinesBlurPixels
            ),
            showSecondLine: booleanValue(
                configValue(source, "showSecondLine", "ShowSecondLine"),
                DEFAULT_DISPLAY_CONFIGURATION.showSecondLine
            ),
            showThirdAndLaterLines: booleanValue(
                configValue(source, "showThirdAndLaterLines", "ShowThirdAndLaterLines"),
                DEFAULT_DISPLAY_CONFIGURATION.showThirdAndLaterLines
            )
        };
    }

    function activeApiClient(renderer) {
        if (renderer
            && renderer.currentItem
            && "undefined" !== typeof _connectionmanager
            && _connectionmanager
            && _connectionmanager.default
            && _connectionmanager.default.getApiClient) {
            var connectedClient = _connectionmanager.default.getApiClient(renderer.currentItem);
            if (connectedClient && connectedClient.getJSON) {
                return connectedClient;
            }
        }
        if ("undefined" !== typeof ApiClient && ApiClient && ApiClient.getJSON) {
            return ApiClient;
        }
        if ("undefined" !== typeof window && window.ApiClient && window.ApiClient.getJSON) {
            return window.ApiClient;
        }
        return null;
    }

    function requestServerConfiguration(renderer) {
        if (serverConfigurationPromise) {
            return serverConfigurationPromise;
        }
        var apiClient = activeApiClient(renderer);
        if (!apiClient) {
            return null;
        }

        try {
            var url = apiClient.getUrl
                ? apiClient.getUrl(PUBLIC_CONFIGURATION_PATH)
                : PUBLIC_CONFIGURATION_PATH;
            serverConfigurationPromise = Promise.resolve(apiClient.getJSON(url)).then(
                normalizeDisplayConfiguration,
                function () { return normalizeDisplayConfiguration(null); }
            );
        } catch (error) {
            serverConfigurationPromise = Promise.resolve(normalizeDisplayConfiguration(null));
        }
        return serverConfigurationPromise;
    }

    function loadStoredTheme() {
        try {
            if ("undefined" !== typeof localStorage) {
                var themeId = localStorage.getItem(THEME_STORAGE_KEY);
                if (isKnownTheme(themeId)) {
                    return themeId;
                }
            }
        } catch (error) {
            // Storage can be disabled by browser privacy settings.
        }
        return null;
    }

    function ensureThemeState(renderer) {
        if (renderer.__elyricThemeInitialized) {
            return;
        }
        renderer.__elyricStoredTheme = loadStoredTheme();
        renderer.__elyricTheme = renderer.__elyricStoredTheme || "classic";
        renderer.__elyricThemeInitialized = true;
    }

    function storeTheme(themeId) {
        try {
            if ("undefined" !== typeof localStorage) {
                localStorage.setItem(THEME_STORAGE_KEY, themeId);
            }
        } catch (error) {
            // Theme switching still works for the current page without storage.
        }
    }

    function isKnownPlayerLayout(layoutId) {
        for (var i = 0; i < PLAYER_LAYOUTS.length; i++) {
            if (PLAYER_LAYOUTS[i].id === layoutId) {
                return true;
            }
        }
        return false;
    }

    function loadStoredPlayerLayout() {
        try {
            if ("undefined" !== typeof localStorage) {
                var layoutId = localStorage.getItem(LAYOUT_STORAGE_KEY);
                if (isKnownPlayerLayout(layoutId)) {
                    return layoutId;
                }
            }
        } catch (error) {
            // The default layout remains usable when browser storage is disabled.
        }
        return "album";
    }

    function storePlayerLayout(layoutId) {
        try {
            if ("undefined" !== typeof localStorage) {
                localStorage.setItem(LAYOUT_STORAGE_KEY, layoutId);
            }
        } catch (error) {
            // Layout switching still works for the current lyric view.
        }
    }

    function loadStoredArtworkRotation() {
        try {
            if ("undefined" !== typeof localStorage) {
                return "false" !== localStorage.getItem(ARTWORK_ROTATION_STORAGE_KEY);
            }
        } catch (error) {
            // Circular artwork rotates by default when browser storage is disabled.
        }
        return true;
    }

    function storeArtworkRotation(enabled) {
        try {
            if ("undefined" !== typeof localStorage) {
                localStorage.setItem(ARTWORK_ROTATION_STORAGE_KEY, enabled ? "true" : "false");
            }
        } catch (error) {
            // The current lyric view can still toggle rotation.
        }
    }

    function syncArtworkRotationAvailability(renderer) {
        var button = renderer.__elyricArtworkRotationButton;
        if (!button) {
            return;
        }
        var circular = "vinyl" === renderer.__elyricPlayerLayout
            || "lyrics" === renderer.__elyricPlayerLayout;
        button.disabled = !circular;
        setAttributeIfChanged(button, "aria-disabled", circular ? "false" : "true");
        setAttributeIfChanged(
            button,
            "title",
            circular
                ? (renderer.__elyricArtworkRotation ? "停止专辑图旋转" : "开启专辑图旋转")
                : "当前界面使用方形静止封面"
        );
        setAttributeIfChanged(button, "data-elyric-tooltip", button.getAttribute("title"));
    }

    function setArtworkRotation(renderer, enabled, persist) {
        enabled = !!enabled;
        renderer.__elyricArtworkRotation = enabled;
        setAttributeIfChanged(
            renderer.__elyricThemeControl,
            "data-elyric-artwork-rotate",
            enabled ? "true" : "false"
        );
        if (renderer.__elyricArtworkRotationButton) {
            setAttributeIfChanged(
                renderer.__elyricArtworkRotationButton,
                "aria-pressed",
                enabled ? "true" : "false"
            );
            setAttributeIfChanged(
                renderer.__elyricArtworkRotationButton,
                "data-elyric-active",
                enabled ? "true" : "false"
            );
        }
        syncArtworkRotationAvailability(renderer);
        if (persist) {
            storeArtworkRotation(enabled);
        }
    }

    function setSettingsPanelOpen(renderer, open) {
        open = !!open;
        renderer.__elyricSettingsOpen = open;
        setAttributeIfChanged(
            renderer.__elyricThemeControl,
            "data-elyric-settings-open",
            open ? "true" : "false"
        );
        if (renderer.__elyricSettingsPanel) {
            if (open) {
                removeAttributeIfPresent(renderer.__elyricSettingsPanel, "hidden");
            } else {
                setAttributeIfChanged(renderer.__elyricSettingsPanel, "hidden", "hidden");
            }
        }
        if (renderer.__elyricSettingsButton) {
            setAttributeIfChanged(renderer.__elyricSettingsButton, "aria-expanded", open ? "true" : "false");
            setAttributeIfChanged(renderer.__elyricSettingsButton, "data-elyric-active", open ? "true" : "false");
        }
    }

    function syncSettingsPanelVisibility(renderer, pageVisible) {
        var panel = renderer.__elyricSettingsPanel;
        if (!panel) {
            return;
        }
        if (pageVisible && renderer.__elyricSettingsOpen) {
            removeAttributeIfPresent(panel, "hidden");
        } else {
            setAttributeIfChanged(panel, "hidden", "hidden");
        }
    }

    function findPlayerPage(renderer) {
        var element = renderer.itemsContainer;
        while (element) {
            if (element.classList && element.classList.contains("view-videoosd-videoosd")) {
                return element;
            }
            element = element.parentNode;
        }
        return null;
    }

    function syncPlayerPageState(renderer, visible) {
        var body = document.body;
        if (!body || !body.classList) {
            return;
        }
        if (visible) {
            body.__elyricPlayerPageOwner = renderer;
            if (!body.classList.contains("elyric-player-active-page")) {
                body.classList.add("elyric-player-active-page");
            }
            setAttributeIfChanged(body, "data-elyric-player-layout", renderer.__elyricPlayerLayout || "album");
        } else if (body.__elyricPlayerPageOwner === renderer) {
            body.__elyricPlayerPageOwner = null;
            if (body.classList.contains("elyric-player-active-page")) {
                body.classList.remove("elyric-player-active-page");
            }
            removeAttributeIfPresent(body, "data-elyric-player-layout");
        }
    }

    function applyPlayerLayout(renderer, layoutId, persist) {
        layoutId = isKnownPlayerLayout(layoutId) ? layoutId : "album";
        renderer.__elyricPlayerLayout = layoutId;
        setAttributeIfChanged(renderer.itemsContainer, "data-elyric-player-layout", layoutId);
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-player-layout", layoutId);
        setAttributeIfChanged(renderer.__elyricSettingsPanel, "data-elyric-player-layout", layoutId);
        if (renderer.__elyricLayoutSelect) {
            renderer.__elyricLayoutSelect.value = layoutId;
        }
        if (persist) {
            storePlayerLayout(layoutId);
        }
        syncArtworkRotationAvailability(renderer);
        syncPlayerPageState(renderer, isThemeContextVisible(renderer));
    }

    function applyTheme(renderer, themeId, persist) {
        ensureThemeState(renderer);
        if (persist
            && renderer.__elyricDisplayConfiguration
            && !renderer.__elyricDisplayConfiguration.allowUserThemeOverride) {
            if (renderer.__elyricThemeSelect) {
                renderer.__elyricThemeSelect.value = renderer.__elyricTheme;
            }
            return;
        }
        themeId = isKnownTheme(themeId) ? themeId : "classic";
        renderer.__elyricTheme = themeId;

        var container = renderer.itemsContainer;
        if (renderer.__elyricThemeContainer
            && renderer.__elyricThemeContainer !== container
            && renderer.__elyricThemeContainer.removeAttribute) {
            renderer.__elyricThemeContainer.removeAttribute("data-elyric-theme");
        }
        if (container && container.setAttribute) {
            container.setAttribute("data-elyric-theme", themeId);
            renderer.__elyricThemeContainer = container;
        }
        if (renderer.__elyricThemeSelect) {
            renderer.__elyricThemeSelect.value = themeId;
        }
        if (persist) {
            renderer.__elyricStoredTheme = themeId;
            renderer.__elyricUserSelectedTheme = true;
            storeTheme(themeId);
        }
    }

    function setDisplayStyle(container, propertyName, value) {
        if (container && container.style && container.style.setProperty) {
            container.style.setProperty(propertyName, String(value));
        }
    }

    function applyPlayerShellConfiguration(renderer, configuration) {
        var control = renderer.__elyricThemeControl;
        if (!control || !configuration) {
            return;
        }
        if (configuration.useThemeColor && control.style && control.style.removeProperty) {
            control.style.removeProperty("--elyric-highlight-color");
        } else {
            setDisplayStyle(control, "--elyric-highlight-color", configuration.highlightColor);
        }
        setDisplayStyle(control, "--elyric-glow-percent", Math.round(configuration.glowStrength * 100) + "%");
    }

    function applyDisplayConfiguration(renderer, configuration) {
        ensureThemeState(renderer);
        configuration = normalizeDisplayConfiguration(configuration);
        renderer.__elyricDisplayConfiguration = configuration;

        var container = renderer.itemsContainer;
        if (container) {
            setDisplayStyle(container, "--elyric-font-size", configuration.fontSizePercent + "%");
            setDisplayStyle(container, "--elyric-line-height", configuration.lineHeight);
            setDisplayStyle(container, "--elyric-font-weight", configuration.fontWeight);
            setDisplayStyle(container, "--elyric-pending-opacity", configuration.pendingOpacity);
            setDisplayStyle(container, "--elyric-glow-size", configuration.glowStrength + "em");
            setDisplayStyle(container, "--elyric-glow-percent", Math.round(configuration.glowStrength * 100) + "%");
            setDisplayStyle(container, "--elyric-current-scale", configuration.currentLineScale);
            setDisplayStyle(container, "--elyric-other-lines-opacity", configuration.otherLinesOpacity);
            setDisplayStyle(container, "--elyric-other-lines-blur", configuration.otherLinesBlurPixels + "px");
            if (configuration.useThemeColor && container.style && container.style.removeProperty) {
                container.style.removeProperty("--elyric-highlight-color");
            } else {
                setDisplayStyle(container, "--elyric-highlight-color", configuration.highlightColor);
            }
            if (!renderer.__elyricSecondLineOverridden) {
                setSecondLineOverride(renderer, configuration.showSecondLine);
            } else {
                setSecondLineOverride(renderer, renderer.__elyricLocalShowSecond);
            }
            container.setAttribute(
                "data-elyric-show-third-plus",
                configuration.showThirdAndLaterLines ? "true" : "false"
            );
        }

        var effectiveTheme = configuration.defaultTheme;
        if (configuration.allowUserThemeOverride && renderer.__elyricStoredTheme) {
            effectiveTheme = renderer.__elyricStoredTheme;
        }
        applyTheme(renderer, effectiveTheme, false);

        if (renderer.__elyricThemeSelect) {
            renderer.__elyricThemeSelect.disabled = !configuration.allowUserThemeOverride;
            renderer.__elyricThemeSelect.setAttribute(
                "aria-disabled",
                configuration.allowUserThemeOverride ? "false" : "true"
            );
        }
        if (renderer.__elyricThemeControl) {
            renderer.__elyricThemeControl.setAttribute(
                "data-elyric-theme-locked",
                configuration.allowUserThemeOverride ? "false" : "true"
            );
        }
        applyPlayerShellConfiguration(renderer, configuration);
    }

    function ensureDisplayConfiguration(renderer) {
        if (!renderer.__elyricDisplayConfiguration) {
            applyDisplayConfiguration(renderer, null);
        }
        if (renderer.__elyricConfigurationRequested) {
            return;
        }
        var request = requestServerConfiguration(renderer);
        if (!request) {
            return;
        }
        renderer.__elyricConfigurationRequested = true;
        request.then(function (configuration) {
            if (!renderer.__elyricDestroyed) {
                applyDisplayConfiguration(renderer, configuration);
                ensureThemeControl(renderer);
            }
        });
    }

    function removeDisplayConfiguration(renderer) {
        var container = renderer.itemsContainer;
        if (container) {
            container.removeAttribute("data-elyric-show-second");
            container.removeAttribute("data-elyric-show-third-plus");
            container.removeAttribute("data-elyric-player-layout");
            if (container.style && container.style.removeProperty) {
                [
                    "--elyric-font-size",
                    "--elyric-line-height",
                    "--elyric-font-weight",
                    "--elyric-pending-opacity",
                    "--elyric-glow-size",
                    "--elyric-glow-percent",
                    "--elyric-current-scale",
                    "--elyric-other-lines-opacity",
                    "--elyric-other-lines-blur",
                    "--elyric-highlight-color"
                ].forEach(function (propertyName) {
                    container.style.removeProperty(propertyName);
                });
            }
        }
        renderer.__elyricDisplayConfiguration = null;
        renderer.__elyricConfigurationRequested = false;
        renderer.__elyricStoredTheme = null;
        renderer.__elyricUserSelectedTheme = false;
        renderer.__elyricThemeInitialized = false;
        renderer.__elyricLocalShowSecond = null;
        renderer.__elyricSecondLineOverridden = false;
        // Share one request between renderers that overlap during page transitions,
        // but fetch again after leaving lyrics so newly saved server settings apply.
        serverConfigurationPromise = null;
    }

    function stopControlEvent(event) {
        if (event && event.stopPropagation) {
            event.stopPropagation();
        }
    }

    function replaceElementText(element, value) {
        if (!element) {
            return;
        }
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        element.appendChild(document.createTextNode(null == value ? "" : String(value)));
    }

    function setAttributeIfChanged(element, name, value) {
        value = String(value);
        if (element && element.getAttribute && element.getAttribute(name) !== value) {
            element.setAttribute(name, value);
        }
    }

    function removeAttributeIfPresent(element, name) {
        if (element && element.getAttribute && null !== element.getAttribute(name)) {
            element.removeAttribute(name);
        }
    }

    function formatPlayerTime(ticks) {
        ticks = Number(ticks);
        if (!isFinite(ticks) || ticks < 0) {
            ticks = 0;
        }
        var totalSeconds = Math.floor(ticks / TICKS_PER_SECOND);
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor(totalSeconds % 3600 / 60);
        var seconds = totalSeconds % 60;
        return (hours ? hours + ":" + String(minutes).padStart(2, "0") : String(minutes))
            + ":" + String(seconds).padStart(2, "0");
    }

    function isNativeControlCandidate(element) {
        return !!(element
            && element !== document.body
            && !(element.classList && element.classList.contains("hide"))
            && !element.disabled);
    }

    function findNativeControl(renderer, selectors) {
        var playerPage = renderer.__elyricPlayerPage || findPlayerPage(renderer);
        var roots = [playerPage, document.body || renderer.itemsContainer];
        for (var rootIndex = 0; rootIndex < roots.length; rootIndex++) {
            var root = roots[rootIndex];
            if (!root || !root.querySelectorAll || (rootIndex && root === roots[0])) {
                continue;
            }
            for (var selectorIndex = 0; selectorIndex < selectors.length; selectorIndex++) {
                var elements = root.querySelectorAll(selectors[selectorIndex]);
                for (var elementIndex = 0; elementIndex < elements.length; elementIndex++) {
                    var element = elements[elementIndex];
                    if ((!renderer.__elyricThemeControl
                        || !renderer.__elyricThemeControl.contains
                        || !renderer.__elyricThemeControl.contains(element))
                        && isNativeControlCandidate(element)) {
                        return element;
                    }
                }
            }
        }
        return null;
    }

    function triggerNativeClick(renderer, action) {
        var target = findNativeControl(renderer, NATIVE_PLAYER_SELECTORS[action] || []);
        if (!target) {
            return false;
        }
        if (target.click) {
            target.click();
        } else if (target.dispatchEvent) {
            target.dispatchEvent({ type: "click", target: target, currentTarget: target });
        }
        return true;
    }

    function setPlayPausePresentation(renderer, playing) {
        var button = renderer.__elyricPlayerButtons && renderer.__elyricPlayerButtons.playPause;
        if (!button) {
            return;
        }
        replaceElementText(button, playing ? "Ⅱ" : "▶");
        setAttributeIfChanged(button, "aria-label", playing ? "暂停" : "播放");
        setAttributeIfChanged(button, "title", playing ? "暂停" : "播放");
        setAttributeIfChanged(button, "data-elyric-tooltip", playing ? "暂停" : "播放");
        setAttributeIfChanged(button, "data-elyric-playing", playing ? "true" : "false");
    }

    function activatePlayerAction(renderer, action) {
        if ("back" === action || "lyrics" === action || "queue" === action) {
            setSettingsPanelOpen(renderer, false);
        }
        if ("playPause" === action) {
            var button = renderer.__elyricPlayerButtons && renderer.__elyricPlayerButtons.playPause;
            var playing = !!(button && "true" === button.getAttribute("data-elyric-playing"));
            renderer.__elyricOptimisticPlaying = !playing;
            renderer.__elyricOptimisticPlayingUntil = Date.now() + 1200;
            setPlayPausePresentation(renderer, !playing);
        }
        triggerNativeClick(renderer, action);
    }

    function createPlayerButton(renderer, action, label, icon) {
        var button = document.createElement("button");
        button.className = "elyric-player-button elyric-player-button-" + action;
        button.setAttribute("type", "button");
        button.setAttribute("data-elyric-player-action", action);
        button.setAttribute("aria-label", label);
        button.setAttribute("title", label);
        button.setAttribute("data-elyric-tooltip", label);
        button.appendChild(document.createTextNode(icon));
        var activatedOnPointerDown = false;
        button.addEventListener("click", function (event) {
            stopControlEvent(event);
            if ("playPause" === action && activatedOnPointerDown) {
                activatedOnPointerDown = false;
                return;
            }
            activatePlayerAction(renderer, action);
        });
        button.addEventListener("pointerdown", function (event) {
            stopControlEvent(event);
            if ("playPause" === action) {
                activatedOnPointerDown = true;
                activatePlayerAction(renderer, action);
            }
        });
        button.addEventListener("pointercancel", function () {
            activatedOnPointerDown = false;
        });
        if (!renderer.__elyricPlayerButtons) {
            renderer.__elyricPlayerButtons = {};
        }
        renderer.__elyricPlayerButtons[action] = button;
        return button;
    }

    function dispatchNativeSeekEvent(target, type) {
        if (!target || !target.dispatchEvent) {
            return;
        }
        if ("undefined" !== typeof Event) {
            target.dispatchEvent(new Event(type, { bubbles: true }));
        } else {
            target.dispatchEvent({ type: type, target: target, currentTarget: target });
        }
    }

    function seekFromPlayerControl(renderer) {
        var control = renderer.__elyricProgressSlider;
        var target = findNativeControl(renderer, NATIVE_PLAYER_SELECTORS.seek);
        if (!control || !target) {
            renderer.__elyricScrubbing = false;
            return;
        }
        var controlMaximum = Number(control.max) || 1000;
        var targetMaximum = Number(target.max) || 100;
        var percentage = Math.min(1, Math.max(0, Number(control.value) / controlMaximum));
        target.value = String(percentage * targetMaximum);
        dispatchNativeSeekEvent(target, "input");
        dispatchNativeSeekEvent(target, "change");
        renderer.__elyricScrubbing = false;
    }

    function volumeFromPlayerControl(renderer, eventType) {
        var control = renderer.__elyricVolumeSlider;
        var target = findNativeControl(renderer, NATIVE_PLAYER_SELECTORS.volume);
        if (!control || !target) {
            renderer.__elyricVolumeScrubbing = false;
            return;
        }
        var percentage = Math.min(100, Math.max(0, Number(control.value) || 0));
        target.value = String(percentage);
        dispatchNativeSeekEvent(target, eventType);
        if ("change" === eventType) {
            renderer.__elyricVolumeScrubbing = false;
        }
    }

    function updateVolumeControl(renderer) {
        var control = renderer.__elyricVolumeSlider;
        if (!control || renderer.__elyricVolumeScrubbing) {
            return;
        }
        var target = findNativeControl(renderer, NATIVE_PLAYER_SELECTORS.volume);
        var value = target ? Math.min(100, Math.max(0, Number(target.value) || 0)) : 0;
        control.disabled = !target;
        control.setAttribute("aria-disabled", target ? "false" : "true");
        control.value = String(value);
        control.setAttribute("value", control.value);
        setDisplayStyle(control, "--elyric-player-volume", value + "%");
    }

    function playerArtistText(item) {
        if (!item) {
            return "Emby 音乐";
        }
        if (Array.isArray(item.Artists) && item.Artists.length) {
            return item.Artists.join(" · ");
        }
        return item.AlbumArtist || item.Album || "Emby 音乐";
    }

    function playerArtworkUrl(renderer, item) {
        var primaryTag = item && item.ImageTags && item.ImageTags.Primary;
        var apiClient = primaryTag ? activeApiClient(renderer) : null;
        if (!apiClient || !item.Id) {
            return "";
        }
        try {
            if (apiClient.getScaledImageUrl) {
                return apiClient.getScaledImageUrl(item.Id, {
                    type: "Primary",
                    tag: primaryTag,
                    maxWidth: 1200
                });
            }
            if (apiClient.getUrl) {
                return apiClient.getUrl("Items/" + encodeURIComponent(item.Id) + "/Images/Primary", {
                    maxWidth: 1200,
                    tag: primaryTag
                });
            }
        } catch (error) {
            // Metadata and transport controls remain available without artwork.
        }
        return "";
    }

    function updatePlayerMetadata(renderer) {
        var item = renderer.currentItem || null;
        var signature = item
            ? [item.Id, item.Name, playerArtistText(item), item.Album, item.ImageTags && item.ImageTags.Primary].join("|")
            : "";
        if (renderer.__elyricPlayerItemSignature === signature) {
            return;
        }
        renderer.__elyricPlayerItemSignature = signature;
        replaceElementText(renderer.__elyricPlayerTitle, item && (item.Name || item.OriginalTitle) || "正在播放");
        replaceElementText(renderer.__elyricPlayerArtist, playerArtistText(item));
        replaceElementText(renderer.__elyricPlayerAlbum, item && item.Album || "");

        var artworkUrl = playerArtworkUrl(renderer, item);
        [renderer.__elyricPlayerArtwork, renderer.__elyricPlayerBackground].forEach(function (imageElement) {
            if (!imageElement) {
                return;
            }
            if (artworkUrl) {
                imageElement.setAttribute("src", artworkUrl);
                imageElement.setAttribute("alt", "");
                imageElement.removeAttribute("hidden");
            } else {
                imageElement.removeAttribute("src");
                imageElement.setAttribute("hidden", "hidden");
            }
        });
    }

    function updatePlayerTransportState(renderer) {
        var buttons = renderer.__elyricPlayerButtons;
        if (!buttons) {
            return;
        }
        ["back", "cast", "previous", "playPause", "stop", "next", "lyrics", "shuffle", "repeat", "queue", "mute"].forEach(function (action) {
            var button = buttons[action];
            var nativeControl = findNativeControl(renderer, NATIVE_PLAYER_SELECTORS[action] || []);
            if (!button) {
                return;
            }
            button.disabled = !nativeControl;
            button.setAttribute("aria-disabled", nativeControl ? "false" : "true");
            if ("playPause" === action && nativeControl) {
                var playbackLabel = nativeControl.getAttribute
                    && (nativeControl.getAttribute("aria-label") || nativeControl.getAttribute("title")) || "";
                var playing = /暂停|pause/i.test(playbackLabel);
                var optimisticUntil = Number(renderer.__elyricOptimisticPlayingUntil) || 0;
                if (optimisticUntil > Date.now()) {
                    if (playing === renderer.__elyricOptimisticPlaying) {
                        renderer.__elyricOptimisticPlayingUntil = 0;
                    } else {
                        playing = !!renderer.__elyricOptimisticPlaying;
                    }
                } else {
                    renderer.__elyricOptimisticPlayingUntil = 0;
                }
                setPlayPausePresentation(renderer, playing);
            }
            var active = !!(nativeControl
                && nativeControl.classList
                && nativeControl.classList.contains("toggleButton-active"));
            button.setAttribute("data-elyric-active", active ? "true" : "false");
        });
    }

    function updatePlayerControl(renderer, positionTicks, runtimeTicks) {
        renderer.__elyricLastPositionTicks = isFinite(Number(positionTicks)) ? Number(positionTicks) : 0;
        renderer.__elyricLastRuntimeTicks = isFinite(Number(runtimeTicks)) ? Number(runtimeTicks) : 0;
        if (!renderer.__elyricThemeControl) {
            return;
        }
        updatePlayerMetadata(renderer);
        updatePlayerTransportState(renderer);
        updateVolumeControl(renderer);
        if (renderer.__elyricScrubbing) {
            return;
        }

        var safeRuntime = Math.max(0, renderer.__elyricLastRuntimeTicks);
        var safePosition = Math.max(0, renderer.__elyricLastPositionTicks);
        var progress = safeRuntime > 0 ? Math.min(1, safePosition / safeRuntime) : 0;
        if (renderer.__elyricProgressSlider) {
            renderer.__elyricProgressSlider.value = String(Math.round(progress * 1000));
            renderer.__elyricProgressSlider.setAttribute("value", renderer.__elyricProgressSlider.value);
            renderer.__elyricProgressSlider.setAttribute(
                "aria-valuetext",
                formatPlayerTime(safePosition) + " / " + formatPlayerTime(safeRuntime)
            );
            setDisplayStyle(renderer.__elyricProgressSlider, "--elyric-player-progress", progress * 100 + "%");
        }
        replaceElementText(renderer.__elyricPlayerPosition, formatPlayerTime(safePosition));
        replaceElementText(renderer.__elyricPlayerDuration, formatPlayerTime(safeRuntime));
    }

    function setSecondLineOverride(renderer, show) {
        renderer.__elyricLocalShowSecond = !!show;
        setAttributeIfChanged(renderer.itemsContainer, "data-elyric-show-second", show ? "true" : "false");
        if (renderer.__elyricSecondLineButton) {
            setAttributeIfChanged(
                renderer.__elyricSecondLineButton,
                "aria-pressed",
                show ? "true" : "false"
            );
            setAttributeIfChanged(
                renderer.__elyricSecondLineButton,
                "data-elyric-active",
                show ? "true" : "false"
            );
            setAttributeIfChanged(
                renderer.__elyricSecondLineButton,
                "title",
                show ? "隐藏注音/第二行" : "显示注音/第二行"
            );
            setAttributeIfChanged(
                renderer.__elyricSecondLineButton,
                "data-elyric-tooltip",
                show ? "隐藏注音 / 翻译" : "显示注音 / 翻译"
            );
        }
    }

    function createThemeControl(renderer) {
        var control = document.createElement("div");
        control.className = "elyric-player-shell elyric-theme-picker";
        control.setAttribute("data-elyric-control", "player");
        control.setAttribute("role", "region");
        control.setAttribute("aria-label", "歌词增强音乐播放器");
        control.setAttribute("data-elyric-settings-open", "false");

        var topbar = document.createElement("div");
        topbar.className = "elyric-player-topbar";
        topbar.appendChild(createPlayerButton(renderer, "back", "返回", "‹"));
        var topbarTitle = document.createElement("span");
        topbarTitle.className = "elyric-player-topbar-title";
        topbarTitle.appendChild(document.createTextNode("NOW PLAYING"));
        topbar.appendChild(topbarTitle);
        topbar.appendChild(createPlayerButton(renderer, "cast", "在其他设备上播放", "投"));
        control.appendChild(topbar);

        var background = document.createElement("img");
        background.className = "elyric-player-background";
        background.setAttribute("hidden", "hidden");
        background.setAttribute("aria-hidden", "true");
        control.appendChild(background);

        var identity = document.createElement("div");
        identity.className = "elyric-player-identity";

        var artworkStage = document.createElement("div");
        artworkStage.className = "elyric-player-artwork-stage";

        var artwork = document.createElement("img");
        artwork.className = "elyric-player-artwork";
        artwork.setAttribute("hidden", "hidden");
        artworkStage.appendChild(artwork);
        identity.appendChild(artworkStage);
        control.appendChild(identity);

        var metadata = document.createElement("div");
        metadata.className = "elyric-player-metadata";
        var title = document.createElement("div");
        title.className = "elyric-player-title";
        var artist = document.createElement("div");
        artist.className = "elyric-player-artist";
        var album = document.createElement("div");
        album.className = "elyric-player-album";
        metadata.appendChild(title);
        metadata.appendChild(artist);
        metadata.appendChild(album);
        control.appendChild(metadata);

        var transport = document.createElement("div");
        transport.className = "elyric-player-transport";
        transport.appendChild(createPlayerButton(renderer, "previous", "上一首", "⏮"));
        transport.appendChild(createPlayerButton(renderer, "playPause", "播放或暂停", "▶"));
        transport.appendChild(createPlayerButton(renderer, "next", "下一首", "⏭"));
        control.appendChild(transport);

        var progress = document.createElement("div");
        progress.className = "elyric-player-progress";
        var positionText = document.createElement("span");
        positionText.className = "elyric-player-position";
        positionText.appendChild(document.createTextNode("0:00"));
        var progressSlider = document.createElement("input");
        progressSlider.className = "elyric-player-progress-slider";
        progressSlider.setAttribute("type", "range");
        progressSlider.setAttribute("min", "0");
        progressSlider.setAttribute("max", "1000");
        progressSlider.setAttribute("step", "1");
        progressSlider.setAttribute("value", "0");
        progressSlider.setAttribute("aria-label", "播放进度");
        progressSlider.min = "0";
        progressSlider.max = "1000";
        progressSlider.value = "0";
        progressSlider.addEventListener("input", function (event) {
            stopControlEvent(event);
            renderer.__elyricScrubbing = true;
            var runtimeTicks = renderer.__elyricLastRuntimeTicks || 0;
            var previewTicks = Number(progressSlider.value) / 1000 * runtimeTicks;
            replaceElementText(positionText, formatPlayerTime(previewTicks));
        });
        progressSlider.addEventListener("change", function (event) {
            stopControlEvent(event);
            seekFromPlayerControl(renderer);
        });
        var durationText = document.createElement("span");
        durationText.className = "elyric-player-duration";
        durationText.appendChild(document.createTextNode("0:00"));
        progress.appendChild(positionText);
        progress.appendChild(progressSlider);
        progress.appendChild(durationText);
        control.appendChild(progress);

        var volume = document.createElement("div");
        volume.className = "elyric-player-volume";
        volume.appendChild(createPlayerButton(renderer, "mute", "静音", "🔊"));
        var volumeSlider = document.createElement("input");
        volumeSlider.className = "elyric-player-volume-slider";
        volumeSlider.setAttribute("type", "range");
        volumeSlider.setAttribute("min", "0");
        volumeSlider.setAttribute("max", "100");
        volumeSlider.setAttribute("step", "1");
        volumeSlider.setAttribute("value", "100");
        volumeSlider.setAttribute("aria-label", "音量");
        volumeSlider.min = "0";
        volumeSlider.max = "100";
        volumeSlider.value = "100";
        volumeSlider.addEventListener("input", function (event) {
            stopControlEvent(event);
            renderer.__elyricVolumeScrubbing = true;
            volumeFromPlayerControl(renderer, "input");
        });
        volumeSlider.addEventListener("change", function (event) {
            stopControlEvent(event);
            volumeFromPlayerControl(renderer, "change");
        });
        volume.appendChild(volumeSlider);
        control.appendChild(volume);

        var tools = document.createElement("div");
        tools.className = "elyric-player-tools";
        tools.appendChild(createPlayerButton(renderer, "shuffle", "随机播放", "🔀"));
        tools.appendChild(createPlayerButton(renderer, "repeat", "循环模式", "↻"));
        tools.appendChild(createPlayerButton(renderer, "stop", "停止播放", "■"));
        tools.appendChild(createPlayerButton(renderer, "lyrics", "歌词", "词"));
        tools.appendChild(createPlayerButton(renderer, "queue", "播放队列", "列"));

        var secondLineButton = document.createElement("button");
        secondLineButton.className = "elyric-player-button elyric-player-button-secondline";
        secondLineButton.setAttribute("type", "button");
        secondLineButton.setAttribute("aria-label", "显示或隐藏注音");
        secondLineButton.setAttribute("data-elyric-tooltip", "注音 / 翻译");
        secondLineButton.appendChild(document.createTextNode("注音"));
        secondLineButton.addEventListener("click", function (event) {
            stopControlEvent(event);
            renderer.__elyricSecondLineOverridden = true;
            setSecondLineOverride(renderer, !renderer.__elyricLocalShowSecond);
        });
        secondLineButton.addEventListener("pointerdown", stopControlEvent);
        tools.appendChild(secondLineButton);

        var artworkRotationButton = document.createElement("button");
        artworkRotationButton.className = "elyric-player-button elyric-player-button-rotation";
        artworkRotationButton.setAttribute("type", "button");
        artworkRotationButton.setAttribute("aria-label", "开启或停止专辑图旋转");
        artworkRotationButton.setAttribute("data-elyric-tooltip", "封面旋转");
        artworkRotationButton.appendChild(document.createTextNode("旋转"));
        artworkRotationButton.addEventListener("click", function (event) {
            stopControlEvent(event);
            setArtworkRotation(renderer, !renderer.__elyricArtworkRotation, true);
        });
        artworkRotationButton.addEventListener("pointerdown", stopControlEvent);
        tools.appendChild(artworkRotationButton);

        var settingsButton = document.createElement("button");
        settingsButton.className = "elyric-player-button elyric-player-button-settings";
        settingsButton.setAttribute("type", "button");
        settingsButton.setAttribute("aria-label", "播放器设置");
        settingsButton.setAttribute("aria-haspopup", "dialog");
        settingsButton.setAttribute("aria-expanded", "false");
        settingsButton.setAttribute("data-elyric-tooltip", "播放器设置");
        settingsButton.appendChild(document.createTextNode("⚙"));
        settingsButton.addEventListener("click", function (event) {
            stopControlEvent(event);
            setSettingsPanelOpen(renderer, !renderer.__elyricSettingsOpen);
        });
        settingsButton.addEventListener("pointerdown", stopControlEvent);
        tools.appendChild(settingsButton);
        control.appendChild(tools);

        var settingsPanel = document.createElement("div");
        settingsPanel.className = "elyric-player-settings-panel";
        settingsPanel.setAttribute("role", "dialog");
        settingsPanel.setAttribute("aria-label", "播放器设置");
        settingsPanel.setAttribute("hidden", "hidden");

        var settingsHeader = document.createElement("div");
        settingsHeader.className = "elyric-player-settings-header";
        var settingsTitle = document.createElement("strong");
        settingsTitle.appendChild(document.createTextNode("播放器设置"));
        settingsHeader.appendChild(settingsTitle);
        var settingsClose = document.createElement("button");
        settingsClose.className = "elyric-player-settings-close";
        settingsClose.setAttribute("type", "button");
        settingsClose.setAttribute("aria-label", "关闭播放器设置");
        settingsClose.appendChild(document.createTextNode("×"));
        settingsClose.addEventListener("click", function (event) {
            stopControlEvent(event);
            setSettingsPanelOpen(renderer, false);
        });
        settingsHeader.appendChild(settingsClose);
        settingsPanel.appendChild(settingsHeader);

        var label = document.createElement("span");
        label.className = "elyric-theme-picker-label";
        label.appendChild(document.createTextNode("歌词样式"));
        settingsPanel.appendChild(label);

        var select = document.createElement("select");
        select.className = "elyric-theme-select";
        select.setAttribute("aria-label", "歌词样式");
        select.setAttribute("title", "切换歌词样式");
        THEMES.forEach(function (theme) {
            var option = document.createElement("option");
            option.value = theme.id;
            option.appendChild(document.createTextNode(theme.label));
            select.appendChild(option);
        });
        select.value = renderer.__elyricTheme;
        select.addEventListener("change", function () {
            applyTheme(renderer, select.value, true);
        });
        settingsPanel.appendChild(select);
        var themeHelp = document.createElement("small");
        themeHelp.className = "elyric-player-settings-help";
        themeHelp.appendChild(document.createTextNode("只改变逐字高亮表现，不修改歌词内容和时间轴。"));
        settingsPanel.appendChild(themeHelp);

        var layoutLabel = document.createElement("span");
        layoutLabel.className = "elyric-layout-picker-label";
        layoutLabel.appendChild(document.createTextNode("界面布局"));
        settingsPanel.appendChild(layoutLabel);
        var layoutSelect = document.createElement("select");
        layoutSelect.className = "elyric-layout-select";
        layoutSelect.setAttribute("aria-label", "播放器界面");
        layoutSelect.setAttribute("title", "切换播放器界面");
        PLAYER_LAYOUTS.forEach(function (layout) {
            var option = document.createElement("option");
            option.value = layout.id;
            option.appendChild(document.createTextNode(layout.label));
            layoutSelect.appendChild(option);
        });
        layoutSelect.addEventListener("change", function () {
            applyPlayerLayout(renderer, layoutSelect.value, true);
        });
        settingsPanel.appendChild(layoutSelect);
        var layoutHelp = document.createElement("small");
        layoutHelp.className = "elyric-player-settings-help";
        layoutHelp.appendChild(document.createTextNode("专辑双栏、唱片机和歌词优先会同时调整封面与歌词位置。"));
        settingsPanel.appendChild(layoutHelp);

        var toggleHelp = document.createElement("div");
        toggleHelp.className = "elyric-player-settings-note";
        toggleHelp.appendChild(document.createTextNode("底栏“注音”控制第二行；“旋转”仅作用于两个圆形封面布局。系统减少动态效果设置始终优先。"));
        settingsPanel.appendChild(toggleHelp);
        var coreHelp = document.createElement("div");
        coreHelp.className = "elyric-player-settings-note elyric-player-settings-note-muted";
        coreHelp.appendChild(document.createTextNode("播放、队列、进度和音量仍由 Emby 原生会话管理；打开播放队列不会退出增强界面。"));
        settingsPanel.appendChild(coreHelp);
        settingsPanel.addEventListener("click", stopControlEvent);
        settingsPanel.addEventListener("pointerdown", stopControlEvent);

        control.addEventListener("click", stopControlEvent);
        control.addEventListener("pointerdown", stopControlEvent);
        renderer.__elyricThemeSelect = select;
        renderer.__elyricLayoutSelect = layoutSelect;
        renderer.__elyricPlayerBackground = background;
        renderer.__elyricPlayerArtworkStage = artworkStage;
        renderer.__elyricPlayerArtwork = artwork;
        renderer.__elyricPlayerTitle = title;
        renderer.__elyricPlayerArtist = artist;
        renderer.__elyricPlayerAlbum = album;
        renderer.__elyricProgressSlider = progressSlider;
        renderer.__elyricPlayerPosition = positionText;
        renderer.__elyricPlayerDuration = durationText;
        renderer.__elyricVolumeSlider = volumeSlider;
        renderer.__elyricSecondLineButton = secondLineButton;
        renderer.__elyricArtworkRotationButton = artworkRotationButton;
        renderer.__elyricSettingsButton = settingsButton;
        renderer.__elyricSettingsPanel = settingsPanel;
        renderer.__elyricSettingsOpen = false;
        var settingsHost = getThemeControlHost(renderer);
        if (settingsHost && settingsHost.appendChild) {
            settingsHost.appendChild(settingsPanel);
        }
        renderer.__elyricLocalShowSecond = renderer.__elyricDisplayConfiguration
            ? renderer.__elyricDisplayConfiguration.showSecondLine
            : DEFAULT_DISPLAY_CONFIGURATION.showSecondLine;
        setSecondLineOverride(renderer, renderer.__elyricLocalShowSecond);
        applyPlayerLayout(renderer, loadStoredPlayerLayout(), false);
        updatePlayerMetadata(renderer);
        return control;
    }

    function getThemeControlHost(renderer) {
        var container = renderer.itemsContainer;
        if (document.body && document.body.appendChild) {
            return document.body;
        }
        return container;
    }

    function removeStaleThemeControls(host, currentControl, currentSettingsPanel) {
        if (!host || !host.querySelectorAll) {
            return;
        }
        var controls = host.querySelectorAll(".elyric-theme-picker");
        for (var i = 0; i < controls.length; i++) {
            if (controls[i] !== currentControl && controls[i].parentNode) {
                controls[i].parentNode.removeChild(controls[i]);
            }
        }
        var panels = host.querySelectorAll(".elyric-player-settings-panel");
        for (var panelIndex = 0; panelIndex < panels.length; panelIndex++) {
            if (panels[panelIndex] !== currentSettingsPanel && panels[panelIndex].parentNode) {
                panels[panelIndex].parentNode.removeChild(panels[panelIndex]);
            }
        }
    }

    function isThemeContextVisible(renderer) {
        var currentPlayerPage = findPlayerPage(renderer);
        if (currentPlayerPage) {
            renderer.__elyricPlayerPage = currentPlayerPage;
        } else if (renderer.__elyricPlayerPage
            && "boolean" === typeof renderer.__elyricPlayerPage.isConnected
            && !renderer.__elyricPlayerPage.isConnected) {
            renderer.__elyricPlayerPage = null;
        }
        var container = renderer.__elyricPlayerPage || renderer.itemsContainer;
        if (!container) {
            return false;
        }
        if (container.classList && container.classList.contains("hide")) {
            return false;
        }
        if (container.getAttribute && "true" === container.getAttribute("aria-hidden")) {
            return false;
        }
        if ("boolean" === typeof container.isConnected && !container.isConnected) {
            return false;
        }
        if (container.getClientRects && !container.getClientRects().length) {
            return false;
        }
        if (container.getBoundingClientRect
            && container.contains
            && document.elementFromPoint) {
            var rect = container.getBoundingClientRect();
            var left = Math.max(0, rect.left);
            var right = Math.min(
                "undefined" !== typeof window && window.innerWidth ? window.innerWidth : rect.right,
                rect.right
            );
            var top = Math.max(0, rect.top);
            var bottom = Math.min(
                "undefined" !== typeof window && window.innerHeight ? window.innerHeight : rect.bottom,
                rect.bottom
            );
            if (!(right > left && bottom > top)) {
                return false;
            }
            var front = document.elementFromPoint(
                left + (right - left) / 2,
                top + (bottom - top) / 2
            );
            if (front
                && front !== container
                && !container.contains(front)
                && !(front.contains && front.contains(container))
                && !(renderer.__elyricThemeControl
                    && renderer.__elyricThemeControl.contains
                    && renderer.__elyricThemeControl.contains(front))
                && !(renderer.__elyricSettingsPanel
                    && renderer.__elyricSettingsPanel.contains
                    && renderer.__elyricSettingsPanel.contains(front))) {
                return false;
            }
        }
        return true;
    }

    function syncThemeControlVisibility(renderer) {
        var control = renderer.__elyricThemeControl;
        if (!control) {
            return;
        }
        if (isThemeContextVisible(renderer)) {
            removeAttributeIfPresent(control, "hidden");
            setAttributeIfChanged(control, "aria-hidden", "false");
            syncSettingsPanelVisibility(renderer, true);
            syncPlayerPageState(renderer, true);
        } else {
            syncSettingsPanelVisibility(renderer, false);
            setAttributeIfChanged(control, "hidden", "hidden");
            setAttributeIfChanged(control, "aria-hidden", "true");
            syncPlayerPageState(renderer, false);
        }
    }

    function ensureThemeControl(renderer) {
        var container = renderer.itemsContainer;
        if (!container || !container.appendChild || "undefined" === typeof document) {
            return;
        }
        ensureThemeState(renderer);
        applyTheme(renderer, renderer.__elyricTheme, false);

        var visible = isThemeContextVisible(renderer);
        if (!renderer.__elyricThemeControl) {
            if (!visible) {
                return;
            }
            renderer.__elyricThemeControl = createThemeControl(renderer);
            applyPlayerLayout(renderer, renderer.__elyricPlayerLayout, false);
            setArtworkRotation(renderer, loadStoredArtworkRotation(), false);
            applyPlayerShellConfiguration(renderer, renderer.__elyricDisplayConfiguration);
        }
        if (!visible) {
            syncThemeControlVisibility(renderer);
            return;
        }
        var host = getThemeControlHost(renderer);
        removeStaleThemeControls(host, renderer.__elyricThemeControl, renderer.__elyricSettingsPanel);
        if (renderer.__elyricThemeControl.parentNode !== host) {
            host.appendChild(renderer.__elyricThemeControl);
        }
        updatePlayerControl(
            renderer,
            renderer.__elyricLastPositionTicks || 0,
            renderer.__elyricLastRuntimeTicks || 0
        );
        syncThemeControlVisibility(renderer);
    }

    function removeThemeControl(renderer) {
        var control = renderer.__elyricThemeControl;
        if (control && control.parentNode) {
            control.parentNode.removeChild(control);
        }
        if (renderer.__elyricSettingsPanel && renderer.__elyricSettingsPanel.parentNode) {
            renderer.__elyricSettingsPanel.parentNode.removeChild(renderer.__elyricSettingsPanel);
        }
        if (renderer.__elyricThemeContainer && renderer.__elyricThemeContainer.removeAttribute) {
            renderer.__elyricThemeContainer.removeAttribute("data-elyric-theme");
        }
        syncPlayerPageState(renderer, false);
        if (renderer.itemsContainer && renderer.itemsContainer.removeAttribute) {
            renderer.itemsContainer.removeAttribute("data-elyric-player-layout");
        }
        renderer.__elyricThemeControl = null;
        renderer.__elyricThemeSelect = null;
        renderer.__elyricLayoutSelect = null;
        renderer.__elyricThemeContainer = null;
        renderer.__elyricTheme = null;
        renderer.__elyricPlayerLayout = null;
        renderer.__elyricPlayerPage = null;
        renderer.__elyricPlayerBackground = null;
        renderer.__elyricPlayerArtworkStage = null;
        renderer.__elyricPlayerArtwork = null;
        renderer.__elyricPlayerTitle = null;
        renderer.__elyricPlayerArtist = null;
        renderer.__elyricPlayerAlbum = null;
        renderer.__elyricPlayerItemSignature = null;
        renderer.__elyricProgressSlider = null;
        renderer.__elyricPlayerPosition = null;
        renderer.__elyricPlayerDuration = null;
        renderer.__elyricVolumeSlider = null;
        renderer.__elyricSecondLineButton = null;
        renderer.__elyricArtworkRotationButton = null;
        renderer.__elyricArtworkRotation = null;
        renderer.__elyricSettingsButton = null;
        renderer.__elyricSettingsPanel = null;
        renderer.__elyricSettingsOpen = false;
        renderer.__elyricPlayerButtons = null;
        renderer.__elyricScrubbing = false;
        renderer.__elyricVolumeScrubbing = false;
        renderer.__elyricOptimisticPlaying = null;
        renderer.__elyricOptimisticPlayingUntil = 0;
        renderer.__elyricLastPositionTicks = null;
        renderer.__elyricLastRuntimeTicks = null;
    }

    function renderLyricElement(renderer, element) {
        var index = Number(element.getAttribute("data-index"));
        var item = renderer.__elyricItems && renderer.__elyricItems[index];
        if (!item || !item.__elyric) {
            return;
        }

        var renderKey = renderer.__elyricGeneration + ":" + index;
        if (element.getAttribute("data-elyric-render") === renderKey) {
            return;
        }

        var body = element.querySelector(".listItemBodyText");
        if (!body) {
            return;
        }

        while (body.firstChild) {
            body.removeChild(body.firstChild);
        }

        item.__elyric.sublines.forEach(function (line, sublineIndex) {
            var lineElement = document.createElement("div");
            lineElement.className = "elyric-subline elyric-subline-" + (sublineIndex + 1);

            if (line.words) {
                line.words.forEach(function (word) {
                    var wordElement = document.createElement("span");
                    wordElement.className = "elyric-word elyric-word-pending";
                    wordElement.setAttribute("data-elyric-start", String(word.startTicks));
                    wordElement.setAttribute("data-elyric-end", String(word.endTicks));
                    wordElement.setAttribute("data-elyric-state", "pending");
                    appendTextWithBreaks(wordElement, word.text);
                    lineElement.appendChild(wordElement);
                });
            } else {
                appendTextWithBreaks(lineElement, line.text);
            }

            body.appendChild(lineElement);
        });

        element.setAttribute("data-elyric-render", renderKey);
    }

    function renderVisibleLyrics(renderer) {
        var container = renderer.itemsContainer;
        if (!container || !container.querySelectorAll) {
            return;
        }
        var elements = container.querySelectorAll(".lyricsItem[data-index]");
        for (var i = 0; i < elements.length; i++) {
            renderLyricElement(renderer, elements[i]);
        }
    }

    function ensureObserver(renderer) {
        if ("undefined" === typeof MutationObserver) {
            return;
        }
        var container = renderer.itemsContainer;
        if (!container) {
            return;
        }
        var parent = container.parentNode;
        if (renderer.__elyricObserver && renderer.__elyricObservedParent === parent) {
            return;
        }
        if (renderer.__elyricObserver) {
            renderer.__elyricObserver.disconnect();
        }
        renderer.__elyricObserver = new MutationObserver(function () {
            renderVisibleLyrics(renderer);
            ensureThemeControl(renderer);
        });
        renderer.__elyricObserver.observe(container, { childList: true, subtree: true });
        var ancestor = parent;
        while (ancestor) {
            var options = {
                attributes: true,
                attributeFilter: ["aria-hidden", "class", "hidden", "style"]
            };
            if (ancestor === document.body) {
                options.childList = true;
            }
            renderer.__elyricObserver.observe(ancestor, options);
            if (ancestor === document.body) {
                break;
            }
            ancestor = ancestor.parentNode;
        }
        renderer.__elyricObservedParent = parent;
    }

    function setWordState(element, state) {
        if (element.getAttribute("data-elyric-state") === state) {
            return;
        }
        element.classList.remove("elyric-word-pending", "elyric-word-active", "elyric-word-played");
        element.classList.add("elyric-word-" + state);
        element.setAttribute("data-elyric-state", state);
    }

    function setLineState(element, state) {
        if (element.getAttribute("data-elyric-line-state") === state) {
            return;
        }
        element.classList.remove("elyric-line-future", "elyric-line-current", "elyric-line-past");
        element.classList.add("elyric-line-" + state);
        element.setAttribute("data-elyric-line-state", state);
    }

    function updateLineStates(renderer, positionTicks) {
        var container = renderer.itemsContainer;
        if (!container || !container.querySelectorAll) {
            return;
        }
        var elements = container.querySelectorAll(".lyricsItem[data-index]");
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            var index = Number(element.getAttribute("data-index"));
            var item = renderer.__elyricItems && renderer.__elyricItems[index];
            if (!item || !item.__elyric) {
                continue;
            }
            var state = positionTicks < item.__elyric.startTicks
                ? "future"
                : positionTicks >= item.__elyric.endTicks
                    ? "past"
                    : "current";
            setLineState(element, state);
        }
    }

    function updateWordStates(renderer, positionTicks) {
        var container = renderer.itemsContainer;
        if (!container || !container.querySelectorAll) {
            return;
        }
        updateLineStates(renderer, positionTicks);
        var words = container.querySelectorAll("[data-elyric-start][data-elyric-end]");
        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            var startTicks = Number(word.getAttribute("data-elyric-start"));
            var endTicks = Number(word.getAttribute("data-elyric-end"));
            var state = positionTicks < startTicks
                ? "pending"
                : positionTicks >= endTicks
                    ? "played"
                    : "active";
            setWordState(word, state);
        }
    }

    function nowMilliseconds() {
        if ("undefined" !== typeof performance && performance && performance.now) {
            return performance.now();
        }
        return Date.now();
    }

    function cancelSmoothFrame(renderer) {
        if (null != renderer.__elyricFrameId && "undefined" !== typeof cancelAnimationFrame) {
            cancelAnimationFrame(renderer.__elyricFrameId);
        }
        renderer.__elyricFrameId = null;
        if (renderer.__elyricClock) {
            renderer.__elyricClock.running = false;
        }
    }

    function scheduleSmoothFrame(renderer) {
        if (null != renderer.__elyricFrameId || "undefined" === typeof requestAnimationFrame) {
            return;
        }

        renderer.__elyricFrameId = requestAnimationFrame(function (frameNow) {
            renderer.__elyricFrameId = null;
            var clock = renderer.__elyricClock;
            if (!clock || !clock.running || ("undefined" !== typeof document && document.hidden)) {
                cancelSmoothFrame(renderer);
                return;
            }

            var elapsedMs = Math.max(0, frameNow - clock.anchorNow);
            var interpolatedMs = Math.min(elapsedMs, MAX_INTERPOLATION_MS);
            var positionTicks = clock.anchorPositionTicks
                + interpolatedMs * TICKS_PER_SECOND / 1000;
            if (clock.runtimeTicks > 0) {
                positionTicks = Math.min(positionTicks, clock.runtimeTicks);
            }
            updateWordStates(renderer, positionTicks);

            if (elapsedMs < MAX_INTERPOLATION_MS
                && (!clock.runtimeTicks || positionTicks < clock.runtimeTicks)) {
                scheduleSmoothFrame(renderer);
            } else {
                clock.running = false;
            }
        });
    }

    function syncSmoothClock(renderer, positionTicks, runtimeTicks) {
        positionTicks = Number(positionTicks);
        runtimeTicks = Number(runtimeTicks);
        if (!isFinite(positionTicks)) {
            cancelSmoothFrame(renderer);
            return;
        }

        var now = nowMilliseconds();
        var clock = renderer.__elyricClock;
        if (!clock) {
            clock = renderer.__elyricClock = {
                anchorNow: now,
                anchorPositionTicks: positionTicks,
                lastNativeNow: null,
                lastNativePositionTicks: null,
                runtimeTicks: 0,
                running: false
            };
        }

        var running = false;
        if (null != clock.lastNativeNow && null != clock.lastNativePositionTicks) {
            var wallDeltaMs = now - clock.lastNativeNow;
            var positionDeltaMs = (positionTicks - clock.lastNativePositionTicks)
                / TICKS_PER_SECOND * 1000;
            running = wallDeltaMs > 0
                && positionDeltaMs >= Math.max(1, wallDeltaMs * .1)
                && positionDeltaMs <= wallDeltaMs * 2.5 + 250;
        }

        clock.anchorNow = now;
        clock.anchorPositionTicks = positionTicks;
        clock.lastNativeNow = now;
        clock.lastNativePositionTicks = positionTicks;
        clock.runtimeTicks = isFinite(runtimeTicks) && runtimeTicks > 0 ? runtimeTicks : 0;
        clock.running = running && !("undefined" !== typeof document && document.hidden);

        if (clock.running) {
            scheduleSmoothFrame(renderer);
        } else {
            cancelSmoothFrame(renderer);
        }
    }

    LyricsRenderer.prototype.getItemsInternal = function () {
        var renderer = this;
        return originalGetItemsInternal.apply(this, arguments).then(function (events) {
            renderer.__elyricDestroyed = false;
            renderer.__elyricGeneration = (renderer.__elyricGeneration || 0) + 1;
            renderer.__elyricItems = prepareEnhancedLyrics(events);
            ensureObserver(renderer);
            ensureDisplayConfiguration(renderer);
            ensureThemeControl(renderer);
            return renderer.__elyricItems;
        });
    };

    LyricsRenderer.prototype.onTimeUpdate = function (positionTicks, runtimeTicks) {
        originalOnTimeUpdate.apply(this, arguments);
        ensureObserver(this);
        ensureDisplayConfiguration(this);
        ensureThemeControl(this);
        updatePlayerControl(this, positionTicks, runtimeTicks);
        renderVisibleLyrics(this);
        updateWordStates(this, positionTicks);
        syncSmoothClock(this, positionTicks, runtimeTicks);
    };

    LyricsRenderer.prototype.destroy = function () {
        this.__elyricDestroyed = true;
        cancelSmoothFrame(this);
        removeDisplayConfiguration(this);
        removeThemeControl(this);
        if (this.__elyricObserver) {
            this.__elyricObserver.disconnect();
        }
        this.__elyricObserver = null;
        this.__elyricObservedParent = null;
        this.__elyricItems = null;
        this.__elyricClock = null;
        return originalDestroy.apply(this, arguments);
    };
})();
/* ELYRIC_ENHANCE_END:4.9.5.0 */
