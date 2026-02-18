import { STATE, ASSETS, ITEMS } from './config.js';

/**
 * すべてのキャラクター（動体オブジェクト）の基底クラス
 */
export class BaseCharacter {
    constructor(id, parentElement, x, y, options = {}) {
        this.id = id;
        this.parentElement = parentElement;
        this.characterType = options.characterType || 'speaki'; // アセットのプレフィックス (speaki, mob 等)
        this.name = options.name || `${this.characterType}_${id}`;

        // 1. 位置と物理状態
        this.pos = {
            x: x,
            y: y,
            targetX: x,
            targetY: y,
            angle: 0,
            speed: options.speed || (1.5 + Math.random() * 2.5),
            facingLeft: true,
            destinationSet: false
        };

        // 2. 基本ステータス
        this.status = {
            state: STATE.IDLE,
            stateStack: [],
            friendship: options.friendship || 0,
            hunger: options.hunger || 50,
            emotion: 'happy',
            action: 'idle',
            size: options.size || 160,
            voicePitch: options.voicePitch || 1.0
        };

        // 3. 表示とアニメーション
        this.visual = {
            dom: {},
            distortion: { skewX: 0, rotateX: 0, scale: 1.0 },
            targetDistortion: { skewX: 0, rotateX: 0, scale: 1.0 },
            motionType: 'none',
            motionTimer: 0,
            currentAssetKey: '',
            currentAsset: null,
            currentVoice: null
        };

        // 4. 操作状態
        this.interaction = {
            isInteracting: false,
            isPetting: false,
            isActuallyDragging: false,
            targetItem: null,
            lastMouseX: 0,
            lastMouseY: 0
        };

        this.timers = {
            stateStart: Date.now(),
            actionStart: 0,
            actionDuration: 0,
            interactStart: 0,
            waitDuration: 1000 + Math.random() * 4000,
            lastHeartTime: 0
        };

        if (this.parentElement) {
            this.createDOM();
            this.syncDOM(); // 初期位置を即座に反映
        }
        this._onStateChanged(this.status.state);
    }

    /** DOM要素の生成 */
    createDOM() {
        this.visual.dom = {};

        const container = document.createElement('div');
        container.className = `${this.characterType}-sprite-container char-sprite-container`;

        const img = document.createElement('img');
        img.className = 'char-sprite';

        const emoji = document.createElement('div');
        emoji.className = 'char-emoji-overlay';

        // セリフ表示用テキスト
        const chatText = document.createElement('div');
        chatText.className = 'char-chat-text';

        // ギフト表示用（オーバーレイ画像）
        const gift = document.createElement('img');
        gift.className = 'char-gift-overlay hidden';
        gift.src = 'assets/images/gift.png';

        // 名前表示用ラベル
        const nameTag = document.createElement('div');
        nameTag.className = 'char-name-tag';

        container.appendChild(img);
        container.appendChild(gift);
        container.appendChild(emoji);
        container.appendChild(chatText);
        container.appendChild(nameTag);
        this.parentElement.appendChild(container);

        this.visual.dom.container = container;
        this.visual.dom.sprite = img;
        this.visual.dom.gift = gift;
        this.visual.dom.emoji = emoji;
        this.visual.dom.chatText = chatText;
        this.visual.dom.nameTag = nameTag;
    }

    /** フレームごとの更新処理 */
    update(dt) {
        // 1. 表示関連（状態に関わらず毎フレーム実行）
        this._updateDistortion(dt);
        this.syncDOM();

        // 2. インタラクト中はAI処理を停止
        if (this.interaction.isInteracting) return;

        // 3. 判断フェーズ：状況に応じてSTATEを切り替える
        this._updateStateTransition();

        // 4. 実行フェーズ：現在のSTATEに応じた行動をとる
        this._executeStateAction(dt);

        // 5. 社会的相互作用（他のキャラを検知）
        this._checkSocialInteractions();

        // 空腹度の進行
        this.status.hunger = Math.max(0, this.status.hunger - dt / 5000); // 減りを緩やかに

        // 表情の基本更新（オーバーライド可能）
        this._updateAppearanceByStatus();
    }

