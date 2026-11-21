document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // =========================================================================
    // 1. Toast Notification & iOS-Compatible Clipboard Helpers
    // =========================================================================
    let toastTimeoutId = null;

    function showToast(message, type = 'success') {
        let toast = document.querySelector('.toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-notification';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }

        const iconClass =
            type === 'error'
                ? 'fas fa-exclamation-circle'
                : 'fas fa-check-circle';

        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i><span>${message}</span>`;

        // Trigger reflow for smooth transition restart
        void toast.offsetWidth;
        toast.classList.add('active', 'show');

        if (toastTimeoutId) {
            clearTimeout(toastTimeoutId);
        }
        toastTimeoutId = setTimeout(() => {
            toast.classList.remove('active', 'show');
        }, 2600);
    }

    async function copyToClipboard(text) {
        const value = String(text || '').trim();
        if (!value) return false;

        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(value);
                return true;
            } catch (err) {
                // Fall back to iOS-compatible textarea method below
            }
        }

        try {
            const textarea = document.createElement('textarea');
            textarea.value = value;
            textarea.contentEditable = 'true';
            textarea.readOnly = true;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.top = '0';
            textarea.style.left = '-9999px';
            textarea.style.fontSize = '16px'; // Prevent iOS Safari auto-zoom on focus
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);

            textarea.focus();

            const range = document.createRange();
            range.selectNodeContents(textarea);
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
            textarea.setSelectionRange(0, 999999);

            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            return successful;
        } catch (err) {
            return false;
        }
    }

    function setTemporaryButtonFeedback(button, tempLabel = 'Đã sao chép!') {
        if (!button) return;
        if (button.dataset.copying === 'true') return;

        const originalHTML = button.innerHTML;
        button.dataset.copying = 'true';
        button.classList.add('copied');

        const isCompactIconBtn =
            button.classList.contains('copy-inline-btn') &&
            button.textContent.trim().length === 0;

        if (isCompactIconBtn) {
            button.innerHTML = `<i class="fas fa-check" aria-hidden="true"></i> <span>${tempLabel}</span>`;
        } else {
            button.innerHTML = `<i class="fas fa-check" aria-hidden="true"></i> ${tempLabel}`;
        }

        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('copied');
            delete button.dataset.copying;
        }, 2000);
    }

    // =========================================================================
    // 2. Smooth Typing Effect (#typing)
    // =========================================================================
    const typingElement = document.getElementById('typing');
    if (typingElement) {
        const sourceText =
            (typingElement.dataset.text || typingElement.textContent || '').trim() ||
            'Đảk Đảk Bủn Bủn';
        let charIndex = 0;
        const typingSpeed = 110;

        typingElement.textContent = '';

        function typeWriter() {
            if (charIndex <= sourceText.length) {
                typingElement.textContent = sourceText.substring(0, charIndex);
                charIndex++;
                if (charIndex <= sourceText.length) {
                    setTimeout(typeWriter, typingSpeed);
                }
            }
        }

        typeWriter();
    }

    // =========================================================================
    // 3. Share Popup & Bio Link Copy (#sharePopup, #copy-bio-link)
    // =========================================================================
    const cardShareButton = document.getElementById('card-share-button');
    const sharePopup = document.getElementById('sharePopup');
    const closeSharePopup = document.getElementById('close-share-popup');
    const bioLinkUrl = document.getElementById('bio-link-url');
    const copyBioLinkButton = document.getElementById('copy-bio-link');
    const downloadQrOverlay = document.getElementById('download-qr-overlay');
    const bioLinkQrImage = document.getElementById('bio-link-qr-image');
    let lastFocusedBeforePopup = null;

    function openShareModal() {
        if (!sharePopup) return;
        lastFocusedBeforePopup = document.activeElement;
        sharePopup.classList.add('active');
        sharePopup.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (closeSharePopup) {
            closeSharePopup.focus();
        }
    }

    function closeShareModal() {
        if (!sharePopup || !sharePopup.classList.contains('active')) return;
        sharePopup.classList.remove('active');
        sharePopup.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocusedBeforePopup && typeof lastFocusedBeforePopup.focus === 'function') {
            lastFocusedBeforePopup.focus();
        }
    }

    if (cardShareButton && sharePopup) {
        cardShareButton.addEventListener('click', openShareModal);
    }

    if (closeSharePopup) {
        closeSharePopup.addEventListener('click', closeShareModal);
    }

    if (sharePopup) {
        sharePopup.addEventListener('click', function (event) {
            if (event.target === sharePopup) {
                closeShareModal();
            }
        });
    }

    if (copyBioLinkButton) {
        copyBioLinkButton.addEventListener('click', async function () {
            const linkToCopy =
                (bioLinkUrl && bioLinkUrl.value) || window.location.href;
            const ok = await copyToClipboard(linkToCopy);
            if (ok) {
                setTemporaryButtonFeedback(copyBioLinkButton, 'Đã sao chép!');
                showToast('Đã sao chép liên kết Bio!', 'success');
            } else {
                showToast('Không thể sao chép liên kết.', 'error');
            }
        });
    }

    // =========================================================================
    // 4. Bank Account Copy (#copy-bank-number, .copy-inline-btn, [data-copy])
    // =========================================================================
    const bankCopyButtons = new Set([
        ...document.querySelectorAll('#copy-bank-number, .copy-inline-btn, [data-copy]')
    ]);

    bankCopyButtons.forEach((btn) => {
        if (!btn || btn === copyBioLinkButton) return;
        btn.addEventListener('click', async function (event) {
            event.preventDefault();
            const accountNumber =
                (btn.getAttribute('data-copy') || '00961270500').trim();
            const ok = await copyToClipboard(accountNumber);
            if (ok) {
                setTemporaryButtonFeedback(btn, 'Đã sao chép!');
                showToast(`Đã sao chép số tài khoản: ${accountNumber}`, 'success');
            } else {
                showToast('Không thể sao chép số tài khoản.', 'error');
            }
        });
    });

    // =========================================================================
    // 5. QR Code Download Buttons (#download-qr-overlay, #download-donate-qr)
    // =========================================================================
    function triggerImageDownload(imgElement, filename, emptyErrorMsg) {
        const src = imgElement && imgElement.getAttribute('src');
        if (src) {
            const a = document.createElement('a');
            a.href = imgElement.src || src;
            a.download = filename;
            a.rel = 'noopener';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast('Đang tải xuống mã QR...', 'success');
        } else {
            showToast(emptyErrorMsg, 'error');
        }
    }

    if (downloadQrOverlay) {
        downloadQrOverlay.addEventListener('click', function () {
            triggerImageDownload(
                bioLinkQrImage,
                'BioLink_QR_Code.png',
                'Không tìm thấy mã QR để tải xuống.'
            );
        });
    }

    const downloadDonateQrButton = document.getElementById('download-donate-qr');
    const donateQrImage = document.querySelector('.support-qr-code');
    if (downloadDonateQrButton) {
        downloadDonateQrButton.addEventListener('click', function () {
            triggerImageDownload(
                donateQrImage,
                'Donate_QR_Code.png',
                'Không tìm thấy mã QR donate để tải xuống.'
            );
        });
    }

    // =========================================================================
    // 6. Image Lightbox (.showcase-image)
    // =========================================================================
    const showcaseImages = document.querySelectorAll('.showcase-image');
    let lightboxOverlay = document.querySelector('.lightbox-overlay');
    let lightboxImg = null;
    let lightboxCloseBtn = null;
    let lastFocusedBeforeLightbox = null;

    function ensureLightbox() {
        if (lightboxOverlay) {
            lightboxImg = lightboxOverlay.querySelector('.lightbox-img');
            lightboxCloseBtn = lightboxOverlay.querySelector('.lightbox-close');
            return;
        }

        lightboxOverlay = document.createElement('div');
        lightboxOverlay.className = 'lightbox-overlay';
        lightboxOverlay.setAttribute('role', 'dialog');
        lightboxOverlay.setAttribute('aria-modal', 'true');
        lightboxOverlay.setAttribute('aria-label', 'Xem ảnh phóng to');
        lightboxOverlay.setAttribute('aria-hidden', 'true');

        lightboxCloseBtn = document.createElement('button');
        lightboxCloseBtn.type = 'button';
        lightboxCloseBtn.className = 'lightbox-close';
        lightboxCloseBtn.setAttribute('aria-label', 'Đóng ảnh');
        lightboxCloseBtn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';

        lightboxImg = document.createElement('img');
        lightboxImg.className = 'lightbox-img';
        lightboxImg.alt = '';

        lightboxOverlay.appendChild(lightboxCloseBtn);
        lightboxOverlay.appendChild(lightboxImg);
        document.body.appendChild(lightboxOverlay);

        lightboxCloseBtn.addEventListener('click', closeLightbox);
        lightboxOverlay.addEventListener('click', function (event) {
            if (event.target === lightboxOverlay) {
                closeLightbox();
            }
        });
    }

    function openLightbox(src, altText) {
        if (!src) return;
        ensureLightbox();
        lastFocusedBeforeLightbox = document.activeElement;
        lightboxImg.src = src;
        lightboxImg.alt = altText || 'Ảnh showcase';
        lightboxOverlay.classList.add('active', 'show');
        lightboxOverlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (lightboxCloseBtn) {
            lightboxCloseBtn.focus();
        }
    }

    function closeLightbox() {
        if (!lightboxOverlay || !lightboxOverlay.classList.contains('active')) {
            return;
        }
        lightboxOverlay.classList.remove('active', 'show');
        lightboxOverlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (
            lastFocusedBeforeLightbox &&
            typeof lastFocusedBeforeLightbox.focus === 'function'
        ) {
            lastFocusedBeforeLightbox.focus();
        }
    }

    if (showcaseImages.length > 0) {
        ensureLightbox();
        showcaseImages.forEach((img) => {
            img.style.cursor = 'pointer';
            if (!img.hasAttribute('tabindex')) {
                img.setAttribute('tabindex', '0');
            }
            img.addEventListener('click', function (event) {
                event.stopPropagation();
                openLightbox(img.currentSrc || img.src, img.alt);
            });
            img.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openLightbox(img.currentSrc || img.src, img.alt);
                }
            });
        });
    }

    // Global Escape key handler for Share Popup & Lightbox
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            if (lightboxOverlay && lightboxOverlay.classList.contains('active')) {
                closeLightbox();
            } else if (sharePopup && sharePopup.classList.contains('active')) {
                closeShareModal();
            }
        }
    });

    // =========================================================================
    // 7. Background Music Control (#bg-music, #toggle-music-button) - iOS Ready
    // =========================================================================
    const bgMusic = document.getElementById('bg-music');
    const toggleMusicButton = document.getElementById('toggle-music-button');

    if (bgMusic && toggleMusicButton) {
        let isMusicPlaying = false;
        let waitingForFirstInteraction = false;

        bgMusic.setAttribute('playsinline', '');
        bgMusic.setAttribute('webkit-playsinline', '');

        function syncMusicUI(playing) {
            isMusicPlaying = playing;
            const icon = toggleMusicButton.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-volume-up', playing);
                icon.classList.toggle('fa-volume-mute', !playing);
            }
            toggleMusicButton.classList.toggle('playing', playing);
            toggleMusicButton.setAttribute('aria-pressed', String(playing));
        }

        bgMusic.addEventListener('play', () => syncMusicUI(true));
        bgMusic.addEventListener('pause', () => syncMusicUI(false));
        bgMusic.addEventListener('ended', () => syncMusicUI(false));

        function removeFirstInteractionListeners() {
            if (!waitingForFirstInteraction) return;
            waitingForFirstInteraction = false;
            document.removeEventListener('click', handleFirstUserInteraction);
            document.removeEventListener('touchstart', handleFirstUserInteraction);
            document.removeEventListener('touchend', handleFirstUserInteraction);
            document.removeEventListener('keydown', handleFirstUserInteraction);
        }

        function handleFirstUserInteraction(event) {
            if (
                event &&
                event.target &&
                toggleMusicButton.contains(event.target)
            ) {
                removeFirstInteractionListeners();
                return;
            }
            removeFirstInteractionListeners();
            if (bgMusic.paused) {
                bgMusic
                    .play()
                    .then(() => syncMusicUI(true))
                    .catch(() => syncMusicUI(false));
            }
        }

        // Attempt autoplay on page load
        const playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    syncMusicUI(true);
                })
                .catch(() => {
                    syncMusicUI(false);
                    waitingForFirstInteraction = true;
                    document.addEventListener('click', handleFirstUserInteraction, {
                        passive: true
                    });
                    document.addEventListener('touchstart', handleFirstUserInteraction, {
                        passive: true
                    });
                    document.addEventListener('touchend', handleFirstUserInteraction, {
                        passive: true
                    });
                    document.addEventListener('keydown', handleFirstUserInteraction, {
                        passive: true
                    });
                });
        }

        toggleMusicButton.addEventListener('click', function (event) {
            event.stopPropagation();
            removeFirstInteractionListeners();

            if (!bgMusic.paused || isMusicPlaying) {
                bgMusic.pause();
                syncMusicUI(false);
            } else {
                bgMusic
                    .play()
                    .then(() => syncMusicUI(true))
                    .catch(() => syncMusicUI(false));
            }
        });
    }
});
