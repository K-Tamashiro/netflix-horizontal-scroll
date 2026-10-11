// ==UserScript==
// @name         Netflix Precision Horizontal Scroll (Alt+Wheel & SideWheel)
// @namespace    https://github.com/tamayan
// @version      3.6
// @description  NetflixでAlt+ホイールおよびMX Masterのサムホイールでカルーセルを横スクロール。Reactを壊さずプレビューを安全に閉じます。
// @author       Tamayan
// @match        https://*.netflix.com/*
// @match        https://netflix.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // プレビュー表示隠蔽CSS（CSSによる不可視化のみ。DOMは削除しない）
    const style = document.createElement('style');
    style.textContent = `
        body.is-wheel-scrolling .bob-card-portal,
        body.is-wheel-scrolling .bob-container,
        body.is-wheel-scrolling .jawBoneContainer,
        body.is-wheel-scrolling .previewModal--wrapper,
        body.is-wheel-scrolling .mini-modal,
        body.is-wheel-scrolling .bob-card,
        body.is-wheel-scrolling .jawbone-wrapper,
        body.is-wheel-scrolling [data-uia*="bob-card"] {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
            visibility: hidden !important;
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    let isLocked = false;
    let lockTimer = null;
    let cleanupTimer = null;
    let lastDir = 0;
    let currentHoverTarget = null;
    let lastActiveRow = null;
    const LOCK_INTERVAL = 180;

    // Reactを壊さずにプレビューを閉じる安全な処理
    function safeDismissPreview() {
        // 1. 公式の閉じるボタンがあれば最優先でクリック
        const closeBtn = document.querySelector('.bob-card .close-button, [data-uia="previewModal-closebtn"]');
        if (closeBtn) {
            closeBtn.click();
            return;
        }

        // 2. DOMのremove()は絶対にせず、mouseleaveイベントを発火させてReact自身に片付けさせる
        const activeCard = document.querySelector('.bob-card, [data-uia*="bob-card"]');
        if (activeCard) {
            activeCard.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true, cancelable: true }));
            activeCard.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, cancelable: true }));
        }
    }

    // カーソル位置を追跡（カルーセル行を記憶）
    window.addEventListener('mousemove', e => {
        currentHoverTarget = e.target;
        const potentialRow = e.target.closest('section, [data-uia*="carousel"], .lolomoRow, .rowContainer');
        if (potentialRow) {
            lastActiveRow = potentialRow;
        }
    }, { passive: true });

    function dispatchReactClick(button) {
        if (!button) return false;

        const rect = button.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;

        const props = {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: clientX,
            clientY: clientY,
            button: 0,
            buttons: 1
        };

        try {
            button.dispatchEvent(new PointerEvent('pointerdown', props));
            button.dispatchEvent(new MouseEvent('mousedown', props));
            button.dispatchEvent(new PointerEvent('pointerup', props));
            button.dispatchEvent(new MouseEvent('mouseup', props));
            button.click();
            return true;
        } catch (err) {
            button.click();
            return true;
        }
    }

    // カルーセル横送りコア関数
    function triggerScroll(targetElem, dir) {
        // 動画再生画面やテキスト入力中は動作させない
        if (document.querySelector('.watch-video, .nf-player-container')) return false;
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return false;

        // 安全にプレビューを閉じる（DOM削除は行わない）
        safeDismissPreview();

        document.body.classList.add('is-wheel-scrolling');
        clearTimeout(cleanupTimer);
        cleanupTimer = setTimeout(() => {
            document.body.classList.remove('is-wheel-scrolling');
        }, 300);

        // 行コンテナの特定
        let row = targetElem ? targetElem.closest('section, [data-uia*="carousel"], .lolomoRow, .rowContainer') : null;
        if (!row && lastActiveRow) {
            row = lastActiveRow;
        }

        if (!row) return false;

        if (dir !== lastDir) {
            isLocked = false;
            clearTimeout(lockTimer);
        }
        lastDir = dir;

        if (isLocked) return true;

        const btnSelector = dir > 0
            ? 'button[data-uia*="right-button"], button[aria-label*="次"], .handleNext'
            : 'button[data-uia*="left-button"], button[aria-label*="前"], .handlePrev';

        let btn = row.querySelector(btnSelector);
        if (!btn && row.parentElement) {
            btn = row.parentElement.querySelector(btnSelector);
        }

        if (!btn) return false;

        if (dispatchReactClick(btn)) {
            isLocked = true;
            clearTimeout(lockTimer);
            lockTimer = setTimeout(() => {
                isLocked = false;
                lastDir = 0;
            }, LOCK_INTERVAL);
            return true;
        }
        return false;
    }

    // 1. Alt + 縦ホイール
    window.addEventListener('wheel', function(e) {
        const isModifier = e.altKey || e.shiftKey || Math.abs(e.deltaX) > 0;
        if (!isModifier) return;

        const target = e.target;
        const rawDelta = Math.abs(e.deltaX) > 0 ? e.deltaX : e.deltaY;
        if (Math.abs(rawDelta) < 1) return;
        const dir = rawDelta > 0 ? 1 : -1;

        // 縦スクロールを完全に抑止
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        triggerScroll(target, dir);
    }, { passive: false, capture: true });

    // 2. サムホイールから送られる Left / Right キー
    window.addEventListener('keydown', function(e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

        const dir = e.key === 'ArrowRight' ? 1 : -1;

        if (triggerScroll(currentHoverTarget, dir)) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }, { passive: false, capture: true });
})();
