function throttle(func, limit) {
    let inThrottle = false;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    }
}

function debounce(func, wait) {
    let timeout;
    return function() {
        const args = arguments;
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchDailyQuote();
    initScrollAnimations();
    initCardInteractions();
    initScrollIndicator();
    initBackToTop();
    initParallax();
    initInteractionSystem();
    initLightbox();
    initCategoryFilter();
    initImageLazyLoad();
    initShareButtons();
    initGuestbook();
    initCardDetailModal();
});

async function fetchDailyQuote() {
    const quoteContainer = document.getElementById('dailyQuote');
    const quoteText = quoteContainer.querySelector('.quote-text');
    const quoteAuthor = quoteContainer.querySelector('.quote-author');
    
    try {
        const response = await fetch('https://v1.hitokoto.cn/');
        const data = await response.json();
        
        quoteText.textContent = data.hitokoto;
        if (data.from) {
            quoteAuthor.textContent = `—— ${data.from}`;
        } else {
            quoteAuthor.textContent = '';
        }
        quoteContainer.classList.remove('loading');
    } catch (error) {
        console.error('获取每日一句失败:', error);
        quoteText.textContent = '生活不止眼前的苟且，还有诗和远方';
        quoteAuthor.textContent = '—— 高晓松';
        quoteContainer.classList.remove('loading');
    }
}

function initScrollAnimations() {
    const cards = document.querySelectorAll('.card');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 80);
            }
        });
    }, observerOptions);

    cards.forEach(card => {
        observer.observe(card);
    });
}

function initCardInteractions() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach((card) => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-15px) scale(1.03)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}

function initScrollIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'scroll-indicator';
    document.body.appendChild(indicator);

    const updateIndicator = throttle(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        indicator.style.width = `${scrollPercent}%`;
    }, 16);

    window.addEventListener('scroll', updateIndicator);
}

