import { STATE, ASSETS, ITEMS } from './config.js';

export class Speaki {
    /** コンストラクタ: Speakiの初期化 */
    constructor(id, parentElement, x, y) {
        this.id = id;
        this.parentElement = parentElement;

        // 状態プロパティ
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.size = 160;
        this.speed = 1.5 + Math.random() * 2.5; // 1.5 〜 4.0 の範囲でランダム化
        this.state = STATE.IDLE;
        this.stateStack = [];  // 割り込まれた状態を保存するスタック

        // 好感度パラメータ (-50 〜 +50)
        this.friendship = 0;

        this.emotion = 'happy';
        this.action = 'idle';
        this.angle = 0;
        this.lastDecisionTime = 0;

        // 時間管理
        this.arrivalTime = Date.now();
        this.destinationSet = false;
        this.waitDuration = 1000 + Math.random() * 4000; // 最初もバラバラに動くようにランダム化（1~5秒）
        this.actionStartTime = 0;      // アクション開始時刻
        this.actionDuration = 0;       // アクション継続時間
        this.searchStartTime = 0;      // お土産探索開始時刻
        this.reactionStartTime = 0;    // リアクション開始時刻
        this.eventStartTime = 0;       // 汎用イベント開始時刻
        this.pettingStartTime = 0;     // なでなで開始時刻
        this.lastHeartTime = 0;        // 最後にハートを生成した時刻

        this.interactionType = null;   // 'move' or 'petting'

        this.facingLeft = true; // 現在向いている方向 (true: 左, false: 右)

        this.distortion = { skewX: 0, rotateX: 0, scale: 1.0 };
        this.targetDistortion = { skewX: 0, rotateX: 0, scale: 1.0 };

        // インタラクション (操作) 状態
        this.isInteracting = false;      // 操作中（マウスダウン中）か
        this.isPetting = false;          // なでなで（一定以上の移動）が確定したか
        this.interactStartTime = 0;      // 操作開始時刻
        this.isActuallyDragging = false; // ドラッグ移動しているか（内部フラグとして維持）

        // アセット管理用
        this.currentAssetKey = ''; // 現在のアセットキー
        this.currentAsset = null;  // 現在選択されているアセットデータ
        this.currentImgSrc = '';   // 現在選択されている画像パス
        this.targetItem = null;    // 現在向かっているアイテム同期用

        // DOM生成
        this.createDOM();

        // 初期アセットを適用（感情のランダム化と画像のセット）
        this._onStateChanged(this.state);
    }

    /** DOM要素の生成 */
    createDOM() {
        this.dom = {};

        const container = document.createElement('div');
        container.className = 'speaki-sprite-container';

        const img = document.createElement('img');
        img.className = 'speaki-sprite';
        // img.src はこの後の syncSpeakiDOM() で設定されるためここでは不要

        const emoji = document.createElement('div');
        emoji.className = 'speaki-emoji-overlay';

        // デバッグ用テキスト（アセット名用）
        const debugText = document.createElement('div');
        debugText.style.position = 'absolute';
        debugText.style.left = '100%';
        debugText.style.top = '50%';
        debugText.style.transform = 'translateY(-50%)';
        debugText.style.whiteSpace = 'nowrap';
        debugText.style.fontSize = '12px';
        debugText.style.color = '#fff';
        debugText.style.background = 'rgba(0,0,0,0.5)';
        debugText.style.padding = '2px 5px';
        debugText.style.borderRadius = '4px';
        debugText.style.pointerEvents = 'none';
        debugText.style.display = 'block';

        const gift = document.createElement('img');
        gift.className = 'speaki-gift-overlay hidden';
        gift.src = 'assets/images/gift.png';

        container.appendChild(img);
        container.appendChild(gift);
        container.appendChild(emoji);
        container.appendChild(debugText);
        this.parentElement.appendChild(container); // 親要素に追加

        this.dom.container = container;
        this.dom.sprite = img;
        this.dom.gift = gift;
        this.dom.emoji = emoji;
        this.dom.debugText = debugText;
    }

