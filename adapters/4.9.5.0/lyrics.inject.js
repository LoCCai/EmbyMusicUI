/* ELYRIC_ENHANCE_BEGIN:4.9.5.0 */
;(function () {
    "use strict";

    var TICKS_PER_SECOND = 10000000;
    var MAX_INTERPOLATION_MS = 800;
    var THEME_STORAGE_KEY = "emby-lyric-enhance.theme";
    var PUBLIC_CONFIGURATION_PATH = "EmbyLyricEnhance/PublicConfiguration";
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

    function activeApiClient() {
        if ("undefined" !== typeof ApiClient && ApiClient && ApiClient.getJSON) {
            return ApiClient;
        }
        if ("undefined" !== typeof window && window.ApiClient && window.ApiClient.getJSON) {
            return window.ApiClient;
        }
        return null;
    }

    function requestServerConfiguration() {
        if (serverConfigurationPromise) {
            return serverConfigurationPromise;
        }
        var apiClient = activeApiClient();
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
            container.setAttribute("data-elyric-show-second", configuration.showSecondLine ? "true" : "false");
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
    }

    function ensureDisplayConfiguration(renderer) {
        if (!renderer.__elyricDisplayConfiguration) {
            applyDisplayConfiguration(renderer, null);
        }
        if (renderer.__elyricConfigurationRequested) {
            return;
        }
        var request = requestServerConfiguration();
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
        // Share one request between renderers that overlap during page transitions,
        // but fetch again after leaving lyrics so newly saved server settings apply.
        serverConfigurationPromise = null;
    }

    function stopControlEvent(event) {
        if (event && event.stopPropagation) {
            event.stopPropagation();
        }
    }

    function createThemeControl(renderer) {
        var control = document.createElement("div");
        control.className = "elyric-theme-picker";
        control.setAttribute("data-elyric-control", "theme");

        var label = document.createElement("span");
        label.className = "elyric-theme-picker-label";
        label.appendChild(document.createTextNode("歌词样式"));
        control.appendChild(label);

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
        control.appendChild(select);

        control.addEventListener("click", stopControlEvent);
        control.addEventListener("pointerdown", stopControlEvent);
        renderer.__elyricThemeSelect = select;
        return control;
    }

    function getThemeControlHost(renderer) {
        var container = renderer.itemsContainer;
        if (document.body && document.body.appendChild) {
            return document.body;
        }
        return container;
    }

    function removeStaleThemeControls(host, currentControl) {
        if (!host || !host.querySelectorAll) {
            return;
        }
        var controls = host.querySelectorAll(".elyric-theme-picker");
        for (var i = 0; i < controls.length; i++) {
            if (controls[i] !== currentControl && controls[i].parentNode) {
                controls[i].parentNode.removeChild(controls[i]);
            }
        }
    }

    function isThemeContextVisible(renderer) {
        var container = renderer.itemsContainer;
        if (!container) {
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
                && !(front.contains && front.contains(container))) {
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
            control.removeAttribute("hidden");
            control.setAttribute("aria-hidden", "false");
        } else {
            control.setAttribute("hidden", "hidden");
            control.setAttribute("aria-hidden", "true");
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
        }
        if (!visible) {
            syncThemeControlVisibility(renderer);
            return;
        }
        var host = getThemeControlHost(renderer);
        removeStaleThemeControls(host, renderer.__elyricThemeControl);
        if (renderer.__elyricThemeControl.parentNode !== host) {
            host.appendChild(renderer.__elyricThemeControl);
        }
        syncThemeControlVisibility(renderer);
    }

    function removeThemeControl(renderer) {
        var control = renderer.__elyricThemeControl;
        if (control && control.parentNode) {
            control.parentNode.removeChild(control);
        }
        if (renderer.__elyricThemeContainer && renderer.__elyricThemeContainer.removeAttribute) {
            renderer.__elyricThemeContainer.removeAttribute("data-elyric-theme");
        }
        renderer.__elyricThemeControl = null;
        renderer.__elyricThemeSelect = null;
        renderer.__elyricThemeContainer = null;
        renderer.__elyricTheme = null;
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