function initBackToTop() {
    const backToTop = document.createElement('button');
    backToTop.className = 'back-to-top';
    backToTop.innerHTML = '↑';
    backToTop.setAttribute('aria-label', '返回顶部');
    document.body.appendChild(backToTop);

    const updateBackToTop = throttle(() => {
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }, 100);

    window.addEventListener('scroll', updateBackToTop);

    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

function initParallax() {
    const parallaxBg = document.createElement('div');
    parallaxBg.className = 'parallax-bg';
    document.body.insertBefore(parallaxBg, document.body.firstChild);

    const updateParallax = throttle(() => {
        const scrollY = window.scrollY;
        parallaxBg.style.transform = `translateY(${scrollY * 0.1}px)`;
    }, 16);

    window.addEventListener('scroll', updateParallax);
}

function initInteractionSystem() {
    const STORAGE_KEY = 'knowledge_cards_data';
    
    function loadData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch {
            return {};
        }
    }

    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function getCardData(cardId) {
        const allData = loadData();
        return allData[cardId] || { likes: 0, favorites: 0, comments: [], isLiked: false, isFavorited: false };
    }

    function updateCardData(cardId, updates) {
        const allData = loadData();
        allData[cardId] = { ...getCardData(cardId), ...updates };
        saveData(allData);
        return allData[cardId];
    }

    function initActionButtons() {
        const cards = document.querySelectorAll('.card');
        
        cards.forEach(card => {
            const cardId = card.dataset.id;
            const data = getCardData(cardId);
            
            const likeBtn = card.querySelector('.like-btn');
            const favoriteBtn = card.querySelector('.favorite-btn');
            const commentBtn = card.querySelector('.comment-btn');
            
            const likeCount = card.querySelector(`#like-${cardId}`);
            const favoriteCount = card.querySelector(`#favorite-${cardId}`);
            const commentCount = card.querySelector(`#comment-${cardId}`);
            
            likeCount.textContent = data.likes;
            favoriteCount.textContent = data.favorites;
            commentCount.textContent = data.comments.length;
            
            if (data.isLiked) {
                likeBtn.classList.add('active', 'liked');
            }
            if (data.isFavorited) {
                favoriteBtn.classList.add('active', 'favorited');
            }
            
            likeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const currentData = getCardData(cardId);
                const newLiked = !currentData.isLiked;
                const newLikes = newLiked ? currentData.likes + 1 : currentData.likes - 1;
                
                updateCardData(cardId, { likes: newLikes, isLiked: newLiked });
                
                likeCount.textContent = newLikes;
                likeBtn.classList.toggle('active', newLiked);
                likeBtn.classList.remove('liked');
                
                requestAnimationFrame(() => {
                    if (newLiked) {
                        likeBtn.classList.add('liked');
                    }
                });
            });
            
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const currentData = getCardData(cardId);
                const newFavorited = !currentData.isFavorited;
                const newFavorites = newFavorited ? currentData.favorites + 1 : currentData.favorites - 1;
                
                updateCardData(cardId, { favorites: newFavorites, isFavorited: newFavorited });
                
                favoriteCount.textContent = newFavorites;
                favoriteBtn.classList.toggle('active', newFavorited);
                favoriteBtn.classList.remove('favorited');
                
                requestAnimationFrame(() => {
                    if (newFavorited) {
                        favoriteBtn.classList.add('favorited');
                    }
                });
            });
            
            commentBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openCommentModal(cardId);
            });
        });
    }

    function openCommentModal(cardId) {
        const overlay = document.createElement('div');
        overlay.className = 'comment-modal-overlay';
        document.body.appendChild(overlay);
        
        const card = document.querySelector(`[data-id="${cardId}"]`);
        const cardTitle = card.querySelector('.card-title').textContent;
        const data = getCardData(cardId);
        
        overlay.innerHTML = `
            <div class="comment-modal">
                <div class="comment-modal-header">
                    <h3 class="comment-modal-title">${cardTitle}</h3>
                    <button class="comment-modal-close" aria-label="关闭">×</button>
                </div>
                <div class="comment-modal-body">
                    <ul class="comment-list" id="comment-list-${cardId}">
                        ${data.comments.length > 0 ? 
                            data.comments.map(comment => `
                                <li class="comment-item">
                                    <div class="comment-author">${comment.author}</div>
                                    <div class="comment-content">${comment.content}</div>
                                    <div class="comment-time">${comment.time}</div>
                                </li>
                            `).join('') : 
                            '<div class="no-comments">暂无评论，快来发表第一条评论吧！</div>'
                        }
                    </ul>
                    <div class="comment-input-area">
                        <input type="text" class="comment-input" placeholder="写下你的评论..." maxlength="200">
                        <button class="comment-submit">发表</button>
                    </div>
                </div>
            </div>
        `;
        
        setTimeout(() => overlay.classList.add('active'), 10);
        
        const closeBtn = overlay.querySelector('.comment-modal-close');
        const submitBtn = overlay.querySelector('.comment-submit');
        const input = overlay.querySelector('.comment-input');
        const commentList = overlay.querySelector(`#comment-list-${cardId}`);
        
        const closeModal = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            document.body.style.overflow = '';
        };
        
        closeBtn.addEventListener('click', closeModal);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        }, { once: true });
        
        submitBtn.addEventListener('click', () => {
            const content = input.value.trim();
            if (!content) return;
            
            const newComment = {
                author: '访客',
                content: content,
                time: new Date().toLocaleString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
            
            const currentData = getCardData(cardId);
            const newComments = [...currentData.comments, newComment];
            updateCardData(cardId, { comments: newComments });
            
            const commentItem = document.createElement('li');
            commentItem.className = 'comment-item';
            commentItem.innerHTML = `
                <div class="comment-author">${newComment.author}</div>
                <div class="comment-content">${newComment.content}</div>
                <div class="comment-time">${newComment.time}</div>
            `;
            
            if (currentData.comments.length === 0) {
                commentList.innerHTML = '';
            }
            
            commentList.appendChild(commentItem);
            commentItem.style.opacity = '0';
            commentItem.style.transform = 'translateY(10px)';
            
            requestAnimationFrame(() => {
                commentItem.style.transition = 'all 0.3s ease';
                commentItem.style.opacity = '1';
                commentItem.style.transform = 'translateY(0)';
            });
            
            input.value = '';
            
            const commentCount = card.querySelector(`#comment-${cardId}`);
            commentCount.textContent = newComments.length;
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitBtn.click();
            }
        });
        
        document.body.style.overflow = 'hidden';
    }

    initActionButtons();
}