    /** フレームごとの更新処理 */
    update(dt) {
        // 1. 表示関連（状態に関わらず毎フレーム実行）
        this._updateDistortion(dt);
        this.syncSpeakiDOM();

        // 2. インタラクト中はAI処理を停止
        if (this.isInteracting) return;

        // 3. 判断フェーズ：状況に応じてSTATEを切り替える
        this._updateStateTransition();

        // 4. 実行フェーズ：現在のSTATEに応じた行動をとる
        this._executeStateAction(dt);

        // 好感度の自然回復（マイナスの時のみ、0にゆっくり近づく）
        if (this.friendship < 0) {
            this.friendship += 0.005; // 1秒で約0.3回復するペース
            if (this.friendship > 0) this.friendship = 0;
        }

        // 好感度が「低い」または「とっても低い」場合は表情を「かなしい」に固定
        // (ただしアイテム反応中のワクワクは例外とする)
        if (this.friendship <= -11 && this.emotion !== 'ITEM') {
            this.emotion = 'sad';
        }
    }

    /** 状態の切り替え判定（判断のみ） */
    _updateStateTransition() {
        const now = Date.now();
        const dist = this.destinationSet ? Math.sqrt(Math.pow(this.targetX - this.x, 2) + Math.pow(this.targetY - this.y, 2)) : 999;
        const arrived = dist <= 10;

        switch (this.state) {
            case STATE.IDLE: this._checkIdleState(now); break;
            case STATE.WALKING: this._checkWalkingState(arrived); break;
            case STATE.GIFT_LEAVING: this._checkGiftLeavingState(arrived); break;
            case STATE.GIFT_SEARCHING: this._checkGiftSearchingState(now); break;
            case STATE.GIFT_RETURNING: this._checkGiftReturningState(now, arrived); break;
            case STATE.GIFT_WAIT_FOR_USER_REACTION: this._checkGiftWaitState(now); break;
            case STATE.GIFT_REACTION: this._checkGiftReactionState(now); break;
            case STATE.GIFT_TIMEOUT: this._checkGiftTimeoutState(now); break;
            case STATE.ITEM_APPROACHING: this._checkItemApproachingState(arrived); break;
            case STATE.ITEM_ACTION: this._checkItemActionState(now); break;
        }
    }

    /** IDLE状態の遷移チェック */
    _checkIdleState(now) {
        // 低好感度時の隠れ処理
        if (this._tryHideWhenFriendshipLow()) return;

        // お土産イベント開始チェック
        if (this._tryStartGiftEvent(now)) return;

        // 通常の待機終了チェック
        if (now - this.arrivalTime > this.waitDuration) {
            this.state = STATE.WALKING;
            this._onStateChanged(this.state);
        }
    }

    /** 低好感度（とっても低い）時の隠れ場所移動試行 */
    _tryHideWhenFriendshipLow() {
        if (this.friendship > -31) return false;

        const hiddenX = 60;  // 隠れ家 (hideout.png) の中心付近
        const hiddenY = 80;
        const distToHidden = Math.sqrt((this.x - hiddenX) ** 2 + (this.y - hiddenY) ** 2);

        if (distToHidden <= 30) return false; // すでに隠れ家の中にいれば何もしない

        this.state = STATE.WALKING;
        this.targetX = hiddenX;
        this.targetY = hiddenY;
        this.destinationSet = true;
        this._onStateChanged(this.state);
        return true;
    }

    /** お土産イベント開始試行 */
    _tryStartGiftEvent(now) {
        const game = window.game;
        const timeSinceLastGift = now - game.lastGiftTime;
        const canStartGift = this.friendship >= 31 && timeSinceLastGift >= 30000 && !game.giftPartner;

        if (!canStartGift) return false;

        this.state = STATE.GIFT_LEAVING;
        game.giftPartner = this;
        this._onStateChanged(this.state);
        return true;
    }