    /** 状態遷移の判定 (サブクラスで拡張可能) */
    _updateStateTransition() {
        const now = Date.now();
        const dist = this.pos.destinationSet ? Math.sqrt(Math.pow(this.pos.targetX - this.pos.x, 2) + Math.pow(this.pos.targetY - this.pos.y, 2)) : 999;
        const arrived = dist <= 10;

        // 空腹時の挙動
        if (this.status.hunger <= 0 && this.status.state === STATE.WALKING) {
            this.status.state = STATE.IDLE;
            this._onStateChanged(this.status.state);
            return;
        }

        switch (this.status.state) {
            case STATE.IDLE:
                if (now - this.timers.stateStart > this.timers.waitDuration) {
                    this.status.state = STATE.WALKING;
                    this._onStateChanged(this.status.state);
                }
                break;

            case STATE.WALKING:
                if (arrived) {
                    this.status.state = STATE.IDLE;
                    this._onStateChanged(this.status.state);
                    this._handleArrival();
                }
                break;

            case STATE.ITEM_APPROACHING:
                if (arrived) {
                    this.status.state = STATE.ITEM_ACTION;
                    if (this.interaction.targetItem) {
                        this._performItemAction(this.interaction.targetItem);
                    }
                    this._onStateChanged(this.status.state);
                }
                break;

            case STATE.ITEM_ACTION:
                const duration = this.timers.actionDuration || 3000;
                if (now - this.timers.actionStart > duration) {
                    this.status.state = STATE.IDLE;
                    this._onStateChanged(this.status.state);
                }
                break;

            case STATE.GAME_APPROACHING:
                if (arrived) {
                    this.status.state = STATE.GAME_REACTION;
                    this.timers.actionStart = Date.now();
                    this.timers.actionDuration = 4000;
                    this._onStateChanged(this.status.state);
                }
                break;

            case STATE.GAME_REACTION:
                if (now - this.timers.actionStart > (this.timers.actionDuration || 4000)) {
                    this.status.state = STATE.IDLE;
                    this._onStateChanged(this.status.state);
                }
                break;
        }
    }

    /** ステータスに基づ外見の決定 */
    _updateAppearanceByStatus() {
        const isStarving = this.status.hunger <= 0;
        const isSpecialState = [STATE.ITEM_ACTION, STATE.GAME_REACTION].includes(this.status.state);

        if ((this.status.friendship <= -11 || isStarving) && !isSpecialState) {
            this.status.emotion = 'sad';
        }
    }

    /** 現在の状態に応じた行動の実行 */
    _executeStateAction(dt) {
        const movementStates = [
            STATE.WALKING, STATE.ITEM_APPROACHING, STATE.GAME_APPROACHING,
            STATE.GIFT_LEAVING, STATE.GIFT_RETURNING
        ];
        const staticStates = [
            STATE.IDLE, STATE.USER_INTERACTING, STATE.ITEM_ACTION, STATE.GAME_REACTION,
            STATE.GIFT_SEARCHING, STATE.GIFT_WAIT_FOR_USER_REACTION, STATE.GIFT_TIMEOUT
        ];

        if (movementStates.includes(this.status.state)) {
            if (!this.pos.destinationSet) {
                this._decideNextDestination();
            }
            this._processMovement();
        }
        else if (staticStates.includes(this.status.state)) {
            if (this.pos.destinationSet) {
                this._handleArrival();
            }
        }
    }

    /** DOMの同期表示 */
    syncDOM() {
        const dom = this.visual.dom;
        if (!dom.container) return;

        // ハイライトの反映
        if (typeof window !== 'undefined' && window.game && window.game.highlightedCharId === this.id) {
            dom.container.classList.add('highlighted');
        } else {
            dom.container.classList.remove('highlighted');
        }

        // 画像の切り替え
        if (this.visual.currentAsset && this.visual.currentAsset.imagefile && typeof window !== 'undefined' && window.game) {
            const game = window.game;
            const img = game.images[this.visual.currentAsset.imagefile];
            if (img && dom.sprite.src !== img.src) {
                dom.sprite.src = img.src;
            }
        }

        // 位置とサイズ
        dom.container.style.width = `${this.status.size}px`;
        dom.container.style.height = `${this.status.size}px`;

        const bob = Math.sin(Date.now() / 200 + this.id * 100) * (this.status.size / 30);
        const screenX = this.pos.x - this.status.size / 2;
        const screenY = this.pos.y - this.status.size / 2 + bob;

        dom.container.style.transform = `translate(${screenX}px, ${screenY}px)`;

        const flip = this.pos.facingLeft ? 1 : -1;
        const transform = `perspective(800px) rotateX(${this.visual.distortion.rotateX}deg) skewX(${this.visual.distortion.skewX}deg) scale(${this.visual.distortion.scale}) scaleX(${flip})`;
        dom.sprite.style.transform = transform;

        // セリフ表示
        dom.chatText.textContent = (this.visual.currentAsset && this.visual.currentAsset.text) || '';

        // 名前表示
        if (dom.nameTag) {
            dom.nameTag.textContent = this.name;
        }
    }