function initLightbox() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        const images = card.querySelectorAll('.card-image img');
        const imageList = Array.from(images).map(img => ({
            src: img.getAttribute('data-src') || img.src,
            alt: img.alt
        }));
        
        images.forEach((img, startIndex) => {
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                
                let existingOverlay = document.querySelector('.lightbox-overlay');
                if (existingOverlay) {
                    existingOverlay.remove();
                }
                
                const overlay = document.createElement('div');
                overlay.className = 'lightbox-overlay';
                document.body.appendChild(overlay);
                
                overlay.innerHTML = `
                    <div class="lightbox-content">
                        <button class="lightbox-nav lightbox-prev">←</button>
                        <button class="lightbox-nav lightbox-next">→</button>
                        <button class="lightbox-close">×</button>
                        <img src="${imageList[startIndex].src}" alt="${imageList[startIndex].alt}" class="lightbox-image">
                        <div class="lightbox-caption">${imageList[startIndex].alt}</div>
                        <div class="lightbox-counter">${startIndex + 1} / ${imageList.length}</div>
                    </div>
                `;
                
                setTimeout(() => overlay.classList.add('active'), 10);
                
                const closeBtn = overlay.querySelector('.lightbox-close');
                const prevBtn = overlay.querySelector('.lightbox-prev');
                const nextBtn = overlay.querySelector('.lightbox-next');
                const image = overlay.querySelector('.lightbox-image');
                const caption = overlay.querySelector('.lightbox-caption');
                const counter = overlay.querySelector('.lightbox-counter');
                
                let currentIndex = startIndex;
                
                const closeLightbox = () => {
                    overlay.classList.remove('active');
                    setTimeout(() => {
                        overlay.remove();
                    }, 300);
                    document.body.style.overflow = '';
                };
                
                const updateImage = (index) => {
                    const imgData = imageList[index];
                    image.src = imgData.src;
                    image.alt = imgData.alt;
                    caption.textContent = imgData.alt;
                    counter.textContent = `${index + 1} / ${imageList.length}`;
                    currentIndex = index;
                };
                
                closeBtn.addEventListener('click', closeLightbox);
                
                prevBtn.addEventListener('click', () => {
                    const newIndex = currentIndex === 0 ? imageList.length - 1 : currentIndex - 1;
                    updateImage(newIndex);
                });
                
                nextBtn.addEventListener('click', () => {
                    const newIndex = currentIndex === imageList.length - 1 ? 0 : currentIndex + 1;
                    updateImage(newIndex);
                });
                
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        closeLightbox();
                    }
                });
                
                const handleKeydown = (e) => {
                    if (!document.querySelector('.lightbox-overlay')) {
                        document.removeEventListener('keydown', handleKeydown);
                        return;
                    }
                    
                    if (e.key === 'Escape') {
                        closeLightbox();
                    } else if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        prevBtn.click();
                    } else if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        nextBtn.click();
                    }
                };
                
                document.addEventListener('keydown', handleKeydown);
                
                document.body.style.overflow = 'hidden';
            });
        });
    });
}

