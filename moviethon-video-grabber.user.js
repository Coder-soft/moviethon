// ==UserScript==
// @name         MovieThon Video Grabber
// @namespace    https://netfilm.world/
// @version      2.2
// @description  Capture CDN video URLs from netfilm.world and play in a clean overlay player with custom controls and episode switcher
// @author       moviethon-tools
// @match        *://netfilm.world/*
// @match        *://*.netfilm.world/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    "use strict";

    console.log("[MT Grabber] Script loaded — waiting for video sources...");

    let captured = null;
    let playerOverlay = null;
    let sourceEntries = [];
    let storedAuth = null;
    let epPanelVisible = true;
    let activeKeydownHandler = null;

    let meta = {
        subjectId: null,
        subjectType: null,
        seasons: [],
        curSe: null,
        curEp: null,
        title: "",
    };

    var lastDetailUrl = "";
    function mi(n) {
        var icons = {
            "smart_display": '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>',
            "close": '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
            "play_arrow": '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
            "pause": '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
            "skip_previous": '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>',
            "skip_next": '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>',
            "volume_up": '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
            "volume_down": '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>',
            "volume_off": '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
            "fullscreen": '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
            "view_list": '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>',
            "picture_in_picture_alt": '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/></svg>',
            "lock": '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg>',
        };
        return icons[n] || n;
    }

    /* ─── Inject styles (marquee-lamp cinema theme: navy + cream-gold) ─── */
    var stylesInjected = false;
    function injectStyles() {
        if (stylesInjected || !document.head) return;
        stylesInjected = true;
        var style = document.createElement("style");
        style.id = "mt-grabber-styles";
        style.textContent = [
            "svg{display:inline-block;vertical-align:middle}",
            "@keyframes mtSpin{to{transform:rotate(360deg)}}",
            "@keyframes mtFadeIn{from{opacity:0}to{opacity:1}}",
            "@keyframes mtFadeOut{to{opacity:0}}",
            "@keyframes mtScaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}",
            "@keyframes mtSlideUp{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}",
            "@keyframes mtPulseRing{0%{box-shadow:0 4px 16px rgba(0,0,0,.5),0 0 0 0 rgba(250,237,200,.45)}70%{box-shadow:0 4px 16px rgba(0,0,0,.5),0 0 0 10px rgba(250,237,200,0)}100%{box-shadow:0 4px 16px rgba(0,0,0,.5),0 0 0 0 rgba(250,237,200,0)}}",
            "@keyframes mtDotPulse{0%,100%{opacity:1}50%{opacity:.35}}",
            "@keyframes mtFlashPop{0%{opacity:0;transform:translate(-50%,-50%) scale(.6)}25%{opacity:1;transform:translate(-50%,-50%) scale(1.05)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.25)}}",

            "#mt-grabber-overlay{animation:mtFadeIn .2s ease}",
            "#mt-grabber-overlay.mt-closing{animation:mtFadeOut .15s ease forwards}",
            "#mt-grabber-overlay *{box-sizing:border-box}",

            "#mt-grab-btn{position:fixed;z-index:999998;bottom:20px;right:20px;width:50px;height:50px;border-radius:50%;background:linear-gradient(145deg,#22223a,#16162a);border:2px solid #FAEDC8;color:#FAEDC8;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.5);transition:transform .18s cubic-bezier(.34,1.56,.64,1),box-shadow .18s ease,border-color .18s ease;font-family:sans-serif;user-select:none}",
            "#mt-grab-btn:hover{transform:scale(1.1) rotate(-4deg);box-shadow:0 6px 24px rgba(0,0,0,.7);border-color:#fff}",
            "#mt-grab-btn:active{transform:scale(.96)}",
            "#mt-grab-btn.mt-pulse{animation:mtPulseRing 1.5s ease-out 3}",
            "#mt-grab-btn .mt-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#ff6b6b;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:sans-serif;box-shadow:0 0 0 2px #1a1a2e}",

            "#mt-status-dot{position:fixed;z-index:999997;bottom:8px;right:8px;width:8px;height:8px;border-radius:50%;background:#666;box-shadow:0 0 4px rgba(0,0,0,.5);transition:background .3s ease}",
            "#mt-status-dot.mt-live{background:#4ade80;animation:mtDotPulse 2s ease-in-out infinite}",

            "#mt-topbar{background:linear-gradient(180deg,rgba(0,0,0,.9),rgba(0,0,0,.5) 70%,transparent);transition:opacity .25s ease}",
            "#mt-topbar.mt-hidden{opacity:0;pointer-events:none}",
            ".mt-brand{display:flex;align-items:baseline;gap:10px;min-width:0}",
            ".mt-brand-name{color:#FAEDC8;font-size:13px;font-weight:700;letter-spacing:.3px;flex-shrink:0}",
            ".mt-title{color:rgba(255,255,255,.75);font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:320px}",
            ".mt-ep-badge{color:rgba(250,237,200,.85);font-size:11px;background:rgba(250,237,200,.1);border:1px solid rgba(250,237,200,.22);border-radius:20px;padding:2px 9px;flex-shrink:0}",
            ".mt-source-tag{color:rgba(255,255,255,.4);font-size:10px;letter-spacing:.5px;border:1px solid rgba(255,255,255,.15);border-radius:4px;padding:2px 6px;flex-shrink:0}",

            ".mt-select{appearance:none;-webkit-appearance:none;background:rgba(255,255,255,.08) url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FAEDC8' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>\") no-repeat right 8px center/14px;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:6px 26px 6px 10px;font-size:12px;outline:none;cursor:pointer;transition:border-color .15s ease,background-color .15s ease}",
            ".mt-select:hover{border-color:rgba(250,237,200,.4);background-color:rgba(255,255,255,.12)}",

            ".mt-icon-btn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px;transition:background .15s ease,border-color .15s ease,transform .1s ease}",
            ".mt-icon-btn:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.3)}",
            ".mt-icon-btn:active{transform:scale(.94)}",
            ".mt-icon-btn.mt-accent{color:#FAEDC8;border-color:rgba(250,237,200,.3)}",
            ".mt-icon-btn.mt-accent:hover{background:rgba(250,237,200,.12)}",
            ".mt-icon-btn.mt-danger:hover{background:rgba(255,107,107,.15);border-color:rgba(255,107,107,.4);color:#ff9b9b}",

            "#mt-video-wrap{overflow:hidden;min-height:0}",
            "#mt-video{cursor:pointer}",

            "#mt-loading{display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);align-items:center;gap:10px;color:rgba(255,255,255,.65);font-size:13px;letter-spacing:.2px;background:rgba(0,0,0,.45);padding:10px 18px;border-radius:30px;backdrop-filter:blur(4px);z-index:6}",
            "#mt-loading::before{content:'';width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.2);border-top-color:#FAEDC8;animation:mtSpin .7s linear infinite;flex-shrink:0}",

            "#mt-error{position:absolute;bottom:104px;left:50%;transform:translateX(-50%);display:none;max-width:60%;text-align:center;z-index:20;color:#ff9b9b;font-size:12px;animation:mtSlideUp .2s ease;background:rgba(20,10,10,.85);border:1px solid rgba(255,107,107,.35);padding:10px 16px;border-radius:10px;backdrop-filter:blur(6px)}",
            "#mt-error::before{content:'⚠';margin-right:8px}",

            "#mt-ep-panel{animation:mtScaleIn .18s ease}",
            "#mt-ep-grid::-webkit-scrollbar{width:6px}",
            "#mt-ep-grid::-webkit-scrollbar-track{background:transparent}",
            "#mt-ep-grid::-webkit-scrollbar-thumb{background:rgba(250,237,200,.2);border-radius:4px}",
            "#mt-ep-grid::-webkit-scrollbar-thumb:hover{background:rgba(250,237,200,.35)}",

            ".mt-season-tab{background:transparent;color:rgba(255,255,255,.5);border:1px solid transparent;border-radius:6px;padding:4px 12px;font-size:12px;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:background .15s ease,color .15s ease,border-color .15s ease}",
            ".mt-season-tab.mt-active{background:rgba(250,237,200,.18);color:#FAEDC8;border-color:rgba(250,237,200,.35)}",
            ".mt-season-tab:hover:not(.mt-active){background:rgba(250,237,200,.08)}",

            ".mt-ep-cell{background:rgba(255,255,255,.06);color:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:7px 0;font-size:12px;cursor:pointer;text-align:center;font-weight:500;transition:background .15s ease,border-color .15s ease,transform .1s ease}",
            ".mt-ep-cell.mt-active{background:#FAEDC8;color:#1a1a2e;border-color:#FAEDC8;font-weight:700;box-shadow:0 2px 10px rgba(250,237,200,.3)}",
            ".mt-ep-cell:hover:not(.mt-active){background:rgba(250,237,200,.15);border-color:rgba(250,237,200,.3)}",
            ".mt-ep-cell:active{transform:scale(.93)}",

            /* Custom playback controls */
            ".mt-center-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;background:rgba(0,0,0,.5);border:2px solid rgba(255,255,255,.7);color:#fff;font-size:22px;display:none;align-items:center;justify-content:center;cursor:pointer;transition:background .15s ease,transform .15s ease;padding-left:4px;z-index:5}",
            ".mt-center-play:hover{background:rgba(0,0,0,.7);transform:translate(-50%,-50%) scale(1.08)}",

            ".mt-flash-icon{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:30px;color:#fff;background:rgba(0,0,0,.55);width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:none;animation:mtFlashPop .55s ease forwards;z-index:7}",

            "#mt-controls{position:absolute;left:0;right:0;bottom:0;padding:8px 16px 12px;background:linear-gradient(0deg,rgba(0,0,0,.85),rgba(0,0,0,.55) 65%,transparent);transition:opacity .25s ease;z-index:4}",
            "#mt-controls.mt-hidden{opacity:0;pointer-events:none}",

            ".mt-progress{position:relative;height:5px;border-radius:3px;background:rgba(255,255,255,.2);cursor:pointer;margin-bottom:10px;transition:height .12s ease;touch-action:none}",
            ".mt-progress:hover{height:7px}",
            ".mt-progress-buffered{position:absolute;top:0;left:0;height:100%;background:rgba(255,255,255,.32);border-radius:3px;width:0%}",
            ".mt-progress-played{position:absolute;top:0;left:0;height:100%;background:#FAEDC8;border-radius:3px;width:0%}",
            ".mt-progress-thumb{position:absolute;top:50%;width:13px;height:13px;border-radius:50%;background:#FAEDC8;transform:translate(-50%,-50%);left:0%;box-shadow:0 0 0 3px rgba(250,237,200,.25);opacity:0;transition:opacity .12s ease}",
            ".mt-progress:hover .mt-progress-thumb,.mt-progress.mt-dragging .mt-progress-thumb{opacity:1}",
            ".mt-progress-tooltip{position:absolute;bottom:16px;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#fff;font-size:11px;padding:3px 7px;border-radius:5px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .12s ease}",
            ".mt-progress:hover .mt-progress-tooltip,.mt-progress.mt-dragging .mt-progress-tooltip{opacity:1}",

            ".mt-controls-row{display:flex;align-items:center;gap:4px}",
            ".mt-ctrl-btn{background:none;border:none;color:#fff;font-size:16px;cursor:pointer;width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:background .15s ease,color .15s ease,transform .1s ease;flex-shrink:0}",
            ".mt-ctrl-btn:hover{background:rgba(255,255,255,.12);color:#FAEDC8}",
            ".mt-ctrl-btn:active{transform:scale(.9)}",
            ".mt-time{color:rgba(255,255,255,.75);font-size:12px;font-variant-numeric:tabular-nums;flex-shrink:0;margin-left:2px;white-space:nowrap}",
            ".mt-spacer{flex:1}",
            ".mt-volume-wrap{display:flex;align-items:center;gap:2px}",
            ".mt-volume-slider{width:0;opacity:0;transition:width .18s ease,opacity .18s ease;accent-color:#FAEDC8;cursor:pointer;height:4px}",
            ".mt-volume-wrap:hover .mt-volume-slider,.mt-volume-wrap:focus-within .mt-volume-slider{width:64px;opacity:1;margin-left:2px}",
            ".mt-speed-select{padding:4px 22px 4px 8px;font-size:11px}",

            "#mt-grabber-overlay button:focus-visible,#mt-grabber-overlay select:focus-visible,#mt-grab-btn:focus-visible{outline:2px solid #FAEDC8;outline-offset:2px}",

            "@media (max-width:720px){#mt-ep-panel{position:absolute;right:0;top:0;bottom:0;width:78vw;max-width:300px;box-shadow:-8px 0 24px rgba(0,0,0,.5)}.mt-title{max-width:140px}}",
            "@media (max-width:480px){.mt-speed-select{display:none}.mt-time{font-size:11px}.mt-controls-row{gap:2px}}",

            "@media (prefers-reduced-motion:reduce){#mt-grabber-overlay,#mt-grabber-overlay *,#mt-grab-btn,#mt-status-dot{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important}}",
        ].join("\n");
        document.head.appendChild(style);
    }
    var styleTimer = setInterval(function() {
        if (document.head) { injectStyles(); clearInterval(styleTimer); }
    }, 50);
    setTimeout(function() { clearInterval(styleTimer); }, 5000);

    /* ─── Intercept fetch ─── */
    const origFetch = window.fetch;
    if (origFetch) {
        window.fetch = function(input, init) {
            var url = typeof input === "string" ? input : (input && input.url ? input.url : "");
            if (init && init.headers) {
                var h = init.headers;
                if (h.Authorization) storedAuth = h.Authorization;
                else if (h.authorization) storedAuth = h.authorization;
                else if (h instanceof Headers && h.has("Authorization")) storedAuth = h.get("Authorization");
            }
            return origFetch.call(window, input, init).then(function(response) {
                if (url.indexOf("/subject/play") !== -1) {
                    var clone = response.clone();
                    clone.json().then(function(data) {
                        if (data && data.data && (data.data.dash || data.data.hls || data.data.streams)) {
                            captureSources(data.data);
                        }
                    }).catch(function() {});
                }
                if (url.indexOf("/detail") !== -1 && url.indexOf("/subject/") === -1) {
                    var clone = response.clone();
                    clone.json().then(function(data) {
                        if (data && data.data) captureDetail(data.data);
                    }).catch(function() {});
                }
                return response;
            });
        };
    }

    /* ─── Intercept XHR ─── */
    var OrigXHR = window.XMLHttpRequest;
    if (OrigXHR) {
        var origOpen = OrigXHR.prototype.open;
        var origSend = OrigXHR.prototype.send;
        var origSetHeader = OrigXHR.prototype.setRequestHeader;

        OrigXHR.prototype.setRequestHeader = function(key, value) {
            if ((key === "Authorization" || key === "authorization") && value) storedAuth = value;
            return origSetHeader.apply(this, arguments);
        };

        OrigXHR.prototype.open = function(method, url) {
            this._mtUrl = typeof url === "string" ? url : "";
            return origOpen.apply(this, arguments);
        };

        OrigXHR.prototype.send = function(body) {
            var xhr = this;
            var origReady = xhr.onreadystatechange;
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr._mtUrl) {
                    try {
                        if (xhr._mtUrl.indexOf("/subject/play") !== -1) {
                            var data = JSON.parse(xhr.responseText);
                            if (data && data.data && (data.data.dash || data.data.hls || data.data.streams)) {
                                captureSources(data.data);
                            }
                        }
                        if (xhr._mtUrl.indexOf("/detail") !== -1 && xhr._mtUrl.indexOf("/subject/") === -1) {
                            var data = JSON.parse(xhr.responseText);
                            if (data && data.data) captureDetail(data.data);
                        }
                    } catch(e) {}
                }
                if (origReady) origReady.apply(xhr, arguments);
            };
            return origSend.apply(this, arguments);
        };
    }

    /* ─── Detail capture ─── */
    function captureDetail(data) {
        meta.subjectId = data.subject?.subjectId || null;
        meta.subjectType = data.subject?.subjectType || null;
        meta.seasons = (data.resource?.seasons || []).map(function(s) {
            return { se: s.se, allEp: s.allEp || "", maxEp: s.maxEp || 0 };
        });
        meta.title = data.subject?.title || "";
        meta.curSe = null;
        meta.curEp = null;

        /* Read current se/ep from page if available */
        if (meta.seasons.length) {
            var last = meta.seasons[meta.seasons.length - 1];
            meta.curSe = last.se;
            meta.curEp = last.allEp ? parseInt(last.allEp.split(",")[0], 10) : 1;
        }

        var el = document.getElementById("mt-grabber-overlay");
        if (el) rebuildEpisodeView();
    }

    /* ─── Source capture ─── */
    function captureSources(data) {
        captured = data;
        sourceEntries = [];

        (data.streams || []).forEach(function(s) {
            sourceEntries.push({ type: "MP4", res: s.resolutions, codec: "h264", url: s.url, vipLocked: s.vipLocked });
        });
        (data.hls || []).forEach(function(s) {
            sourceEntries.push({ type: "HLS", res: s.resolutions, codec: "h264", url: s.url, signHeaderKey: s.signHeaderKey, signCookie: s.signCookie, vipLocked: s.vipLocked });
        });
        (data.dash || []).forEach(function(s) {
            sourceEntries.push({ type: "DASH", res: s.resolutions, codec: s.codecName || "h264", url: s.url, signHeaderKey: s.signHeaderKey, signCookie: s.signCookie, prePlayApi: s.prePlayApi, vipLocked: s.vipLocked });
        });

        sourceEntries.sort(function(a, b) { return parseInt(b.res, 10) - parseInt(a.res, 10); });

        console.log("[MT Grabber] Captured", sourceEntries.length, "sources:", sourceEntries.map(function(s) {
            return s.type + " " + s.res + "p" + (s.vipLocked ? " [VIP]" : "");
        }));

        showGrabButton();
        updateGrabBadge();
        pulseGrabButton();

        /* Refresh overlay if open */
        if (playerOverlay) refreshPlayerSources();
    }

    /* ─── Fetch play API ─── */
    function fetchPlayApi(subjectId, se, ep) {
        var slug = location.pathname.split("/").filter(Boolean).pop();
        var utm = new URLSearchParams(location.search).get("utm_source") || "";
        var base = /(localhost|10\.|h5-test)/i.test(location.origin)
            ? "https://h5-api-test.aoneroom.com"
            : location.origin;

        var url = base + "/wefeed-h5api-bff/subject/play"
            + "?subjectId=" + (subjectId || "")
            + "&se=" + se + "&ep=" + ep
            + "&detailPath=" + slug + "&streamSignType=1";

        var headers = {
            Accept: "application/json",
            "X-Client-Info": JSON.stringify({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
            "X-Source": utm,
        };
        if (storedAuth) headers.Authorization = storedAuth;

        console.log("[MT Grabber] Fetching play API:", url.replace(storedAuth ? storedAuth : "", "[token]"));
        return fetch(url, { headers: headers }).then(function(r) { return r.json(); });
    }

    /* ─── Hit prePlayApi ─── */
    function hitPrePlayApis(playData) {
        if (!playData || !playData.dash) return;
        var seen = {};
        playData.dash.forEach(function(s) {
            if (s.prePlayApi && !seen[s.prePlayApi]) {
                seen[s.prePlayApi] = true;
                fetch(s.prePlayApi, { credentials: "include", mode: "cors", referrerPolicy: "unsafe-url" }).catch(function() {});
            }
        });
    }

    /* ─── Fallback: scrape from page store after load ─── */
    function tryScrapeFromPage() {
        try {
            /* Try Vuex store ($store or Vue app root) */
            var app = document.querySelector("#__nuxt") || document.querySelector("#app");
            var rootEl = app && app.__vue__ ? app.__vue__ : null;

            /* Try global Vue store references */
            var stores = [];
            if (window.$nuxt && window.$nuxt.$store) stores.push(window.$nuxt.$store);
            if (window.__NUXT__) stores.push(window.__NUXT__);
            if (window.store) stores.push(window.store);
            if (rootEl && rootEl.$store) stores.push(rootEl.$store);
            if (rootEl && rootEl.$root) stores.push(rootEl.$root);

            /* Search all stores for play data (dash/hls/streams arrays) */
            stores.forEach(function(store) {
                if (!store || !store.state) return;
                searchState(store.state);
                /* Also search __ob__ / reactive wrappers */
                if (store.state.__ob__) searchState(store.state.__ob__.value);
            });

            function searchState(obj) {
                if (!obj || typeof obj !== "object") return;
                try {
                    if ((obj.dash && Array.isArray(obj.dash) && obj.dash.length) ||
                        (obj.hls && Array.isArray(obj.hls) && obj.hls.length) ||
                        (obj.streams && Array.isArray(obj.streams) && obj.streams.length)) {
                        if (!captured) captureSources(obj);
                        return;
                    }
                    for (var k in obj) {
                        if (obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k])) {
                            if ((obj[k].dash || obj[k].hls || obj[k].streams)) {
                                if (!captured) captureSources(obj[k]);
                                return;
                            }
                        }
                    }
                } catch(e) {}
            }

            /* Try reading from Vue app __vue__ internals */
            if (!captured) {
                var allEls = document.querySelectorAll("*");
                for (var i = 0; i < allEls.length; i++) {
                    var v = allEls[i].__vue__;
                    if (v && v.$data) {
                        searchState(v.$data);
                    }
                    if (v && v._data) {
                        searchState(v._data);
                    }
                }
            }

            /* Try window level variables from the Vue app */
            if (!captured && window.__INITIAL_STATE__) {
                searchState(window.__INITIAL_STATE__);
            }

            /* Try the Vue app's data by checking script tags */
            if (!captured) {
                var scripts = document.querySelectorAll("script");
                for (var si = 0; si < scripts.length; si++) {
                    var text = scripts[si].textContent || "";
                    if (text.indexOf("dash") > -1 && text.indexOf("streams") > -1) {
                        try {
                            /* Look for JSON-like patterns: "dash":[{...}] */
                            var match = text.match(/"dash"\s*:\s*\[[^\]]+\]/);
                            if (match) {
                                console.log("[MT Grabber] Found dash data in script tag, attempting parse...");
                            }
                        } catch(e) {}
                    }
                }
            }
        } catch(e) {}
    }

    var fallbackTimer = setInterval(function() {
        if (captured) { clearInterval(fallbackTimer); return; }
        tryScrapeFromPage();
    }, 500);
    setTimeout(function() { clearInterval(fallbackTimer); }, 15000);

    /* ─── Status indicator (tiny dot shows script is alive) ─── */
    var statusDot = null;
    function addStatusDot() {
        if (statusDot || !document.body) return;
        injectStyles();
        statusDot = document.createElement("div");
        statusDot.id = "mt-status-dot";
        if (captured) statusDot.classList.add("mt-live");
        statusDot.title = captured ? "Video captured ✓" : "MT Grabber active — waiting for video...";
        document.body.appendChild(statusDot);
    }
    var dotTimer = setInterval(function() {
        if (document.body) { clearInterval(dotTimer); addStatusDot(); }
    }, 100);
    setTimeout(function() { clearInterval(dotTimer); }, 5000);

    /* ─── Floating grab button ─── */
    var grabBtn = null;

    function showGrabButton() {
        if (statusDot) { statusDot.classList.add("mt-live"); statusDot.title = "Video captured ✓"; }
        if (grabBtn) return;
        if (!document.body) { setTimeout(showGrabButton, 50); return; }
        injectStyles();
        grabBtn = document.createElement("div");
        grabBtn.id = "mt-grab-btn";
        grabBtn.innerHTML = mi("smart_display");
        grabBtn.title = "Open Video Player";
        grabBtn.tabIndex = 0;
        grabBtn.setAttribute("role", "button");
        grabBtn.addEventListener("click", openPlayer);
        grabBtn.addEventListener("keydown", function(e) {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPlayer(); }
        });
        document.body.appendChild(grabBtn);
    }

    /* ─── Badge + pulse feedback on the grab button ─── */
    function updateGrabBadge() {
        if (!grabBtn) return;
        var badge = grabBtn.querySelector(".mt-badge");
        if (!badge) {
            badge = document.createElement("div");
            badge.className = "mt-badge";
            grabBtn.appendChild(badge);
        }
        badge.textContent = sourceEntries.length;
    }
    function pulseGrabButton() {
        if (!grabBtn) return;
        grabBtn.classList.remove("mt-pulse");
        void grabBtn.offsetWidth; /* restart animation */
        grabBtn.classList.add("mt-pulse");
    }

    /* ─── Get playable sources from sourceEntries ─── */
    function getPlayableSources() {
        var mp4 = sourceEntries.filter(function(s) { return s.type === "MP4" && !s.vipLocked; });
        if (!mp4.length) mp4 = sourceEntries.filter(function(s) { return s.type === "MP4"; });
        var hls = sourceEntries.filter(function(s) { return s.type === "HLS" && !s.vipLocked; });
        if (!hls.length) hls = sourceEntries.filter(function(s) { return s.type === "HLS"; });
        var dash = sourceEntries.filter(function(s) { return s.type === "DASH" && !s.vipLocked; });
        if (!dash.length) dash = sourceEntries.filter(function(s) { return s.type === "DASH"; });
        var pick = mp4.length ? mp4 : (hls.length ? hls : dash);
        return { sources: pick, type: mp4.length ? "native" : (hls.length ? "hls" : "dash") };
    }

    /* ─── Get default source index (MP4 720p preferred) ─── */
    function getDefaultIdx(sources) {
        var idx = 0;
        sources.forEach(function(s, i) {
            if (s.type === "MP4" && s.res === "720") idx = i;
        });
        if (idx === 0 && sources[0] && sources[0].type !== "MP4") {
            sources.forEach(function(s, i) {
                if (s.type === "MP4" && parseInt(s.res, 10) <= 720 &&
                    parseInt(s.res, 10) > parseInt(sources[idx].res || "0", 10)) idx = i;
            });
        }
        return idx;
    }

    /* ─── Get ep list for a season ─── */
    function getEpList(season) {
        if (season.allEp) return season.allEp.split(",").map(Number);
        if (season.maxEp) { var arr = []; for (var i = 1; i <= season.maxEp; i++) arr.push(i); return arr; }
        return [];
    }

    /* ─── Format seconds as m:ss / h:mm:ss ─── */
    function fmtTime(sec) {
        if (!isFinite(sec) || sec < 0) sec = 0;
        sec = Math.floor(sec);
        var h = Math.floor(sec / 3600);
        var m = Math.floor((sec % 3600) / 60);
        var s = sec % 60;
        var mm = (h > 0 && m < 10) ? "0" + m : String(m);
        var ss = s < 10 ? "0" + s : String(s);
        return h > 0 ? (h + ":" + mm + ":" + ss) : (m + ":" + ss);
    }

    /* ─── Player overlay ─── */
    function openPlayer() {
        if (playerOverlay) return;
        if (!captured) return;

        injectStyles();
        hitPrePlayApis(captured);

        var ps = getPlayableSources();
        if (!ps.sources.length) return;

        playerOverlay = document.createElement("div");
        playerOverlay.id = "mt-grabber-overlay";
        Object.assign(playerOverlay.style, {
            position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
            zIndex: "999999", background: "#000",
            display: "flex", flexDirection: "column",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        });

        var isSeries = meta.subjectType === 2 && meta.seasons.length > 0;
        var titleSafe = (meta.title || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        var epBadgeText = (isSeries && meta.curSe && meta.curEp) ? ("S" + meta.curSe + " · E" + meta.curEp) : "";

        playerOverlay.innerHTML = [
            /* Top bar */
            '<div id="mt-topbar" style="display:flex;align-items:center;justify-content:space-between;padding:8px 16px;z-index:10;flex-shrink:0;gap:12px">',
            '<div class="mt-brand">',
            '<span class="mt-brand-name">' + mi("smart_display") + ' MovieThon</span>',
            titleSafe ? '<span class="mt-title" title="' + titleSafe + '">' + titleSafe + '</span>' : '',
            epBadgeText ? '<span class="mt-ep-badge" id="mt-ep-badge">' + epBadgeText + '</span>' : '',
            '<span class="mt-source-tag" id="mt-source-type">' + ps.type.toUpperCase() + '</span>',
            '</div>',
            '<div style="display:flex;gap:8px;align-items:center;flex-shrink:0">',
            '<select id="mt-quality-select" class="mt-select"></select>',
            isSeries ? '<button id="mt-toggle-ep" class="mt-icon-btn mt-accent" title="Toggle episode list">' + mi("view_list") + ' Episodes</button>' : '',
            '<button id="mt-close-btn" class="mt-icon-btn mt-danger" title="Close">' + mi("close") + '</button>',
            '</div></div>',
            /* Main area: video + ep panel */
            '<div style="display:flex;flex:1;min-height:0">',
            '<div id="mt-video-wrap" style="flex:1;display:flex;align-items:center;justify-content:center;position:relative;min-width:0">',
            '<video id="mt-video" autoplay playsinline style="width:100%;height:100%;object-fit:contain;outline:none"></video>',
            '<div id="mt-loading">Loading…</div>',
            '<button id="mt-center-play" class="mt-center-play" title="Play">' + mi("play_arrow") + '</button>',
            /* Custom control bar */
            '<div id="mt-controls" class="mt-controls">',
            '<div id="mt-progress" class="mt-progress">',
            '<div id="mt-progress-buffered" class="mt-progress-buffered"></div>',
            '<div id="mt-progress-played" class="mt-progress-played"></div>',
            '<div id="mt-progress-thumb" class="mt-progress-thumb"></div>',
            '<div id="mt-progress-tooltip" class="mt-progress-tooltip">0:00</div>',
            '</div>',
            '<div class="mt-controls-row">',
'<button id="mt-play-btn" class="mt-ctrl-btn" title="Play/Pause (space)">' + mi("play_arrow") + '</button>',
'<button id="mt-back-btn" class="mt-ctrl-btn" title="Back 10s (←)">' + mi("skip_previous") + '</button>',
'<button id="mt-fwd-btn" class="mt-ctrl-btn" title="Forward 10s (→)">' + mi("skip_next") + '</button>',
            '<span id="mt-time-display" class="mt-time">0:00 / 0:00</span>',
            '<div class="mt-spacer"></div>',
            '<div class="mt-volume-wrap">',
            '<button id="mt-mute-btn" class="mt-ctrl-btn" title="Mute (m)">' + mi("volume_up") + '</button>',
            '<input id="mt-volume-slider" class="mt-volume-slider" type="range" min="0" max="1" step="0.01" value="1">',
            '</div>',
            '<select id="mt-speed-select" class="mt-select mt-speed-select" title="Playback speed">',
            '<option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option>',
            '</select>',
'<button id="mt-pip-btn" class="mt-ctrl-btn" title="Picture-in-picture">' + mi("picture_in_picture_alt") + '</button>',
'<button id="mt-fullscreen-btn" class="mt-ctrl-btn" title="Fullscreen (f)">' + mi("fullscreen") + '</button>',
            '</div></div>',
            '</div>',
            /* Episode panel (right side) */
            isSeries ? '<div id="mt-ep-panel" style="width:300px;flex-shrink:0;background:rgba(10,10,20,0.95);border-left:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;overflow:hidden">' +
                '<div style="padding:12px 14px 8px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0">' +
                '<div style="display:flex;align-items:center;justify-content:space-between">' +
                '<span style="color:#FAEDC8;font-size:13px;font-weight:600">' + mi("view_list") + ' Episodes</span>' +
                '<button id="mt-close-ep" class="mt-icon-btn" style="padding:2px 8px;border:none;background:none" title="Hide panel">' + mi("close") + '</button>' +
                '</div>' +
            /* Season tabs */
            '<div id="mt-season-tabs" style="display:flex;gap:4px;margin-top:8px;overflow-x:auto;flex-shrink:0"></div>' +
                '</div>' +
                /* Episode grid */
                '<div id="mt-ep-grid" style="flex:1;overflow-y:auto;padding:10px 14px;display:grid;grid-template-columns:repeat(5,1fr);gap:6px;align-content:start"></div>' +
                '</div>' : '',
            '</div>',
            /* Error */
            '<div id="mt-error"></div>',
        ].join("");

        document.body.appendChild(playerOverlay);

        var video = playerOverlay.querySelector("#mt-video");
        var loading = playerOverlay.querySelector("#mt-loading");
        var errorEl = playerOverlay.querySelector("#mt-error");
        var statusEl = playerOverlay.querySelector("#mt-source-type");
        var sel = playerOverlay.querySelector("#mt-quality-select");
        var videoWrap = playerOverlay.querySelector("#mt-video-wrap");
        var topbarEl = playerOverlay.querySelector("#mt-topbar");
        var controlsEl = playerOverlay.querySelector("#mt-controls");

        /* ─── Quality selector ─── */
        ps.sources.forEach(function(s, i) {
            var opt = document.createElement("option");
            opt.value = i;
            opt.innerHTML = s.type + " " + s.res + "p" + (s.vipLocked ? " " + mi("lock") : "");
            sel.appendChild(opt);
        });
        var defaultIdx = getDefaultIdx(ps.sources);
        sel.value = defaultIdx;

        var currentSrcIdx = defaultIdx;
        var currentPlayData = captured;

        /* ─── Load source ─── */
        function loadSource(idx, playData) {
            var src = (playData ? getPlayableSourcesFrom(playData) : ps).sources[parseInt(idx, 10)];
            if (!src) return;
            currentSrcIdx = parseInt(idx, 10);

            video.pause();
            video.removeAttribute("src");
            video.load();
            errorEl.style.display = "none";

            if (playData && playData !== currentPlayData) {
                hitPrePlayApis(playData);
                currentPlayData = playData;
            }

            if (src.type === "MP4") {
                statusEl.textContent = "MP4";
                loading.style.display = "flex";
                video.removeAttribute("crossOrigin");
                video.src = src.url;
                video.load();
                video.play().catch(function() {});
                video.addEventListener("loadeddata", function onLoaded() {
                    loading.style.display = "none";
                    video.removeEventListener("loadeddata", onLoaded);
                }, { once: true });
                video.addEventListener("error", function onErr() {
                    loading.style.display = "none";
                    errorEl.textContent = "Failed to load MP4. Check console.";
                    errorEl.style.display = "block";
                    video.removeEventListener("error", onErr);
                }, { once: true });
            } else if (src.type === "HLS") {
                statusEl.textContent = "HLS";
                loadHls(video, src, loading, errorEl);
            } else if (src.type === "DASH") {
                statusEl.textContent = "DASH";
                loadDash(video, src, loading, errorEl);
            }
        }

        sel.addEventListener("change", function() { loadSource(this.value, currentPlayData); });
        loadSource(sel.value, currentPlayData);

        /* ─── Custom playback controls ─── */
        var playBtn = playerOverlay.querySelector("#mt-play-btn");
        var backBtn = playerOverlay.querySelector("#mt-back-btn");
        var fwdBtn = playerOverlay.querySelector("#mt-fwd-btn");
        var timeDisplay = playerOverlay.querySelector("#mt-time-display");
        var muteBtn = playerOverlay.querySelector("#mt-mute-btn");
        var volumeSlider = playerOverlay.querySelector("#mt-volume-slider");
        var speedSelect = playerOverlay.querySelector("#mt-speed-select");
        var pipBtn = playerOverlay.querySelector("#mt-pip-btn");
        var fsBtn = playerOverlay.querySelector("#mt-fullscreen-btn");
        var centerPlay = playerOverlay.querySelector("#mt-center-play");
        var progress = playerOverlay.querySelector("#mt-progress");
        var progressBuffered = playerOverlay.querySelector("#mt-progress-buffered");
        var progressPlayed = playerOverlay.querySelector("#mt-progress-played");
        var progressThumb = playerOverlay.querySelector("#mt-progress-thumb");
        var progressTooltip = playerOverlay.querySelector("#mt-progress-tooltip");

        function flashIcon(text) {
            var el = document.createElement("div");
            el.className = "mt-flash-icon";
            el.innerHTML = text;
            videoWrap.appendChild(el);
            el.addEventListener("animationend", function() { el.remove(); });
        }

        function togglePlay() {
            if (video.paused) { video.play().catch(function() {}); flashIcon(mi("play_arrow")); }
            else { video.pause(); flashIcon(mi("pause")); }
        }
        function toggleMute() { video.muted = !video.muted; }
        function toggleFullscreen() {
            if (document.fullscreenElement) document.exitFullscreen();
            else playerOverlay.requestFullscreen();
        }
        function skipBack() { video.currentTime = Math.max(0, video.currentTime - 10); flashIcon(mi("skip_previous")); }
        function skipFwd() {
            var dur = video.duration;
            video.currentTime = isFinite(dur) ? Math.min(dur, video.currentTime + 10) : video.currentTime + 10;
            flashIcon(mi("skip_next"));
        }

        function updatePlayIcon() {
            var paused = video.paused || video.ended;
            playBtn.innerHTML = paused ? mi("play_arrow") : mi("pause");
            playBtn.title = (paused ? "Play" : "Pause") + " (space)";
            centerPlay.style.display = paused ? "flex" : "none";
        }
        function updateVolumeIcon() {
            var vol = video.muted ? 0 : video.volume;
            muteBtn.innerHTML = vol === 0 ? mi("volume_off") : (vol < 0.5 ? mi("volume_down") : mi("volume_up"));
            volumeSlider.value = vol;
        }
        function updateProgress() {
            var dur = video.duration;
            var cur = video.currentTime;
            if (isFinite(dur) && dur > 0) {
                var pct = Math.min(100, (cur / dur) * 100);
                progressPlayed.style.width = pct + "%";
                progressThumb.style.left = pct + "%";
                timeDisplay.textContent = fmtTime(cur) + " / " + fmtTime(dur);
            } else {
                timeDisplay.textContent = fmtTime(cur) + " / LIVE";
            }
            try {
                if (video.buffered.length) {
                    var end = video.buffered.end(video.buffered.length - 1);
                    var bufPct = (isFinite(dur) && dur > 0) ? Math.min(100, (end / dur) * 100) : 0;
                    progressBuffered.style.width = bufPct + "%";
                }
            } catch(e) {}
        }

        /* Progress bar scrubbing */
        var dragging = false;
        function seekFromEvent(e) {
            var rect = progress.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var pct = Math.min(1, Math.max(0, x / rect.width));
            var dur = video.duration;
            if (isFinite(dur) && dur > 0) {
                var t = pct * dur;
                progressTooltip.textContent = fmtTime(t);
                progressTooltip.style.left = (pct * 100) + "%";
                return { pct: pct, time: t };
            }
            return null;
        }
        progress.addEventListener("pointerdown", function(e) {
            dragging = true;
            progress.classList.add("mt-dragging");
            try { progress.setPointerCapture(e.pointerId); } catch(err) {}
            var r = seekFromEvent(e);
            if (r) { video.currentTime = r.time; progressPlayed.style.width = (r.pct * 100) + "%"; progressThumb.style.left = (r.pct * 100) + "%"; }
            showControlsUI();
        });
        progress.addEventListener("pointermove", function(e) {
            var r = seekFromEvent(e);
            if (dragging && r) { video.currentTime = r.time; progressPlayed.style.width = (r.pct * 100) + "%"; progressThumb.style.left = (r.pct * 100) + "%"; }
        });
        progress.addEventListener("pointerup", function(e) {
            dragging = false;
            progress.classList.remove("mt-dragging");
            try { progress.releasePointerCapture(e.pointerId); } catch(err) {}
        });

        playBtn.addEventListener("click", togglePlay);
        centerPlay.addEventListener("click", togglePlay);
        video.addEventListener("click", togglePlay);
        videoWrap.addEventListener("dblclick", toggleFullscreen);
        backBtn.addEventListener("click", skipBack);
        fwdBtn.addEventListener("click", skipFwd);
        muteBtn.addEventListener("click", toggleMute);
        volumeSlider.addEventListener("input", function() {
            video.volume = parseFloat(this.value);
            video.muted = video.volume === 0;
        });
        speedSelect.addEventListener("change", function() { video.playbackRate = parseFloat(this.value); });

        if (document.pictureInPictureEnabled) {
            pipBtn.addEventListener("click", function() {
                if (document.pictureInPictureElement) document.exitPictureInPicture().catch(function() {});
                else video.requestPictureInPicture().catch(function() {});
            });
        } else {
            pipBtn.style.display = "none";
        }
        fsBtn.addEventListener("click", toggleFullscreen);

        video.addEventListener("play", updatePlayIcon);
        video.addEventListener("pause", updatePlayIcon);
        video.addEventListener("ended", updatePlayIcon);
        video.addEventListener("volumechange", updateVolumeIcon);
        video.addEventListener("timeupdate", updateProgress);
        video.addEventListener("progress", updateProgress);
        video.addEventListener("loadedmetadata", updateProgress);
        updatePlayIcon();
        updateVolumeIcon();
        updateProgress();

        /* Auto-hide chrome during playback */
        var hideTimer = null;
        function showControlsUI() {
            topbarEl.classList.remove("mt-hidden");
            controlsEl.classList.remove("mt-hidden");
            playerOverlay.style.cursor = "";
            clearTimeout(hideTimer);
            if (!video.paused) hideTimer = setTimeout(hideControlsUI, 2800);
        }
        function hideControlsUI() {
            if (video.paused || dragging) return;
            topbarEl.classList.add("mt-hidden");
            controlsEl.classList.add("mt-hidden");
            playerOverlay.style.cursor = "none";
        }
        playerOverlay.addEventListener("mousemove", showControlsUI);
        playerOverlay.addEventListener("mouseleave", function() { if (!video.paused) hideControlsUI(); });
        video.addEventListener("play", showControlsUI);
        video.addEventListener("pause", showControlsUI);
        showControlsUI();

        /* ─── Episode panel ─── */
        if (isSeries) {
            buildEpisodeView();

            playerOverlay.querySelector("#mt-toggle-ep").addEventListener("click", function() {
                var panel = playerOverlay.querySelector("#mt-ep-panel");
                var vis = panel.style.display !== "none";
                panel.style.display = vis ? "none" : "flex";
                epPanelVisible = !vis;
            });
            playerOverlay.querySelector("#mt-close-ep").addEventListener("click", function() {
                playerOverlay.querySelector("#mt-ep-panel").style.display = "none";
                epPanelVisible = false;
            });
        }

        /* ─── Close ─── */
        playerOverlay.querySelector("#mt-close-btn").addEventListener("click", closePlayer);

        /* ─── Keyboard shortcuts (Escape, space, arrows, m, f) ─── */
        activeKeydownHandler = function(e) {
            if (e.key === "Escape") { closePlayer(); return; }
            var tag = (document.activeElement && document.activeElement.tagName) || "";
            if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
            if (e.key === " " || e.key === "k" || e.key === "K") { e.preventDefault(); togglePlay(); showControlsUI(); }
            else if (e.key === "ArrowRight") { skipFwd(); showControlsUI(); }
            else if (e.key === "ArrowLeft") { skipBack(); showControlsUI(); }
            else if (e.key === "ArrowUp") { e.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); showControlsUI(); }
            else if (e.key === "ArrowDown") { e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); showControlsUI(); }
            else if (e.key === "m" || e.key === "M") { toggleMute(); showControlsUI(); }
            else if (e.key === "f" || e.key === "F") { toggleFullscreen(); showControlsUI(); }
        };
        document.addEventListener("keydown", activeKeydownHandler);
    }

    /* ─── Get playable sources from arbitrary play data ─── */
    function getPlayableSourcesFrom(playData) {
        var all = [];
        (playData.streams || []).forEach(function(s) { all.push({ type: "MP4", res: s.resolutions, codec: "h264", url: s.url, vipLocked: s.vipLocked }); });
        (playData.hls || []).forEach(function(s) { all.push({ type: "HLS", res: s.resolutions, codec: "h264", url: s.url, signHeaderKey: s.signHeaderKey, signCookie: s.signCookie, vipLocked: s.vipLocked }); });
        (playData.dash || []).forEach(function(s) { all.push({ type: "DASH", res: s.resolutions, codec: s.codecName || "h264", url: s.url, signHeaderKey: s.signHeaderKey, signCookie: s.signCookie, prePlayApi: s.prePlayApi, vipLocked: s.vipLocked }); });
        all.sort(function(a, b) { return parseInt(b.res, 10) - parseInt(a.res, 10); });
        var mp4 = all.filter(function(s) { return s.type === "MP4" && !s.vipLocked; });
        if (!mp4.length) mp4 = all.filter(function(s) { return s.type === "MP4"; });
        var hls = all.filter(function(s) { return s.type === "HLS" && !s.vipLocked; });
        if (!hls.length) hls = all.filter(function(s) { return s.type === "HLS"; });
        var dash = all.filter(function(s) { return s.type === "DASH" && !s.vipLocked; });
        if (!dash.length) dash = all.filter(function(s) { return s.type === "DASH"; });
        return { sources: mp4.length ? mp4 : (hls.length ? hls : dash), type: mp4.length ? "native" : (hls.length ? "hls" : "dash") };
    }

    /* ─── Switch episode ─── */
    function switchToEpisode(se, ep) {
        if (!meta.subjectId) return;
        var overlay = document.getElementById("mt-grabber-overlay");
        if (!overlay) return;
        var loading = overlay.querySelector("#mt-loading");
        var errorEl = overlay.querySelector("#mt-error");
        if (!loading) return;

        meta.curSe = se;
        meta.curEp = ep;
        errorEl.style.display = "none";
        loading.style.display = "flex";
        loading.textContent = "Loading episode " + ep + "…";

        console.log("[MT Grabber] Switching to S" + se + " E" + ep);
        fetchPlayApi(meta.subjectId, se, ep).then(function(data) {
            if (data && data.data && (data.data.dash || data.data.hls || data.data.streams)) {
                captureSources(data.data);
            } else {
                loading.style.display = "none";
                errorEl.textContent = "No sources for this episode.";
                errorEl.style.display = "block";
            }
        }).catch(function(err) {
            loading.style.display = "none";
            errorEl.textContent = "Failed to load episode: " + (err.message || "unknown");
            errorEl.style.display = "block";
        });
    }

    /* ─── Refresh player when new sources arrive ─── */
    function refreshPlayerSources() {
        var overlay = document.getElementById("mt-grabber-overlay");
        if (!overlay) return;
        var video = overlay.querySelector("#mt-video");
        var sel = overlay.querySelector("#mt-quality-select");
        var loading = overlay.querySelector("#mt-loading");
        var errorEl = overlay.querySelector("#mt-error");
        var statusEl = overlay.querySelector("#mt-source-type");
        if (!sel) return;

        var ps = getPlayableSources();
        if (!ps.sources.length) {
            loading.style.display = "none";
            errorEl.textContent = "No playable sources.";
            errorEl.style.display = "block";
            return;
        }

        /* Rebuild quality selector */
        sel.innerHTML = "";
        ps.sources.forEach(function(s, i) {
            var opt = document.createElement("option");
            opt.value = i;
            opt.innerHTML = s.type + " " + s.res + "p" + (s.vipLocked ? " " + mi("lock") : "");
            sel.appendChild(opt);
        });
        var defaultIdx = getDefaultIdx(ps.sources);
        sel.value = defaultIdx;

        /* Load default source */
        video.pause();
        video.removeAttribute("src");
        video.load();

        var src = ps.sources[defaultIdx];
        if (src.type === "MP4") {
            statusEl.textContent = "MP4";
            video.removeAttribute("crossOrigin");
            video.src = src.url;
            video.load();
            video.play().catch(function() {});
            video.addEventListener("loadeddata", function onLoaded() {
                loading.style.display = "none";
                video.removeEventListener("loadeddata", onLoaded);
            }, { once: true });
            video.addEventListener("error", function onErr() {
                loading.style.display = "none";
                video.removeEventListener("error", onErr);
            }, { once: true });
        } else if (src.type === "HLS" && window.Hls) {
            loadHls(video, src, loading, errorEl);
        } else if (src.type === "DASH" && window.dashjs) {
            loadDash(video, src, loading, errorEl);
        }

        sel.addEventListener("change", function() {
            var ps2 = getPlayableSources();
            var src2 = ps2.sources[parseInt(this.value, 10)];
            if (!src2) return;
            video.pause();
            video.removeAttribute("src");
            video.load();
            if (src2.type === "MP4") {
                video.removeAttribute("crossOrigin");
                video.src = src2.url;
                video.load();
                video.play().catch(function() {});
            }
        });

        /* Update episode highlight + badge */
        updateEpisodeHighlight();

        /* Update error */
        loading.style.display = "none";
    }

    /* ─── Build episode view ─── */
    function buildEpisodeView() {
        var overlay = document.getElementById("mt-grabber-overlay");
        if (!overlay) return;

        var tabsContainer = overlay.querySelector("#mt-season-tabs");
        var gridContainer = overlay.querySelector("#mt-ep-grid");
        if (!tabsContainer || !gridContainer || !meta.seasons.length) return;

        tabsContainer.innerHTML = "";
        var seasonIdx = 0;

        /* Determine current season */
        if (meta.curSe) {
            for (var i = 0; i < meta.seasons.length; i++) {
                if (meta.seasons[i].se === meta.curSe) { seasonIdx = i; break; }
            }
        }

        /* Season tabs (show only if >1 season) */
        if (meta.seasons.length > 1) {
            meta.seasons.forEach(function(s, i) {
                var tab = document.createElement("button");
                tab.textContent = s.se;
                tab.className = "mt-season-tab" + (i === seasonIdx ? " mt-active" : "");
                tab.addEventListener("click", function() { selectSeason(i); });
                tabsContainer.appendChild(tab);
            });
        }

        renderEpisodeGrid(seasonIdx);

        function selectSeason(idx) {
            var tabs = tabsContainer.querySelectorAll("button");
            tabs.forEach(function(t, i) {
                t.classList.toggle("mt-active", i === idx);
            });
            renderEpisodeGrid(idx);
        }

        function renderEpisodeGrid(seasonIdx) {
            var season = meta.seasons[seasonIdx];
            if (!season) return;
            var epList = getEpList(season);
            gridContainer.innerHTML = "";
            epList.forEach(function(ep) {
                var btn = document.createElement("button");
                btn.textContent = ep;
                var isActive = meta.curSe === season.se && meta.curEp === ep;
                btn.className = "mt-ep-cell" + (isActive ? " mt-active" : "");
                btn.addEventListener("click", function() {
                    meta.curSe = season.se;
                    meta.curEp = ep;
                    switchToEpisode(season.se, ep);
                });
                gridContainer.appendChild(btn);
            });
        }
    }

    function rebuildEpisodeView() {
        var existing = document.getElementById("mt-grabber-overlay");
        if (!existing) return;
        var grid = existing.querySelector("#mt-ep-grid");
        if (!grid) return;
        /* Just rebuild after a short delay to let meta settle */
        setTimeout(buildEpisodeView, 100);
    }

    function updateEpisodeHighlight() {
        var overlay = document.getElementById("mt-grabber-overlay");
        if (!overlay) return;

        var badge = overlay.querySelector("#mt-ep-badge");
        if (badge && meta.curSe && meta.curEp) badge.textContent = "S" + meta.curSe + " · E" + meta.curEp;

        var grid = overlay.querySelector("#mt-ep-grid");
        if (!grid) return;
        var btns = grid.querySelectorAll("button");
        btns.forEach(function(btn) {
            var ep = parseInt(btn.textContent, 10);
            var isActive = !!meta.curSe && meta.curEp === ep;
            btn.classList.toggle("mt-active", isActive);
        });
    }

    /* ─── HLS playback ─── */
    function loadHls(video, src, loading, errorEl) {
        if (window.Hls && window.Hls.isSupported()) {
            playHlsWithHlsJs(video, src, loading, errorEl);
        } else {
            loading.style.display = "flex";
            var script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
            script.onload = function() {
                if (window.Hls && window.Hls.isSupported()) playHlsWithHlsJs(video, src, loading, errorEl);
                else {
                    loading.style.display = "none";
                    errorEl.textContent = "HLS not supported in this browser."; errorEl.style.display = "block";
                }
            };
            script.onerror = function() {
                loading.style.display = "none";
                errorEl.textContent = "Failed to load HLS.js."; errorEl.style.display = "block";
            };
            document.head.appendChild(script);
        }
    }

    function playHlsWithHlsJs(video, src, loading, errorEl) {
        if (video._mtHls) { video._mtHls.destroy(); }
        var hls = new Hls({
            xhrSetup: function(xhr) {
                if (src.signHeaderKey && src.signCookie) {
                    try { xhr.setRequestHeader(src.signHeaderKey, src.signCookie); } catch(e) {}
                }
            },
        });
        video._mtHls = hls;
        hls.loadSource(src.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function() { loading.style.display = "none"; video.play().catch(function() {}); });
        hls.on(Hls.Events.ERROR, function(ev, data) {
            if (data.fatal) {
                loading.style.display = "none";
                errorEl.textContent = "HLS error: " + (data.details || data.type || "unknown");
                errorEl.style.display = "block";
                console.error("[MT Grabber] HLS fatal:", data);
            }
        });
        loading.style.display = "flex";
    }

    /* ─── DASH playback ─── */
    function loadDash(video, src, loading, errorEl) {
        if (window.dashjs && window.dashjs.MediaPlayer().isSupported()) {
            playDashWithDashJs(video, src, loading, errorEl);
        } else {
            loading.style.display = "flex";
            var script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/dashjs@latest/dist/dash.all.min.js";
            script.onload = function() {
                if (window.dashjs && window.dashjs.MediaPlayer().isSupported()) playDashWithDashJs(video, src, loading, errorEl);
                else {
                    loading.style.display = "none";
                    errorEl.textContent = "DASH not supported."; errorEl.style.display = "block";
                }
            };
            script.onerror = function() {
                loading.style.display = "none";
                errorEl.textContent = "Failed to load dash.js."; errorEl.style.display = "block";
            };
            document.head.appendChild(script);
        }
    }

    function playDashWithDashJs(video, src, loading, errorEl) {
        if (video._mtDash) { video._mtDash.reset(); }
        var player = dashjs.MediaPlayer().create();
        video._mtDash = player;
        player.initialize(video, src.url, true);
        player.on(dashjs.MediaPlayer.events.ERROR, function(e) {
            loading.style.display = "none";
            errorEl.textContent = "DASH error"; errorEl.style.display = "block";
            console.error("[MT Grabber] DASH error:", e);
        });
        player.on(dashjs.MediaPlayer.events.CAN_PLAY, function() { loading.style.display = "none"; });
        loading.style.display = "flex";
    }

    /* ─── Cleanup ─── */
    function closePlayer() {
        if (playerOverlay) {
            var video = playerOverlay.querySelector("#mt-video");
            if (video) {
                video.pause();
                video.removeAttribute("src");
                video.load();
                if (video._mtHls) { video._mtHls.destroy(); delete video._mtHls; }
                if (video._mtDash) { video._mtDash.reset(); delete video._mtDash; }
            }
            if (activeKeydownHandler) {
                document.removeEventListener("keydown", activeKeydownHandler);
                activeKeydownHandler = null;
            }
            var overlayEl = playerOverlay;
            overlayEl.classList.add("mt-closing");
            setTimeout(function() { overlayEl.remove(); }, 150);
            playerOverlay = null;
        }
    }

    /* ─── SPA navigations ─── */
    var lastUrl = location.href;
    setInterval(function() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            captured = null;
            sourceEntries = [];
            meta = { subjectId: null, subjectType: null, seasons: [], curSe: null, curEp: null, title: "" };
            if (grabBtn) { grabBtn.remove(); grabBtn = null; }
            if (statusDot) statusDot.classList.remove("mt-live");
        }
    }, 1000);
})();