// ==UserScript==
// @name         Netflix Shift+Wheel & MX MASTER Horizontal Scroll
// @namespace    http://tampermonkey.net/
// @version      3.0
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

    let isWaiting = false;

    // 操作に応じた間引き時間（ミリ秒）
    const THROTTLE_SHIFT = 350;     // Shift + 縦ホイール用（レスポンス重視）
    const THROTTLE_SIDE = 950;      // MX Master サイドホイール用（慣性・暴走防止）
    const CLEAR_TIME = 300;

    let lockedRow = null;
    let lockTimer = null;

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

    const PREVIEW_SELECTORS = [
        '.bob-card-portal',
        '.bob-container',
        '.jawBoneContainer',
        '.previewModal--wrapper',
        '.mini-modal',
        '.bob-card',
        '.jawbone-wrapper'
    ].join(',');

    function isHorizontalScroll(e) {
        return e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
    }

    // デフォルトのブラウザスクロールを防止
    window.addEventListener('wheel', function(e) {
        if (isHorizontalScroll(e)) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, { passive: false });

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

        // 拡大サムネイルの一時隠蔽
        const activeModals = document.querySelectorAll(PREVIEW_SELECTORS);
        activeModals.forEach(modal => {
            modal.style.display = 'none';
            modal.style.pointerEvents = 'none';
        });

        // スクロール対象の「行」を検出
        let row = lockedRow;
        if (!row) {
            row = e.target.closest(ROW_SELECTORS);
            if (!row) {
                const pointElem = document.elementFromPoint(e.clientX, e.clientY);
                if (pointElem) row = pointElem.closest(ROW_SELECTORS);
            }
            if (row) {
                lockedRow = row;
            }
        }

        // 表示復元タイマー
        clearTimeout(lockTimer);
        lockTimer = setTimeout(() => {
            lockedRow = null;
            activeModals.forEach(modal => {
                modal.style.display = '';
                modal.style.pointerEvents = '';
            });
        }, CLEAR_TIME);

        // クールダウン中、または対象行がない場合はスキップ
        if (!row || isWaiting) return;

        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        
        // サイドホイール（Shiftなし＆deltaX主導）かどうかの判別
        const isSideWheel = !e.shiftKey && Math.abs(e.deltaX) > Math.abs(e.deltaY);
        const cooldown = isSideWheel ? THROTTLE_SIDE : THROTTLE_SHIFT;

        if (delta > 0) {
            const nextBtn = row.querySelector(NEXT_SELECTORS) || row.parentElement?.querySelector(NEXT_SELECTORS);
            if (safeClick(nextBtn)) triggerThrottle(cooldown);
        } else if (delta < 0) {
            const prevBtn = row.querySelector(PREV_SELECTORS) || row.parentElement?.querySelector(PREV_SELECTORS);
            if (safeClick(prevBtn)) triggerThrottle(cooldown);
        }
    }, { passive: false });

    function triggerThrottle(ms) {
        isWaiting = true;
        setTimeout(() => {
            isWaiting = false;
        }, ms);
    }
})();