    /** WALKING状態の遷移チェック */
    _checkWalkingState(arrived) {
        if (!arrived) return;
        this.state = STATE.IDLE;
        this._onStateChanged(this.state);
        this._handleArrival();
    }

    /** GIFT_LEAVING状態の遷移チェック */
    _checkGiftLeavingState(arrived) {
        if (!arrived) return;
        this.state = STATE.GIFT_SEARCHING;
        this._onStateChanged(this.state);
    }

    /** GIFT_SEARCHING状態の遷移チェック */
    _checkGiftSearchingState(now) {
        if (now - this.arrivalTime <= 5000) return;
        this.state = STATE.GIFT_RETURNING;
        this._onStateChanged(this.state);
    }

    /** GIFT_RETURNING状態の遷移チェック */
    _checkGiftReturningState(now, arrived) {
        if (!arrived) return;
        this.state = STATE.GIFT_WAIT_FOR_USER_REACTION;
        window.game.startGiftReceiveEvent(this);
        this.eventStartTime = now;
        this._onStateChanged(this.state);
    }

    /** GIFT_WAIT_FOR_USER_REACTION状態の遷移チェック */
    _checkGiftWaitState(now) {
        if (now - this.eventStartTime <= 10000) return;
        this.state = STATE.GIFT_TIMEOUT;
        this.eventStartTime = now;
        window.game.updateGiftUI('hide');
        this._onStateChanged(this.state);
    }

    /** GIFT_REACTION状態の遷移チェック */
    _checkGiftReactionState(now) {
        const reactionDur = this.actionDuration || 3000;
        if (now - this.eventStartTime <= reactionDur) return;
        window.game.completeGiftEvent();
        this._onStateChanged(STATE.IDLE);
    }

    /** GIFT_TIMEOUT状態の遷移チェック */
    _checkGiftTimeoutState(now) {
        const timeoutDur = this.actionDuration || 5000;
        if (now - this.eventStartTime <= timeoutDur) return;
        window.game.completeGiftEvent();
        this._onStateChanged(STATE.IDLE);
    }

    /** ITEM_APPROACHING状態の遷移チェック */
    _checkItemApproachingState(arrived) {
        if (!arrived) return;
        this.state = STATE.ITEM_ACTION;
        if (this.targetItem) {
            this._performItemAction(this.targetItem);
        }
        this._onStateChanged(this.state);
    }

    /** ITEM_ACTION状態の遷移チェック */
    _checkItemActionState(now) {
        const duration = this.actionDuration || 3000;
        if (now - this.actionStartTime <= duration) return;
        this.state = STATE.IDLE;
        this._onStateChanged(this.state);
    }

    /** 状態変更時のエフェクト発動（ASSETS方式） */
    _onStateChanged(newState) {
        // 1. 前の音声を停止
        this._stopCurrentVoice();

        // 2. 状態に応じた感情・アクションの自動割り当て
        this._applyStateAppearance(newState);

        // 2.5 低好感度時は表情を強制固定
        if (this.friendship <= -11 && this.emotion !== 'ITEM') {
            this.emotion = 'sad';
        }

        // 3. アセットの選択と適用
        this._applySelectedAsset(newState);

        // 6. モーションのリセット
        this.motionTimer = 0;
    }

    /** 再生中の音声を停止 */
    _stopCurrentVoice() {
        if (this.currentVoice) {
            this.currentVoice.loop = false; // ループ解除
            this.currentVoice.pause();
            this.currentVoice.currentTime = 0; // 頭出し
            this.currentVoice = null;
        }
    }

