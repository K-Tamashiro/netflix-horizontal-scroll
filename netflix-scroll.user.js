// ==UserScript==
// @name         Netflix Shift+Wheel & MX MASTER Horizontal Scroll
// @namespace    http://tampermonkey.net/
// @version      3.5
// @description  NetflixでShift+縦ホイール、およびMX MASTERのサイドホイールでサムネイルを即座に消して横スクロールさせます
// @author       Tamayan
// @match        https://www.netflix.com/*
// @match        https://*.netflix.com/*
// @updateURL    https://raw.githubusercontent.com/K-Tamashiro/netflix-horizontal-scroll/master/netflix-scroll.user.js
// @downloadURL  https://raw.githubusercontent.com/K-Tamashiro/netflix-horizontal-scroll/master/netflix-scroll.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // スクロール中にプレビュー領域を一時隠蔽するCSS
    const style = document.createElement('style');
    style.textContent = `
        body.is-wheel-scrolling .bob-card-portal,
        body.is-wheel-scrolling .bob-container,
        body.is-wheel-scrolling .jawBoneContainer,
        body.is-wheel-scrolling .previewModal--wrapper,
        body.is-wheel-scrolling .mini-modal,
        body.is-wheel-scrolling .bob-card,
        body.is-wheel-scrolling .jawbone-wrapper {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }
    `;
    document.head.appendChild(style);

    let isSessionActive = false;
    let sessionTimer = null;
    let lastDirection = 0; // 1: 右 (NEXT), -1: 左 (PREV)

    // 回転が止まったと判定する時間（150msに短縮してレスポンス向上）
    const SESSION_TIMEOUT = 150;

    const ROW_SELECTORS = [
        '[data-uia="carousel-scroller"]',
        '[data-uia*="row"]',
        '.lolomoRow',
        '.rowContainer',
        '.slider',
        '.ptrack-container'
    ].join(',');

    const NEXT_SELECTORS = [
        'button[data-uia="carousel-right-button"]',
        '[data-uia="control-row-next"]',
        '[data-uia*="next"]',
        '.handleNext',
        '.handle-next',
        '[class*="handleNext"]',
        '[class*="handle-next"]'
    ].join(',');

    const PREV_SELECTORS = [
        'button[data-uia="carousel-left-button"]',
        '[data-uia="control-row-prev"]',
        '[data-uia*="prev"]',
        '.handlePrev',
        '.handle-prev',
        '[class*="handlePrev"]',
        '[class*="handle-prev"]'
    ].join(',');

    function isHorizontalScroll(e) {
        return e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
    }

    function safeClick(btn) {
        if (!btn) return false;
        try {
            btn.click();
        } catch (err) {
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        }
        return true;
    }

    window.addEventListener('wheel', function(e) {
        if (!isHorizontalScroll(e)) return;

        // Netflix側のネイティブスクロール・イベントを強制停止
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const rawDelta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        
        // 慣性の最後に残る微小なノイズ数値を無視（誤動作防止）
        if (Math.abs(rawDelta) < 1) return;

        const currentDirection = rawDelta > 0 ? 1 : -1;

        // 【重要】回転の「向き」が変わった場合は、前回のセッションを即座に破棄して解除
        if (currentDirection !== lastDirection) {
            isSessionActive = false;
            clearTimeout(sessionTimer);
        }
        lastDirection = currentDirection;

        // プレビュー表示制御
        document.body.classList.add('is-wheel-scrolling');

        // 回転停止の検知タイマー
        clearTimeout(sessionTimer);
        sessionTimer = setTimeout(() => {
            isSessionActive = false;
            lastDirection = 0;
            document.body.classList.remove('is-wheel-scrolling');
        }, SESSION_TIMEOUT);

        // 同一方向への回転継続中で、すでに1回移動済みの場合は残りの慣性を破棄
        if (isSessionActive) return;

        // 毎回最新のDOMからスクロール対象の行を取得（要素崩れ・固まり対策）
        let row = e.target.closest(ROW_SELECTORS);
        if (!row) {
            const pointElem = document.elementFromPoint(e.clientX, e.clientY);
            if (pointElem) row = pointElem.closest(ROW_SELECTORS);
        }

        if (!row) return;

        if (currentDirection > 0) {
            const nextBtn = row.querySelector(NEXT_SELECTORS) || row.parentElement?.querySelector(NEXT_SELECTORS);
            if (safeClick(nextBtn)) {
                isSessionActive = true;
            }
        } else if (currentDirection < 0) {
            const prevBtn = row.querySelector(PREV_SELECTORS) || row.parentElement?.querySelector(PREV_SELECTORS);
            if (safeClick(prevBtn)) {
                isSessionActive = true;
            }
        }
    }, { passive: false, capture: true });
})();