    /** 目的地到着時の処理 */
    _handleArrival() {
        this.timers.stateStart = Date.now();
        this.pos.destinationSet = false;
        this.timers.waitDuration = 2000 + Math.random() * 6000;
        if (this.status.state === STATE.WALKING) {
            this.status.action = 'idle';
        }
    }

    /** 目的地決定ロジック */
    _decideNextDestination() {
        const canvasWidth = this.parentElement ? this.parentElement.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 1200);
        const canvasHeight = this.parentElement ? this.parentElement.clientHeight : (typeof window !== 'undefined' ? window.innerHeight : 800);

        this.status.action = 'walking';
        this.pos.destinationSet = true;

        if (this.status.state === STATE.ITEM_APPROACHING && this.interaction.targetItem) {
            this.pos.targetX = this.interaction.targetItem.x;
            this.pos.targetY = this.interaction.targetItem.y;
            return;
        }

        this._decideWanderingDestination(canvasWidth, canvasHeight);
    }

    /** ランダム散歩の目的地決定 */
    _decideWanderingDestination(w, h) {
        // 食べ物の探索 (空腹時)
        if (this.status.hunger <= 0) {
            const game = window.game;
            const foodItems = game ? game.placedItems.filter(it => {
                const def = ITEMS[it.id];
                const dist = Math.sqrt((it.x - this.pos.x) ** 2 + (it.y - this.pos.y) ** 2);
                // isFood が true のものだけを探す
                return def && def.isFood && dist <= 500;
            }) : [];

            if (foodItems.length > 0 && Math.random() < 0.5) {
                this.approachItem(foodItems[Math.floor(Math.random() * foodItems.length)]);
                return;
            }
        }

        // 通常のランダム位置
        this.interaction.targetItem = null;
        this.pos.targetX = Math.random() * (w - 100) + 50;
        this.pos.targetY = Math.random() * (h - 100) + 50;
    }

    /** 移動処理 */
    _processMovement() {
        if (!this.pos.destinationSet) return;

        const dx = this.pos.targetX - this.pos.x;
        const dy = this.pos.targetY - this.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 5) {
            this._handleArrival();
            return;
        }

        const angle = Math.atan2(dy, dx);
        this.pos.x += Math.cos(angle) * this.pos.speed;
        this.pos.y += Math.sin(angle) * this.pos.speed;
        this.pos.angle = angle;

        if (Math.abs(dx) > 1) {
            this.pos.facingLeft = dx < 0;
        }
    }

    /** 状態変更時の初期化 */
    _onStateChanged(newState) {
        const isActualChange = this.status.state !== newState;
        this._stopCurrentVoice();
        this.timers.stateStart = Date.now();
        if (isActualChange) {
            this.pos.destinationSet = false; // 実際に状態が変わった時のみリセット
        }
        this._applyStateAppearance(newState);
        this._applySelectedAsset(newState);
        this.visual.motionTimer = 0;
    }

    /** 音声の停止 */
    _stopCurrentVoice() {
        if (this.visual.currentVoice) {
            this.visual.currentVoice.loop = false;
            this.visual.currentVoice.pause();
            this.visual.currentVoice = null;
        }
    }

    /** 状態に基づいた基本感情・アクション設定 */
    _applyStateAppearance(state) {
        const isSpecialEmotion = [STATE.ITEM_ACTION, STATE.GAME_REACTION].includes(state);
        if (!isSpecialEmotion) {
            this._updateBaseEmotion();
        }

        switch (state) {
            case STATE.IDLE: this.status.action = 'idle'; break;
            case STATE.WALKING:
            case STATE.ITEM_APPROACHING: this.status.action = 'walking'; break;
            case STATE.USER_INTERACTING:
                if (this.status.action === 'walking') this.status.action = 'idle';
                break;
            case STATE.GAME_APPROACHING:
                this.status.action = 'walking';
                this.status.emotion = 'happy';
                break;
            case STATE.GAME_REACTION:
                this.status.action = 'idle';
                this.status.emotion = 'happy';
                break;
        }
    }

    /** 好感度に基づく基本感情更新 */
    _updateBaseEmotion() {
        if (this.status.friendship <= -11 || this.status.hunger <= 0) {
            this.status.emotion = 'sad';
        } else if (this.status.friendship <= 10) {
            this.status.emotion = 'normal';
        } else {
            this.status.emotion = 'happy';
        }
    }

    /** アセットの選択と適用 */
    _applySelectedAsset(state) {
        const type = [STATE.ITEM_ACTION, STATE.USER_INTERACTING, STATE.GAME_REACTION].includes(state) ? 'performance' : 'mood';

        // 新しい階層構造: ASSETS[characterType][type][emotion][action]
        const charAssets = ASSETS[this.characterType];
        if (!charAssets || !charAssets[type]) return;

        let variations = null;
        const emotion = this.status.emotion;
        const action = this.status.action;

        // 1. 指定された感情とアクションで検索
        if (charAssets[type][emotion] && charAssets[type][emotion][action]) {
            variations = charAssets[type][emotion][action];
        }

        // 2. なければ 'normal' 感情で再試行 (mood の場合など)
        if (!variations && charAssets[type]['normal'] && charAssets[type]['normal'][action]) {
            variations = charAssets[type]['normal'][action];
        }

        // 3. それでもなければ汎用アイテムリアクション (ITEM_ACTION時)
        if (!variations && state === STATE.ITEM_ACTION && charAssets[type]['ITEM'] && charAssets[type]['ITEM']['generic']) {
            variations = charAssets[type]['ITEM']['generic'];
        }

        if (!variations || variations.length === 0) {
            this.visual.currentAsset = null;
            return;
        }

        // ランダムにバリエーションを選択
        const assetData = variations[Math.floor(Math.random() * variations.length)];

        // 互換性のためのキー生成（デバッグ用などに一応残すか、不要なら消す）
        this.visual.currentAssetKey = `${this.characterType}_${type}_${emotion}_${action}`;
        this.visual.currentAsset = assetData;
        this.visual.motionType = assetData.movePattern || 'none';

        this._playAssetSound(assetData, type);
    }

    /** 音声再生 */
    _playAssetSound(data, type) {
        if (!data.soundfile || typeof window === 'undefined' || !window.game) return;

        // 個体ごとの声の高さ (voicePitch) を反映
        this.visual.currentVoice = window.game.playSound(data.soundfile, (data.pitch || 1.0) * this.status.voicePitch);

        const voice = this.visual.currentVoice;
        if (type === 'performance' && voice) {
            const updateDur = () => {
                if (isNaN(voice.duration) || voice.duration <= 0) return;
                this.timers.actionDuration = (voice.duration / (data.pitch || 1.0)) * 1000;
            };
            if (voice.readyState >= 1) updateDur();
            else voice.addEventListener('loadedmetadata', updateDur, { once: true });
        }
    }

    /** アイテムアクション実行 */
    _performItemAction(item) {
        const game = window.game;
        const def = ITEMS[item.id];

        // 1. 早いもの勝ち判定: まだアイテムが場にあるか
        const isStillThere = game && game.placedItems.includes(item);

        if (!isStillThere) {
            // アイテムが既になかった場合 (ガッカリ)
            // STATE.ITEM_ACTION のままにして、特定のリアクションを可能にする
            this.status.emotion = 'sad';
            this.status.action = item.id;
            this.timers.actionDuration = 3000;
        } else {
            // 2. アイテムが存在する場合の動作
            this.status.emotion = 'ITEM';
            this.status.action = item.id;

            if (def && def.isFood) {
                // 食べ物なら食べる (ステータス回復)
                if (def.nutrition) {
                    this.status.hunger = Math.min(100, this.status.hunger + def.nutrition);
                }

                if (item.consume()) {
                    if (game) {
                        const idx = game.placedItems.indexOf(item);
                        if (idx !== -1) game.placedItems.splice(idx, 1);
                    }
                }
                // 食べられたので「うれしい」状態をセット (次回のアセット選択に影響)
                this.status.emotion = 'happy';
            } else {
                // 食べ物でないなら遊ぶだけ (消費しない)
                // emotion=ITEM, action=item.id のまま
            }
            this.timers.actionDuration = 0; // _applySelectedAsset 等で設定される
        }

        this.timers.actionStart = Date.now();
        this.timers.stateStart = this.timers.actionStart;
        this.interaction.targetItem = null;
    }

    /** アイテムへの接近 */
    approachItem(item, offset = 100) {
        if (!item) return;
        this.status.state = STATE.ITEM_APPROACHING;
        this.interaction.targetItem = item;

        const dx = this.pos.x - item.x;
        const dy = this.pos.y - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.pos.targetX = item.x + (dx / dist) * offset;
            this.pos.targetY = item.y + (dy / dist) * offset;
        } else {
            this.pos.targetX = item.x + offset;
            this.pos.targetY = item.y;
        }
        this.pos.destinationSet = true;
        this._onStateChanged(this.status.state);
    }

    /** 近くのキャラを検知して交流を開始する */
    _checkSocialInteractions() {
        if (![STATE.IDLE, STATE.WALKING].includes(this.status.state)) return;

        const now = Date.now();
        if (now - (this.timers.lastSocialCheck || 0) < 8000) return;
        this.timers.lastSocialCheck = now;

        const game = window.game;
        if (!game || game.speakis.length < 2) return;

        // 低確率で発動
        if (Math.random() > 0.3) return;

        const other = game.speakis.find(s => s !== this && [STATE.IDLE, STATE.WALKING].includes(s.status.state));
        if (other) {
            const dist = Math.sqrt((other.pos.x - this.pos.x) ** 2 + (other.pos.y - this.pos.y) ** 2);
            if (dist < 400 && dist > 100) {
                this.status.state = STATE.GAME_APPROACHING;
                this.pos.targetX = other.pos.x + (Math.random() * 80 - 40);
                this.pos.targetY = other.pos.y + (Math.random() * 80 - 40);
                this.pos.destinationSet = true;
                this._onStateChanged(this.status.state);
            }
        }
    }

    /** 歪みアニメーション更新 */
    _updateDistortion(dt) {
        this.visual.motionTimer += dt || 16;
        if (this.interaction.isPetting) {
            this.visual.distortion.skewX += (this.visual.targetDistortion.skewX - this.visual.distortion.skewX) * 0.15;
            this.visual.distortion.rotateX += (this.visual.targetDistortion.rotateX - this.visual.distortion.rotateX) * 0.15;
            this.visual.distortion.scale += (this.visual.targetDistortion.scale - this.visual.distortion.scale) * 0.15;
            return;
        }

        switch (this.visual.motionType) {
            case 'shake':
                this.visual.distortion.skewX = Math.sin(this.visual.motionTimer * 0.05) * 10;
                break;
            case 'stretch':
                const stretch = Math.sin(this.visual.motionTimer * 0.01) * 0.1;
                this.visual.distortion.scale = 1.0 + stretch;
                this.visual.distortion.rotateX = stretch * -50;
                break;
            case 'bounce':
                const bounce = Math.abs(Math.sin(this.visual.motionTimer * 0.01)) * 0.1;
                this.visual.distortion.scale = 1.0 + bounce;
                break;
            case 'swing':
                const swing = Math.sin(this.visual.motionTimer * 0.005);
                this.visual.distortion.skewX = swing * 15;
                this.visual.distortion.scale = 1.0 + Math.abs(swing) * 0.25;
                break;
            default:
                this.visual.distortion.skewX *= 0.85;
                this.visual.distortion.rotateX *= 0.85;
                this.visual.distortion.scale += (1.0 - this.visual.distortion.scale) * 0.15;
                break;
        }
    }

    /** 表情やアクションを強制設定 (主にGameクラスから) */
    setExpression(action, emotion) {
        if (action) this.status.action = action;
        if (emotion) this.status.emotion = emotion;
        this._applySelectedAsset(this.status.state);
    }
}