    /** 状態に基づいたデフォルトの外見設定 */
    _applyStateAppearance(state) {
        // 基本感情を好感度に基づいて更新（ただしアイテム、ギフト等は除く）
        const isSpecialEmotion = [STATE.ITEM_ACTION, STATE.GIFT_RETURNING, STATE.GIFT_WAIT_FOR_USER_REACTION, STATE.GIFT_REACTION].includes(state);
        if (!isSpecialEmotion) {
            this._updateBaseEmotion();
        }

        switch (state) {
            case STATE.IDLE:
                // _updateBaseEmotionで設定されるためここではactionのみ
                this.action = 'idle';
                break;
            case STATE.WALKING:
            case STATE.ITEM_APPROACHING:
                this.action = 'walking';
                break;
            case STATE.GIFT_LEAVING:
            case STATE.GIFT_RETURNING:
                this.emotion = 'happy';
                this.action = 'walking';
                break;
            case STATE.GIFT_WAIT_FOR_USER_REACTION:
                this.emotion = 'happy';
                this.action = 'giftwait';
                break;
            case STATE.GIFT_REACTION:
                this.emotion = 'happy';
                this.action = 'giftreaction';
                break;
            case STATE.GIFT_TIMEOUT:
                this.emotion = 'sad';
                this.action = 'gifttimeout';
                break;
            case STATE.USER_INTERACTING:
                // すでにアクションがセットされている（叩く・撫でる等）場合は上書きしない
                if (this.action === 'walking') {
                    this.action = 'idle';
                }
                break;
        }
    }

    /** 表情とアクションを即座に変更してアセットを反映させる (外部用) */
    setExpression(action, emotion) {
        if (action) this.action = action;
        if (emotion) this.emotion = emotion;
        this._applySelectedAsset(this.state);
    }

    /** 好感度ランクに基づいて基本感情を決定する (ヘルパー) */
    _updateBaseEmotion() {
        if (this.friendship <= -11) {
            this.emotion = 'sad';
        } else if (this.friendship <= 10) {
            this.emotion = 'normal';
        } else {
            this.emotion = 'happy';
        }
    }

    /** 条件に合致するアセットを検索して適用 */
    _applySelectedAsset(state) {
        // 新しいアセットを適用する前に、念のため現在の音声を停止する
        this._stopCurrentVoice();

        const type = [STATE.GIFT_REACTION, STATE.GIFT_TIMEOUT, STATE.ITEM_ACTION, STATE.USER_INTERACTING].includes(state)
            ? 'performance' : 'mood';

        // アセットのフィルタリング (type, emotion, action)
        let candidates = Object.entries(ASSETS).filter(([key]) => {
            const p = key.split('_'); // speaki_type_emotion_action_num
            return p.length >= 4 && p[1] === type && p[2] === this.emotion && p[3] === this.action;
        });

        // 合致しなければ normal 感情で再検索
        if (candidates.length === 0) {
            candidates = Object.entries(ASSETS).filter(([key]) => {
                const p = key.split('_');
                return p[1] === type && p[2] === 'normal' && p[3] === this.action;
            });
        }

        // それでも合致しなければ、ITEM 感情で汎用的なものを検索 (ITEM_ACTION時のみ)
        if (candidates.length === 0 && state === STATE.ITEM_ACTION) {
            candidates = Object.entries(ASSETS).filter(([key]) => {
                const p = key.split('_');
                return p[1] === type && p[2] === 'ITEM' && p[3] === 'generic';
            });
        }

        if (candidates.length === 0) {
            this.currentAsset = null;
            this.motionType = 'none';
            return;
        }

        const [assetKey, assetData] = candidates[Math.floor(Math.random() * candidates.length)];
        this.currentAssetKey = assetKey;
        this.currentAsset = assetData;
        this.motionType = assetData.movePattern || 'none';

        // 音声の再生とDuration設定
        this._playAssetSound(assetData, type);
    }

    /** アセットの音声を再生し、パフォーマンスなら時間を計測 */
    _playAssetSound(data, type) {
        const game = window.game;
        if (!data.soundfile || !game) return;

        this.currentVoice = game.playSound(data.soundfile, data.pitch || 1.0);

        const voice = this.currentVoice;
        if (type === 'performance' && voice) {
            const updateDur = () => {
                if (isNaN(voice.duration) || voice.duration <= 0) return;
                this.actionDuration = voice.duration * 1000;
            };
            if (voice.readyState >= 1) updateDur();
            else voice.addEventListener('loadedmetadata', updateDur, { once: true });
        }
    }