function initCardDetailModal() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        const cardContent = card.querySelector('.card-content');
        if (!cardContent) return;
        
        cardContent.addEventListener('click', (e) => {
            e.stopPropagation();
            const cardId = card.dataset.id;
            const title = card.querySelector('.card-title').textContent;
            const description = card.querySelector('.card-description').textContent;
            const tag = card.querySelector('.card-tag').textContent;
            
            const images = card.querySelectorAll('.card-image img');
            const imageList = Array.from(images).map(img => ({
                src: img.getAttribute('data-src') || img.src,
                alt: img.alt
            }));
            
            const overlay = document.createElement('div');
            overlay.className = 'detail-modal-overlay';
            document.body.appendChild(overlay);
            
            overlay.innerHTML = `
                <div class="detail-modal">
                    <div class="detail-modal-header">
                        <h2 class="detail-modal-title">${title}</h2>
                        <button class="detail-modal-close" aria-label="关闭">×</button>
                    </div>
                    <div class="detail-modal-body">
                        <div class="detail-images">
                            ${imageList.map((imgData, index) => `
                                <img src="${imgData.src}" alt="${imgData.alt}" class="detail-image" data-index="${index}">
                            `).join('')}
                        </div>
                        <div class="detail-content">
                            <span class="detail-tag">${tag}</span>
                            <p class="detail-description">${description}</p>
                            <div class="detail-extra">
                                <h3>💡 趣味延伸</h3>
                                <p>这个有趣的知识展示了大自然的奇妙之处。点击图片可以放大查看，支持左右切换浏览。</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            setTimeout(() => overlay.classList.add('active'), 10);
            
            const closeBtn = overlay.querySelector('.detail-modal-close');
            const detailImages = overlay.querySelectorAll('.detail-image');
            const closeModal = () => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
                document.body.style.overflow = '';
            };
            
            closeBtn.addEventListener('click', closeModal);
            
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeModal();
                }
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                }
            }, { once: true });
            
            detailImages.forEach((img, index) => {
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    initLightboxFromDetail(imageList, index);
                });
            });
            
            document.body.style.overflow = 'hidden';
        });
    });
}

function initLightboxFromDetail(imageList, startIndex) {
    let overlay = document.querySelector('.lightbox-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    document.body.appendChild(overlay);
    
    overlay.innerHTML = `
        <div class="lightbox-content">
            <button class="lightbox-nav lightbox-prev">←</button>
            <button class="lightbox-nav lightbox-next">→</button>
            <button class="lightbox-close">×</button>
            <img src="${imageList[startIndex].src}" alt="${imageList[startIndex].alt}" class="lightbox-image">
            <div class="lightbox-caption">${imageList[startIndex].alt}</div>
            <div class="lightbox-counter">${startIndex + 1} / ${imageList.length}</div>
        </div>
    `;
    
    setTimeout(() => overlay.classList.add('active'), 10);
    
    const closeBtn = overlay.querySelector('.lightbox-close');
    const prevBtn = overlay.querySelector('.lightbox-prev');
    const nextBtn = overlay.querySelector('.lightbox-next');
    const image = overlay.querySelector('.lightbox-image');
    const caption = overlay.querySelector('.lightbox-caption');
    const counter = overlay.querySelector('.lightbox-counter');
    
    let currentIndex = startIndex;
    
    const closeLightbox = () => {
        overlay.classList.remove('active');
        setTimeout(() => {
            if (overlay) {
                overlay.remove();
                overlay = null;
            }
        }, 300);
        document.body.style.overflow = '';
    };
    
    const updateImage = (index) => {
        const imgData = imageList[index];
        image.src = imgData.src;
        image.alt = imgData.alt;
        caption.textContent = imgData.alt;
        counter.textContent = `${index + 1} / ${imageList.length}`;
        currentIndex = index;
    };
    
    closeBtn.addEventListener('click', closeLightbox);
    
    prevBtn.addEventListener('click', () => {
        const newIndex = currentIndex === 0 ? imageList.length - 1 : currentIndex - 1;
        updateImage(newIndex);
    });
    
    nextBtn.addEventListener('click', () => {
        const newIndex = currentIndex === imageList.length - 1 ? 0 : currentIndex + 1;
        updateImage(newIndex);
    });
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeLightbox();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (!overlay) return;
        
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevBtn.click();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextBtn.click();
        }
    });
    
    document.body.style.overflow = 'hidden';
}

function initCategoryFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.card');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.dataset.category;
            
            cards.forEach(card => {
                if (category === 'all') {
                    card.classList.remove('hidden');
                } else {
                    if (card.dataset.category === category) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                }
            });
        });
    });
}

function initImageLazyLoad() {
    const lazyImages = document.querySelectorAll('img.lazy');
    
    if (lazyImages.length === 0) return;
    
    const observerOptions = {
        root: null,
        rootMargin: '100px 0px',
        threshold: 0.05
    };
    
    let loadingCount = 0;
    const maxConcurrentLoads = 3;
    
    const loadImage = (img, observer) => {
        if (loadingCount >= maxConcurrentLoads) {
            return false;
        }
        
        loadingCount++;
        const src = img.getAttribute('data-src');
        
        if (src) {
            const tempImg = new Image();
            tempImg.onload = () => {
                img.src = src;
                img.onload = () => {
                    img.classList.add('loaded');
                    loadingCount--;
                    processNextImages(observer);
                };
                img.onerror = () => {
                    loadingCount--;
                    processNextImages(observer);
                };
                observer.unobserve(img);
            };
            tempImg.onerror = () => {
                loadingCount--;
                observer.unobserve(img);
                processNextImages(observer);
            };
            tempImg.src = src;
        } else {
            loadingCount--;
            observer.unobserve(img);
        }
        return true;
    };
    
    const pendingImages = [];
    
    const processNextImages = (observer) => {
        while (pendingImages.length > 0 && loadingCount < maxConcurrentLoads) {
            const { img, entry } = pendingImages.shift();
            if (!img.src) {
                loadImage(img, observer);
            }
        }
    };
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.src) {
                    observer.unobserve(img);
                    return;
                }
                
                if (!loadImage(img, observer)) {
                    pendingImages.push({ img, entry });
                }
            }
        });
    }, observerOptions);
    
    lazyImages.forEach(img => {
        imageObserver.observe(img);
    });
}

function initShareButtons() {
    const shareButtons = document.querySelectorAll('.share-btn');
    
    shareButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        const shareOptions = document.createElement('div');
        shareOptions.className = 'share-options';
        shareOptions.innerHTML = `
            <button class="share-option copy-link">
                <span>📋</span>
                <span>复制链接</span>
            </button>
            <button class="share-option share-wechat">
                <span>💬</span>
                <span>微信分享</span>
            </button>
            <button class="share-option share-weibo">
                <span>📢</span>
                <span>微博分享</span>
            </button>
        `;
        btn.appendChild(shareOptions);
        
        const copyBtn = shareOptions.querySelector('.copy-link');
        copyBtn.addEventListener('click', async () => {
            const card = btn.closest('.card');
            const cardTitle = card.querySelector('.card-title').textContent;
            const shareUrl = `${window.location.origin}${window.location.pathname}?card=${card.dataset.id}`;
            
            try {
                await navigator.clipboard.writeText(shareUrl);
                showCopySuccess('链接已复制！');
            } catch (err) {
                const textarea = document.createElement('textarea');
                textarea.value = shareUrl;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showCopySuccess('链接已复制！');
            }
        });
        
        const wechatBtn = shareOptions.querySelector('.share-wechat');
        wechatBtn.addEventListener('click', () => {
            alert('请打开微信，使用"扫一扫"功能分享');
        });
        
        const weiboBtn = shareOptions.querySelector('.share-weibo');
        weiboBtn.addEventListener('click', () => {
            const card = btn.closest('.card');
            const cardTitle = card.querySelector('.card-title').textContent;
            const shareUrl = window.location.href;
            const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(cardTitle)}`;
            window.open(weiboUrl, '_blank');
        });
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.share-btn')) {
            document.querySelectorAll('.share-options').forEach(opt => {
                opt.style.display = 'none';
            });
        }
    });
}

