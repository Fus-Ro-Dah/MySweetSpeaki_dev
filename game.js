import { STATE, ASSETS, ITEMS } from './config.js';
import { Speaki } from './speaki.js';

export class Game {
    /** コンストラクタ: ゲームの初期化 */
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.speakiRoom = document.getElementById('speaki-room');

        this.speakis = [];      // 複数管理用の配列
        this.furniture = [];
        this.placedItems = [];
        this.interactTarget = null; // 現在操作（タップ・なでなで）中のスピキ
        this.lastGiftTime = Date.now();
        this.stockGifts = 0;        // 溜まったギフト回数
        this.bgmBuffer = null;      // Web Audio API用デコード済みデータ
        this.bgmSource = null;      // 再生用ノード
        this.audioCtx = null;       // AudioContext
        this.bgmFallback = null;    // CORSエラー時のフォールバック用

        this.images = {};      // キャッシュ用（パス -> Image）
        this.sounds = {};      // キャッシュ用（ファイル名 -> Audio）

        // 音声管理
        this.audioEnabled = false;
        this.isGameStarted = false; // 二重起動防止用フラグ

        Game.instance = this;

        this.loadResources();

        this.init();
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.lastTime = 0;

        // 開始ボタンの待機
        const startBtn = document.getElementById('start-button');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    /** アセット（画像・音声）の全読み込み */
    loadResources() {
        Object.entries(ASSETS).forEach(([key, data]) => {
            // 1. 画像のロード
            if (data.imagefile && !this.images[data.imagefile]) {
                const img = new Image();
                img.src = `assets/images/${data.imagefile}`;
                this.images[data.imagefile] = img;
            }

            // 2. 音声のロード（Audioオブジェクトを事前に作成）
            if (data.soundfile && !this.sounds[data.soundfile]) {
                const audio = new Audio(`assets/sounds/${data.soundfile}`);
                this.sounds[data.soundfile] = audio;
            }
        });

        // ITEMSに定義された画像と音声をすべて読み込む
        Object.values(ITEMS).forEach(item => {
            if (item.imagefile) {
                const path = `assets/images/${item.imagefile}`;
                const img = new Image();
                img.src = path;
                const key = item.imagefile.replace('.png', '');
                this.images[key] = img;
                this.images[path] = img; // パス指定でも引けるように
            }
            if (item.soundfile && !this.sounds[item.soundfile]) {
                const audio = new Audio(`assets/sounds/${item.soundfile}`);
                this.sounds[item.soundfile] = audio;
            }
        });

        // 4. BGMのロード (Web Audio API用)
        this._loadBGM('assets/music/he-jitsu-no-joh.mp3');
    }

    /** BGMをフェッチしてデコードする (ヘルパー) */
    async _loadBGM(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();

            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }

            this.bgmBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
            console.log("[Audio] BGM loaded and decoded (Web Audio API).");
        } catch (e) {
            console.warn("[Audio] Web Audio API failed (CORS?), falling back to standard Audio element:", e);
            // フォールバック: 標準の Audio オブジェクトを作成（file:// プロトコル等での回避策）
            this.bgmFallback = new Audio(url);
            this.bgmFallback.loop = true;
            this.bgmFallback.volume = 0.5;
        }
    }

    /** 音声の再生（インスタンスを返す） */
    playSound(fileName, pitch = 1.0) {
        if (!this.audioEnabled || !this.sounds[fileName]) return null;

        const audio = this.sounds[fileName];
        const playClone = new Audio(audio.src);
        playClone.volume = 0.5;

        // ピッチ（再生速度）の設定
        if (pitch !== 1.0) {
            playClone.defaultPlaybackRate = pitch;
            playClone.playbackRate = pitch;

            if ('preservesPitch' in playClone) playClone.preservesPitch = false;
            if ('webkitPreservesPitch' in playClone) playClone.webkitPreservesPitch = false;
            if ('mozPreservesPitch' in playClone) playClone.mozPreservesPitch = false;
        }

        const promise = playClone.play();
        if (promise !== undefined) {
            promise.then(() => {
                if (pitch !== 1.0) {
                    playClone.playbackRate = pitch;
                }
            }).catch(e => console.log("[Audio] Playback failed:", e));
        }

        return playClone;
    }

    /** ゲームの初期設定 */
    init() {
        this.initItemMenu();
        this.setupInteractions();
        this.setupDragAndDrop();
    }

    /** タイトル画面を閉じてゲームを開始する */
    startGame() {
        if (this.isGameStarted) return;
        this.isGameStarted = true;

        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) {
            titleScreen.classList.add('fade-out');
        }

        this.audioEnabled = true;

        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        if (this.bgmBuffer) {
            if (!this.bgmSource) {
                this.bgmSource = this.audioCtx.createBufferSource();
                this.bgmSource.buffer = this.bgmBuffer;
                this.bgmSource.loop = true;
                const gainNode = this.audioCtx.createGain();
                gainNode.gain.value = 0.5;
                this.bgmSource.connect(gainNode);
                gainNode.connect(this.audioCtx.destination);
                this.bgmSource.start(0);
                console.log("[Audio] Playing BGM via Web Audio API (Seamless).");
            }
        } else if (this.bgmFallback) {
            this.bgmFallback.play().catch(e => console.log("[Audio] Fallback playback failed:", e));
            console.log("[Audio] Playing BGM via Standard Audio (Fallback).");
        }

        this.addSpeaki();
    }

    /** アイテムメニューを動的に生成 */
    initItemMenu() {
        const itemList = document.getElementById('item-list');
        if (!itemList) return;

        itemList.innerHTML = ''; // クリア

        Object.entries(ITEMS).forEach(([id, config]) => {
            if (config.showInMenu) {
                let displayName = config.name || id;
                if (id === 'RandomGift') {
                    if (this.stockGifts <= 0) return;
                    displayName = `${config.name}（×${this.stockGifts}）`;
                }

                const itemDiv = document.createElement('div');
                itemDiv.className = 'draggable-item';
                itemDiv.dataset.id = id;
                itemDiv.dataset.type = config.type || 'item';
                itemDiv.draggable = true;
                itemDiv.textContent = displayName;
                itemList.appendChild(itemDiv);
            }
        });
    }

    /** 新しいSpeakiを追加 */
    addSpeaki(x, y) {
        const id = this.speakis.length;
        const finalX = x !== undefined ? x : window.innerWidth * 0.4 + (Math.random() * 100 - 50);
        const finalY = y !== undefined ? y : window.innerHeight * 0.5 + (Math.random() * 100 - 50);
        const speaki = new Speaki(id, this.speakiRoom, finalX, finalY);
        this.speakis.push(speaki);
    }

    /** キャンバスのサイズ調整 */
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    /** インタラクション（ポインターイベント等）の設定 */
    setupInteractions() {
        const unlockAudio = () => {
            if (!this.audioEnabled) {
                this.audioEnabled = true;
                console.log("[Audio] System unlocked by user interaction.");
                const silent = new Audio();
                silent.play().catch(() => { });
            }
            window.removeEventListener('pointerdown', unlockAudio);
        };
        window.addEventListener('pointerdown', unlockAudio);

        this.canvas.addEventListener('pointerdown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('pointermove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('pointerup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('pointercancel', (e) => this.handleMouseUp(e));

        document.getElementById('gift-btn-receive').onclick = () => this.receiveGift();
        document.getElementById('reaction-btn-1').onclick = () => this.handleReaction(1);
        document.getElementById('reaction-btn-2').onclick = () => this.handleReaction(2);
    }

    /** ドラッグ＆ドロップの設定 */
    setupDragAndDrop() {
        const itemList = document.getElementById('item-list');
        if (!itemList) return;

        itemList.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.draggable-item');
            if (item) {
                const data = { id: item.dataset.id, type: item.dataset.type };
                e.dataTransfer.setData('application/json', JSON.stringify(data));
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const rawData = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
            if (rawData) this._handleItemDrop(rawData, e.clientX, e.clientY);
        });

        let touchDragData = null;
        let touchGhost = null;

        itemList.addEventListener('touchstart', (e) => {
            const item = e.target.closest('.draggable-item');
            if (item) {
                touchDragData = { id: item.dataset.id, type: item.dataset.type };
                touchGhost = item.cloneNode(true);
                touchGhost.style.position = 'fixed';
                touchGhost.style.pointerEvents = 'none';
                touchGhost.style.opacity = '0.7';
                touchGhost.style.zIndex = '1000';
                document.body.appendChild(touchGhost);
                this._updateTouchGhost(touchGhost, e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (touchGhost) {
                e.preventDefault();
                this._updateTouchGhost(touchGhost, e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            if (touchDragData) {
                const touch = e.changedTouches[0];
                const target = document.elementFromPoint(touch.clientX, touch.clientY);

                if (target === this.canvas) {
                    this._handleItemDrop(JSON.stringify(touchDragData), touch.clientX, touch.clientY);
                }

                if (touchGhost) {
                    touchGhost.remove();
                    touchGhost = null;
                }
                touchDragData = null;
            }
        });
    }

    _updateTouchGhost(ghost, x, y) {
        ghost.style.left = `${x - 40}px`;
        ghost.style.top = `${y - 20}px`;
    }

    _handleItemDrop(rawData, clientX, clientY) {
        try {
            const data = JSON.parse(rawData);
            const rect = this.canvas.getBoundingClientRect();
            this.addItem(data.id, data.type, clientX - rect.left, clientY - rect.top);
        } catch (err) {
            console.error("[Drop] Parse error:", err);
        }
    }

    addItem(id, type, x, y) {
        let finalId = id;
        let itemDef = ITEMS[id];

        if (id === 'RandomGift') {
            if (this.stockGifts <= 0) return;
            const pool = Object.entries(ITEMS).filter(([key, def]) => def.isSpecialGift);
            if (pool.length > 0) {
                const [randomId, randomDef] = pool[Math.floor(Math.random() * pool.length)];
                finalId = randomId;
                itemDef = randomDef;
                this.stockGifts--;
                this.initItemMenu();
            } else {
                return;
            }
        }

        if (!itemDef) return;

        const item = {
            id: finalId,
            type: itemDef.type || type,
            x,
            y,
            size: itemDef.size || (type === 'furniture' ? 100 : 40),
            placedTime: Date.now(),
            stage: 'default',
            displayText: itemDef.text || null,
            textDisplayUntil: itemDef.text ? Date.now() + 15000 : 0
        };

        this.placedItems.push(item);

        if (itemDef.soundfile) {
            this.playSound(itemDef.soundfile, itemDef.pitch || 1.0);
        }

        if (itemDef.ignoreReaction) return;

        this.speakis.forEach(speaki => {
            const distToItem = Math.sqrt((speaki.pos.x - x) ** 2 + (speaki.pos.y - y) ** 2);
            if (distToItem > 500) return;
            if (speaki.status.friendship <= -31) return;

            const nonInterruptibleStates = [
                STATE.GIFT_RETURNING,
                STATE.GIFT_WAIT_FOR_USER_REACTION,
                STATE.GIFT_REACTION,
                STATE.GIFT_TIMEOUT,
                STATE.USER_INTERACTING
            ];
            if (nonInterruptibleStates.includes(speaki.status.state)) return;

            const isGiftEventActive = [STATE.GIFT_LEAVING, STATE.GIFT_SEARCHING].includes(speaki.status.state);
            const isItemEventActive = [STATE.ITEM_APPROACHING, STATE.ITEM_ACTION].includes(speaki.status.state);

            if (isGiftEventActive || isItemEventActive) {
                speaki.status.stateStack.push(speaki.status.state);
            }

            speaki.status.friendship = Math.min(50, speaki.status.friendship + 2);
            speaki.approachItem(item, 50);
        });
    }

    handleMouseDown(e) {
        const { x, y } = this._getMousePos(e);
        const target = this._findSpeakiAt(x, y);
        if (!target) return;

        if (!this._isInteractable(target)) return;

        this._prepareInteraction(target, x, y);
    }

    _getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    _isInteractable(speaki) {
        const interactableStates = [
            STATE.IDLE, STATE.WALKING, STATE.GIFT_RETURNING,
            STATE.GIFT_LEAVING, STATE.GIFT_WAIT_FOR_USER_REACTION, STATE.ITEM_APPROACHING,
        ];
        return interactableStates.includes(speaki.status.state);
    }

    _findSpeakiAt(x, y) {
        for (let i = this.speakis.length - 1; i >= 0; i--) {
            const s = this.speakis[i];
            const dist = Math.sqrt((x - s.pos.x) ** 2 + (y - s.pos.y) ** 2);
            const isHeadHit = (y < s.pos.y - s.status.size / 5);
            if (dist < s.status.size / 2 && isHeadHit) return s;
        }
        return null;
    }

    _prepareInteraction(speaki, x, y) {
        speaki.interaction.isInteracting = true;
        speaki.timers.interactStart = Date.now();
        speaki.interaction.lastMouseX = x;
        speaki.interaction.lastMouseY = y;
        speaki.interaction.isPetting = false;

        const interruptibleStates = [
            STATE.GIFT_LEAVING, STATE.GIFT_SEARCHING,
            STATE.GIFT_RETURNING, STATE.GIFT_WAIT_FOR_USER_REACTION,
            STATE.ITEM_APPROACHING, STATE.ITEM_ACTION
        ];

        if (interruptibleStates.includes(speaki.status.state)) {
            speaki.status.stateStack.push(speaki.status.state);
        }

        speaki.status.state = STATE.USER_INTERACTING;
        this.interactTarget = speaki;
    }

    handleMouseMove(e) {
        if (!this.interactTarget) return;

        const speaki = this.interactTarget;
        const { x, y } = this._getMousePos(e);

        const dx = x - speaki.interaction.lastMouseX;
        const dy = y - speaki.interaction.lastMouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 5) return;

        if (speaki.status.state === STATE.USER_INTERACTING) {
            speaki.interaction.isPetting = true;
            speaki.status.friendship = Math.min(50, speaki.status.friendship + 0.2);
            if (speaki.visual.currentVoice) speaki.visual.currentVoice.loop = true;
        }

        speaki.interaction.isActuallyDragging = true;
        const targetEmotion = (speaki.status.friendship <= -11) ? 'sad' : 'happy';

        if (speaki.status.action !== 'idle' || speaki.status.emotion !== targetEmotion) {
            speaki.setExpression('idle', targetEmotion);
        }

        if (speaki.interaction.isPetting && speaki.status.emotion === 'happy') {
            const now = Date.now();
            if (now - speaki.timers.lastHeartTime > 150) {
                this._createPettingHeart(speaki);
                speaki.timers.lastHeartTime = now;
            }
        }

        speaki.visual.targetDistortion.skewX = Math.max(-20, Math.min(20, dx * -1.0));
        speaki.visual.targetDistortion.rotateX = Math.max(-15, Math.min(15, dy * -0.5));
        speaki.visual.targetDistortion.scale = 1.05;

        speaki.interaction.lastMouseX = x;
        speaki.interaction.lastMouseY = y;
    }

    handleMouseUp() {
        const speaki = this.interactTarget;
        if (!speaki) return;

        const isTap = (Date.now() - speaki.timers.interactStart < 300) && !speaki.interaction.isPetting;

        if (isTap) {
            this._handleSpeakiTap(speaki);
        }

        if (isTap || speaki.interaction.isActuallyDragging) {
            this._resetActionTimer(speaki, 2000);
        }

        this._cleanupInteraction(speaki);
    }

    _handleSpeakiTap(speaki) {
        speaki.setExpression('surprised', 'sad');
        this._createHitEffect(speaki.interaction.lastMouseX, speaki.interaction.lastMouseY);
        speaki.status.friendship = Math.max(-50, speaki.status.friendship - 5);
        this.playSound('surprised');
    }

    _cleanupInteraction(speaki) {
        speaki.interaction.isInteracting = false;
        speaki.interaction.isPetting = false;
        speaki.interaction.isActuallyDragging = false;
        speaki.timers.stateStart = Date.now();
        speaki.pos.destinationSet = false;
        speaki.status.state = (speaki.status.stateStack.length > 0) ? speaki.status.stateStack.pop() : STATE.IDLE;
        speaki._stopCurrentVoice();
        this.interactTarget = null;
    }

    _createPettingHeart(speaki) {
        const heart = document.createElement('div');
        heart.className = 'petting-heart';
        heart.textContent = '❤️';
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = -speaki.status.size / 2 + (Math.random() - 0.5) * 40;
        heart.style.left = `${speaki.pos.x + offsetX}px`;
        heart.style.top = `${speaki.pos.y + offsetY}px`;
        this.speakiRoom.appendChild(heart);
        setTimeout(() => heart.remove(), 1200);
    }

    _createHitEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'hit-effect';
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        this.speakiRoom.appendChild(effect);
        setTimeout(() => effect.remove(), 2000);
    }

    _resetActionTimer(speaki, delay) {
        if (speaki.timers.actionTimeout) clearTimeout(speaki.timers.actionTimeout);
        speaki.timers.actionTimeout = setTimeout(() => this.resetSpeakiAppearance(speaki), delay);
    }

    resetSpeakiAppearance(speaki) {
        if (!speaki) return;
        speaki.timers.actionTimeout = null;
        speaki._updateBaseEmotion();
        speaki.setExpression('idle', speaki.status.emotion);
        if (speaki.visual.currentVoice) {
            speaki.visual.currentVoice.loop = false;
            speaki.visual.currentVoice.pause();
            speaki.visual.currentVoice = null;
        }
    }

    updateGiftUI(mode) {
        const ui = document.getElementById('gift-event-ui');
        const receiveBtn = document.getElementById('gift-btn-receive');
        const reactionGroup = document.getElementById('reaction-group');
        const message = document.getElementById('gift-message');

        switch (mode) {
            case 'start':
                message.textContent = 'プレゼントを持ってきてくれた！';
                ui.classList.remove('hidden');
                receiveBtn.classList.remove('hidden');
                reactionGroup.classList.add('hidden');
                break;
            case 'receiving':
                message.textContent = 'お礼を言おう';
                receiveBtn.classList.add('hidden');
                reactionGroup.classList.remove('hidden');
                break;
            case 'hide':
                ui.classList.add('hidden');
                break;
        }
    }

    startGiftReceiveEvent(speaki) {
        this.giftPartner = speaki;
        speaki.status.state = STATE.GIFT_WAIT_FOR_USER_REACTION;
        speaki.timers.stateStart = Date.now();
        speaki._onStateChanged(speaki.status.state);
        this.updateGiftUI('start');
        this.playSound('gift');
    }

    receiveGift() {
        if (this.giftTimeout) clearTimeout(this.giftTimeout);
        this.updateGiftUI('receiving');
    }

    handleReaction(type) {
        this.updateGiftUI('hide');
        if (this.giftPartner) {
            this.giftPartner.status.state = STATE.GIFT_REACTION;
            this.giftPartner.timers.stateStart = Date.now();
            this.giftPartner._onStateChanged(this.giftPartner.status.state);
            this.playSound('happy');
            this.stockGifts++;
            this.initItemMenu();
        }
    }

    completeGiftEvent() {
        if (this.giftPartner) {
            this.giftPartner.status.state = STATE.IDLE;
            this.resetSpeakiAppearance(this.giftPartner);
        }
        this.giftPartner = null;
        this.lastGiftTime = Date.now();
    }

    loop(time) {
        const dt = time - this.lastTime;
        this.lastTime = time;
        this.update(dt);
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.speakis.forEach(speaki => speaki.update(dt));
        this._updateItemLifecycles();
        this.updateSpeakiListUI();
        this.updateGiftDebugUI(); // ギフト調査用デバッグの更新
    }

    /** ギフトイベント発生条件のリアルタイムデバッグ表示 (Speaki ID:0 専用) */
    updateGiftDebugUI() {
        const speaki0 = this.speakis.find(s => s.id === 0);
        if (!speaki0) return;

        const now = Date.now();
        const timeSinceLastGift = now - this.lastGiftTime;
        const cooldownRemaining = Math.max(0, 30000 - timeSinceLastGift);

        // 1. 全体クールダウン
        const cdEl = document.querySelector('#debug-global-cd .debug-val');
        if (cdEl) {
            const isOk = cooldownRemaining <= 0;
            cdEl.textContent = isOk ? 'READY' : `${(cooldownRemaining / 1000).toFixed(1)}s`;
            cdEl.className = `debug-val ${isOk ? 'ok' : 'ng'}`;
        }

        // 2. 他がイベント中ではないか
        const holderEl = document.querySelector('#debug-global-holder .debug-val');
        if (holderEl) {
            const isOk = !this.giftPartner;
            holderEl.textContent = isOk ? 'OK' : 'BUSY';
            holderEl.className = `debug-val ${isOk ? 'ok' : 'ng'}`;
        }

        // 3. 好感度ランク
        const friendshipEl = document.querySelector('#debug-speaki-friendship .debug-val');
        if (friendshipEl) {
            const isOk = speaki0.status.friendship >= 31;
            friendshipEl.textContent = `${speaki0.status.friendship.toFixed(1)}${isOk ? ' (OK)' : ' (NG)'}`;
            friendshipEl.className = `debug-val ${isOk ? 'ok' : 'ng'}`;
        }

        // 4. 現在の状態 (待機中か)
        const stateEl = document.querySelector('#debug-speaki-state .debug-val');
        if (stateEl) {
            const isOk = speaki0.status.state === STATE.IDLE;
            stateEl.textContent = isOk ? 'IDLE (OK)' : `${speaki0.status.state} (NG)`;
            stateEl.className = `debug-val ${isOk ? 'ok' : 'ng'}`;
        }
    }

    _updateItemLifecycles() {
        const now = Date.now();
        for (let i = this.placedItems.length - 1; i >= 0; i--) {
            const item = this.placedItems[i];
            const def = ITEMS[item.id];
            if (!def || !def.transform) continue;
            if (now - item.placedTime > def.transform.duration) {
                this._processItemTransform(item, i, def.transform);
            }
        }
    }

    _processItemTransform(item, index, transform) {
        if (transform.isAdult) {
            this.addSpeaki(item.x, item.y);
            this.placedItems.splice(index, 1);
            return;
        }
        if (transform.nextId) {
            this._transformItemTo(item, transform.nextId);
        }
    }

    _transformItemTo(item, nextId) {
        const nextDef = ITEMS[nextId];
        if (!nextDef) return;
        item.id = nextId;
        item.size = nextDef.size || item.size;
        item.placedTime = Date.now();
        if (nextDef.soundfile) this.playSound(nextDef.soundfile, nextDef.pitch || 1.0);
        if (nextDef.text) {
            item.displayText = nextDef.text;
            item.textDisplayUntil = Date.now() + 15000;
        }
    }

    updateSpeakiListUI() {
        const listContainer = document.getElementById('speaki-list');
        if (!listContainer) return;
        if (this.speakis.length === 0) {
            listContainer.innerHTML = '<p class="empty-list">スピキはいません</p>';
            return;
        }

        let html = '';
        this.speakis.forEach(s => {
            const label = s.getFriendshipLabel();
            const cls = s.getFriendshipClass();
            const state = s.getStateLabel();
            const emotionLabel = this._getEmotionLabel(s);

            html += `
                <div class="speaki-entry">
                    <div class="speaki-entry-header">
                        <span class="speaki-name">ｽﾋﾟｷ (${s.id + 1}ﾋﾟｷ目)</span>
                        <span class="speaki-friendship ${cls}">${label}</span>
                    </div>
                    <div class="speaki-detail">
                        <div class="speaki-detail-item">
                            <span>なにをしているか:</span>
                            <span class="speaki-detail-val">${state}</span>
                        </div>
                        <div class="speaki-detail-item">
                            <span>きもち:</span>
                            <span class="speaki-detail-val">${emotionLabel}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        listContainer.innerHTML = html;
    }

    _getEmotionLabel(s) {
        if (s.status.state === STATE.USER_INTERACTING) {
            if (s.status.emotion === 'sad') return 'いたい...';
            if (s.status.friendship >= 11) return 'うれしい！';
            return 'なでなで';
        }
        if (s.status.emotion === 'ITEM') return 'ワクワク';
        if (s.status.emotion === 'happy') return 'しあわせ';
        if (s.status.emotion === 'sad') return 'かなしい';
        return '穏やか';
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.placedItems.forEach(item => {
            const itemDef = ITEMS[item.id];
            if (!itemDef) return;
            const imgKey = itemDef.imagefile ? itemDef.imagefile.replace('.png', '') : '';
            if (this.images[imgKey]) {
                const img = this.images[imgKey];
                this.ctx.drawImage(img, item.x - item.size / 2, item.y - item.size / 2, item.size, item.size);
            }
            if (item.displayText && Date.now() < item.textDisplayUntil) {
                this.ctx.save();
                this.ctx.font = "bold 18px 'Zen Maru Gothic', sans-serif";
                this.ctx.textAlign = 'center';
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.lineWidth = 3;
                const textY = item.y - item.size / 2 - 10;
                this.ctx.strokeText(item.displayText, item.x, textY);
                this.ctx.fillText(item.displayText, item.x, textY);
                this.ctx.restore();
            }
        });
    }
}