    /** 現在の状態に応じた行動の実行 */
    _executeStateAction(dt) {
        const movementStates = [STATE.WALKING, STATE.GIFT_LEAVING, STATE.GIFT_RETURNING, STATE.ITEM_APPROACHING];
        const staticStates = [STATE.IDLE, STATE.GIFT_SEARCHING, STATE.GIFT_WAIT_FOR_USER_REACTION, STATE.USER_INTERACTING, STATE.ITEM_ACTION];

        if (movementStates.includes(this.state)) {
            // 目的地が決まっていなければ初期化
            if (!this.destinationSet) {
                this._decideNextDestination();
            }
            // 移動を実行
            this._processMovement();
        }
        else if (staticStates.includes(this.state)) {
            // 到着直後（目的地設定が残っている）ならクリーンアップ
            if (this.destinationSet) {
                this._handleArrival();
            }
        }
    }

    /** DOMの表示更新（画像、位置、アニメーションなど） */
    syncSpeakiDOM() {
        const dom = this.dom;

        // 1. 画像切り替え (ASSETSから選択された画像を使用)
        if (this.currentAsset && this.currentAsset.imagefile) {
            const game = window.game;
            const img = game.images[this.currentAsset.imagefile];
            if (img && dom.sprite.src !== img.src) {
                dom.sprite.src = img.src;
            }
        }

        // 2. 位置とサイズ
        dom.container.style.width = `${this.size}px`;
        dom.container.style.height = `${this.size}px`;

        const bob = Math.sin(Date.now() / 200 + this.id * 100) * 5; // IDで位相をずらす
        dom.container.style.left = `${this.x - this.size / 2}px`;
        dom.container.style.top = `${this.y - this.size / 2 + bob}px`;

        const flip = this.facingLeft ? 1 : -1;
        const transform = `perspective(800px) rotateX(${this.distortion.rotateX}deg) skewX(${this.distortion.skewX}deg) scale(${this.distortion.scale}) scaleX(${flip})`;
        dom.sprite.style.transform = transform;

        let isShowingGift = [STATE.GIFT_RETURNING, STATE.GIFT_WAIT_FOR_USER_REACTION, STATE.GIFT_REACTION].includes(this.state);

        if (isShowingGift) {
            dom.gift.classList.remove('hidden');
            // スピキ本体よりも手前に表示するため translateZ(100px) を追加
            dom.gift.style.transform = `translateX(-50%) translateZ(100px) scale(${1.0 / this.distortion.scale}) scaleX(${flip})`;
        } else {
            dom.gift.classList.add('hidden');
        }

        dom.emoji.textContent = ''; // 絵文字は非表示にするため空に

        // 4. セリフ（text）の表示
        dom.debugText.textContent = (this.currentAsset && this.currentAsset.text) || '';
    }

    /** ドラッグ時・モーションアニメーションの更新 */
    _updateDistortion(dt) {
        this.motionTimer += dt || 16;

        // インタラクト中（なでなで確定時）はマウス移動に伴う動的な歪みを適用
        if (this.isPetting) {
            this.distortion.skewX += (this.targetDistortion.skewX - this.distortion.skewX) * 0.15;
            this.distortion.rotateX += (this.targetDistortion.rotateX - this.distortion.rotateX) * 0.15;
            this.distortion.scale += (this.targetDistortion.scale - this.distortion.scale) * 0.15;
            return;
        }

        // ASSETS定義に基づくモーション適用
        switch (this.motionType) {
            case 'shake':
                this.distortion.skewX = Math.sin(this.motionTimer * 0.05) * 10;
                this.distortion.rotateX *= 0.85;
                this.distortion.scale = 1.0;
                break;
            case 'stretch':
                const stretch = Math.sin(this.motionTimer * 0.01) * 0.1;
                this.distortion.scale = 1.0 + stretch;
                this.distortion.rotateX = stretch * -50;
                this.distortion.skewX *= 0.85;
                break;
            case 'bounce':
                const bounce = Math.abs(Math.sin(this.motionTimer * 0.01)) * 0.1;
                this.distortion.scale = 1.0 + bounce;
                this.distortion.skewX *= 0.85;
                this.distortion.rotateX *= 0.85;
                break;
            case 'swing':
                const swingPhase = Math.sin(this.motionTimer * 0.005);
                this.distortion.skewX = swingPhase * 15; // 左右への傾き
                this.distortion.scale = 1.0 + Math.abs(swingPhase) * 0.25; // 伸び
                this.distortion.rotateX = Math.abs(swingPhase) * -10; // 伸びる時の前傾
                break;
            default:
                this.distortion.skewX *= 0.85;
                this.distortion.rotateX *= 0.85;
                this.distortion.scale += (1.0 - this.distortion.scale) * 0.15;
                break;
        }
    }