function showCopySuccess(message) {
    const successMsg = document.createElement('div');
    successMsg.className = 'copy-success';
    successMsg.textContent = message;
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
        successMsg.classList.add('visible');
    }, 10);
    
    setTimeout(() => {
        successMsg.classList.remove('visible');
        setTimeout(() => {
            successMsg.remove();
        }, 300);
    }, 2000);
}

function initGuestbook() {
    const guestbookSubmit = document.getElementById('guestbookSubmit');
    const guestbookList = document.getElementById('guestbookList');
    
    if (!guestbookSubmit || !guestbookList) return;
    
    function loadMessages() {
        const messages = JSON.parse(localStorage.getItem('guestbook_messages') || '[]');
        renderMessages(messages);
    }
    
    function renderMessages(messages) {
        if (messages.length === 0) {
            guestbookList.innerHTML = '<div class="no-messages">暂无留言，快来发表第一条吧！</div>';
            return;
        }
        
        guestbookList.innerHTML = messages.map((msg, index) => `
            <div class="guestbook-item" style="animation-delay: ${index * 0.1}s;">
                <div class="guestbook-item-header">
                    <span class="guestbook-item-author">${msg.name || '匿名'}</span>
                    <span class="guestbook-item-time">${msg.time}</span>
                </div>
                <div class="guestbook-item-content">${msg.content}</div>
            </div>
        `).join('');
        
        const items = guestbookList.querySelectorAll('.guestbook-item');
        items.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            setTimeout(() => {
                item.style.transition = 'all 0.4s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
    
    guestbookSubmit.addEventListener('click', () => {
        const name = document.getElementById('guestbookName').value.trim();
        const content = document.getElementById('guestbookMessage').value.trim();
        
        if (!content) {
            alert('请填写留言内容');
            return;
        }
        
        const newMessage = {
            name: name || '匿名',
            content: content,
            time: new Date().toLocaleString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
        
        const messages = JSON.parse(localStorage.getItem('guestbook_messages') || '[]');
        messages.push(newMessage);
        localStorage.setItem('guestbook_messages', JSON.stringify(messages));
        
        document.getElementById('guestbookName').value = '';
        document.getElementById('guestbookMessage').value = '';
        
        renderMessages(messages);
    });
    
    loadMessages();
}

const header = document.querySelector('.header');
if (header) {
    const updateHeader = throttle(() => {
        const scrollY = window.scrollY;
        header.style.transform = `translateY(${scrollY * 0.3}px)`;
        header.style.opacity = Math.max(0.7, 1 - scrollY / 300);
    }, 16);

    window.addEventListener('scroll', updateHeader);
}