    /** アイテムへの接近を開始する（共通化メソッド） */
    approachItem(item, offset = 100) {
        if (!item) return;

        this.state = STATE.ITEM_APPROACHING;
        this.targetItem = item;

        // アイテムから自分の方へ offset 離れた位置を目的地にする
        const dx = this.x - item.x;
        const dy = this.y - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.targetX = item.x + (dx / dist) * offset;
            this.targetY = item.y + (dy / dist) * offset;
        } else {
            // 完全に重なっている場合は右にずらす
            this.targetX = item.x + offset;
            this.targetY = item.y;
        }

        this.destinationSet = true;
        this._onStateChanged(this.state);
    }

    /** 目的地を決定（移動開始時の1回だけ実行） */
    _decideNextDestination() {
        const canvasWidth = this.parentElement.clientWidth || window.innerWidth;
        const canvasHeight = this.parentElement.clientHeight || window.innerHeight;

        this.action = 'walking';
        this.destinationSet = true;
        this.currentImgSrc = ''; // 画像の再抽選フラグ

        if (this.state === STATE.GIFT_LEAVING) {
            this.targetX = -100;
            this.targetY = canvasHeight / 2;
            return;
        }

        if (this.state === STATE.GIFT_RETURNING) {
            this.targetX = canvasWidth * 0.4 + (Math.random() * 100 - 50);
            this.targetY = canvasHeight * 0.5 + (Math.random() * 100 - 50);
            this._onStateChanged(this.state);
            return;
        }

        // WALKINGまたはデフォルト（通常の散歩）
        this._decideWanderingDestination(canvasWidth, canvasHeight);
    }

    /** 通常の散歩中の目的地決定 */
    _decideWanderingDestination(w, h) {
        // 低好感度時は隠れ家付近限定
        if (this.friendship <= -31) {
            this.targetItem = null;
            this.targetX = 50 + (Math.random() * 40 - 20);
            this.targetY = 100 + (Math.random() * 40 - 20);
            this.destinationSet = true;
            this._onStateChanged(this.state);
            return;
        }

        // 20%の確率で配置済みアイテムを目指す
        const game = window.game;
        if (game && game.placedItems.length > 0 && Math.random() < 0.2) {
            const item = game.placedItems[Math.floor(Math.random() * game.placedItems.length)];
            this.approachItem(item);
            return;
        }

        // ランダムな位置へ
        this.targetItem = null;
        this.targetX = Math.random() * (w - 100) + 50;
        this.targetY = Math.random() * (h - 100) + 50;
        this._onStateChanged(this.state);
    }

    /** 移動処理 */
    _processMovement() {
        // 目的地が設定されていなければ何もしない
        if (!this.destinationSet) return;

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 目的地に十分近い（5px以内）場合は、到着処理を実行して終了
        if (dist <= 5) {
            this._handleArrival();
            return;
        }

        // 移動継続：角度を計算して座標を更新
        const angle = Math.atan2(dy, dx);

        // 逃走中（好感度が低く、隠れ家に向かっている）なら速度を2倍にする
        let currentSpeed = this.speed;
        const isHeadingToHidden = this.friendship <= -31 && Math.sqrt(Math.pow(this.targetX - 50, 2) + Math.pow(this.targetY - 100, 2)) < 30;
        if (isHeadingToHidden) {
            currentSpeed *= 2.0;
        }

        this.x += Math.cos(angle) * currentSpeed;
        this.y += Math.sin(angle) * currentSpeed;
        this.angle = angle;

        // 進んでいる方向（左右）を更新
        if (Math.abs(dx) > 1) {
            this.facingLeft = dx < 0;
        }
    }

    /** 目的地到着時の物理的なクリーンアップ */
    _handleArrival() {
        this.arrivalTime = Date.now();
        this.destinationSet = false;

        // 到着時（待機開始時）に画像を再抽選させる
        this.currentImgSrc = '';

        // 待機時間をある程度ランダムに決定 (2秒 ~ 8秒)
        this.waitDuration = 2000 + Math.random() * 6000;

        // 到着時の物理的なクリーンアップのみ行う
        // (状態遷移やイベント開始は _updateStateTransition で実行済み)
        if (this.state !== STATE.WALKING) return;
        this.action = 'idle';
    }

    /** アイテムに到着した際の固有アクション */
    _performItemAction(item) {
        this.emotion = 'ITEM';
        this.action = item.id;

        // 時間を記録
        this.actionStartTime = Date.now();
        this.eventStartTime = this.actionStartTime;
        this.targetItem = null;

        // 音声と画像アセットの切り替えは、この後の _onStateChanged(STATE.ITEM_ACTION) が行う
    }

    /** インタラクション終了時の処理（3秒間喜んでから元の行動に戻る） */
    _processFinishInteraction() {
        this.action = 'happy';

        // 3秒間その場で喜ぶモーションを維持する
        setTimeout(() => {
            // 待機中に別のドラッグやイベントが発生して状態が変わっていたら何もしない
            if (this.state !== STATE.USER_INTERACTING) return;

            this.action = 'idle';

            // 好感度が非常に低い場合、インタラクション終了後にすぐに隠れるように（IDLEへ）
            if (this.friendship <= -31) {
                this.state = STATE.IDLE;
                this._onStateChanged(this.state);
                return;
            }

            // 中断されていた行動があればそこに戻り、なければ待機へ
            this.state = (this.stateStack && this.stateStack.length > 0) ? this.stateStack.pop() : STATE.IDLE;
            this._onStateChanged(this.state);
        }, 3000);
    }

    /** 好感度のラベル取得 (5段階) */
    getFriendshipLabel() {
        if (this.friendship >= 31) return '私のことが大好きなようだ';
        if (this.friendship >= 11) return '私を信頼しているようだ';
        if (this.friendship >= -10) return 'ふつう';
        if (this.friendship >= -30) return '私を怖がっているようだ';
        return '怯えきっている (そのうち隠れ家から出てくるだろう)';
    }

    /** 好感度のCSSクラス取得 */
    getFriendshipClass() {
        if (this.friendship >= 31) return 'friendship-v-high';
        if (this.friendship >= 11) return 'friendship-high';
        if (this.friendship >= -10) return 'friendship-normal';
        if (this.friendship >= -30) return 'friendship-low';
        return 'friendship-v-low';
    }

    /** UI表示用のステータス名取得 */
    getStateLabel() {
        if (this.friendship <= -31 && [STATE.IDLE, STATE.WALKING].includes(this.state)) {
            return 'かくれてる';
        }

        switch (this.state) {
            case STATE.IDLE: return '休憩中';
            case STATE.WALKING: return 'お散歩中';
            case STATE.GIFT_LEAVING:
            case STATE.GIFT_SEARCHING:
            case STATE.GIFT_RETURNING: return '何かを探している...';
            case STATE.GIFT_WAIT_FOR_USER_REACTION: return 'にこにこしながらこっちを見ている';
            case STATE.ITEM_APPROACHING: return 'アイテムへ移動中';
            case STATE.ITEM_ACTION: return 'アイテムで遊んでる';
            case STATE.USER_INTERACTING: return 'ふれあい中';
            default: return 'のんびり';
        }
    }
}
