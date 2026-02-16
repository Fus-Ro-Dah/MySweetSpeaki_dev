import { STATE, ASSETS, ITEMS } from './config.js';

export class Speaki {
    /** コンストラクタ: Speakiの初期化 */
    constructor(id, parentElement, x, y) {
        this.id = id;
        this.parentElement = parentElement;

        // 1. 位置と物理状態
        this.pos = {
            x: x,
            y: y,
            targetX: x,
            targetY: y,
            angle: 0,
            speed: 1.5 + Math.random() * 2.5,
            facingLeft: true,
            destinationSet: false
        };

        // 2. 基本ステータス
        this.status = {
            state: STATE.IDLE,
            stateStack: [],
            friendship: 0,
            emotion: 'happy',
            action: 'idle',
            size: 160
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

        // 5. タイマー管理
        this.timers = {
            stateStart: Date.now(),
            actionStart: 0,
            actionDuration: 0,
            interactStart: 0,
            waitDuration: 1000 + Math.random() * 4000,
            lastHeartTime: 0
        };

        // DOM生成
        this.createDOM();

        // 初期アセットを適用
        this._onStateChanged(this.status.state);
    }

    /** DOM要素の生成 */
    createDOM() {
        this.visual.dom = {};

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

        this.visual.dom.container = container;
        this.visual.dom.sprite = img;
        this.visual.dom.gift = gift;
        this.visual.dom.emoji = emoji;
        this.visual.dom.debugText = debugText;
    }

    /** フレームごとの更新処理 (Gameクラスから呼び出される) */
    update(dt) {
        // 1. 表示関連（状態に関わらず毎フレーム実行）
        this._updateDistortion(dt);
        this.syncSpeakiDOM();

        // 2. インタラクト中はAI処理を停止
        if (this.interaction.isInteracting) return;

        // 3. 判断フェーズ：状況に応じてSTATEを切り替える
        this._updateStateTransition();

        // 4. 実行フェーズ：現在のSTATEに応じた行動をとる
        this._executeStateAction(dt);

        // 好感度の自然回復（マイナスの時のみ、0にゆっくり近づく）
        if (this.status.friendship < 0) {
            this.status.friendship += 0.005; // 1秒で約0.3回復するペース
            if (this.status.friendship > 0) this.status.friendship = 0;
        }

        // 好感度が「低い」または「とっても低い」場合は表情を「かなしい」に固定
        if (this.status.friendship <= -11 && this.status.emotion !== 'ITEM') {
            this.status.emotion = 'sad';
        }
    }

    /**
     * 状態の切り替え判定（判断のみを行うフェーズ）
     * 各状態において「何が起きたら次の状態へ移るか」をチェック
     */
    _updateStateTransition() {
        const now = Date.now();
        // 目的地が設定されている場合のみ、目的地までの距離を計算。設定されていなければ大きな値を代入。
        const dist = this.pos.destinationSet ? Math.sqrt(Math.pow(this.pos.targetX - this.pos.x, 2) + Math.pow(this.pos.targetY - this.pos.y, 2)) : 999;
        // 目的地から10px以内に近づいたら「到着」とみなす
        const arrived = dist <= 10;

        // 【最優先】プレゼントイベントの発生チェック
        if (this._checkGiftEventInterruption(now)) return;

        switch (this.status.state) {
            // 待機中：一定時間経過、または特定イベント発生で移動（WALKING/GIFT）へ
            case STATE.IDLE: this._checkIdleState(now); break;

            // お散歩中：目的地に「到着」したら待機（IDLE）へ戻る
            case STATE.WALKING: this._checkWalkingState(arrived); break;

            // プレゼントへ出発：画面端の目的地に「到着」したら画面外探索（GIFT_SEARCHING）へ
            case STATE.GIFT_LEAVING: this._checkGiftLeavingState(arrived); break;

            // 画面外で探し中：一定時間（5秒）経過したら戻り移動（GIFT_RETURNING）へ
            case STATE.GIFT_SEARCHING: this._checkGiftSearchingState(now); break;

            // プレゼントを持って戻り中：指定位置に「到着」したらユーザーへの提示（WAIT_FOR_USER_REACTION）へ
            case STATE.GIFT_RETURNING: this._checkGiftReturningState(now, arrived); break;

            // ユーザーの反応待ち：一定時間（10秒）無視されたらタイムアウト（GIFT_TIMEOUT）へ
            case STATE.GIFT_WAIT_FOR_USER_REACTION: this._checkGiftWaitState(now); break;

            // プレゼントお礼リアクション：お礼の音声/アニメーション（actionDuration）が終わったら待機（IDLE）へ
            case STATE.GIFT_REACTION: this._checkGiftReactionState(now); break;

            // プレゼントタイムアウト：悲しいアニメーション（5秒）が終わったら待機（IDLE）へ
            case STATE.GIFT_TIMEOUT: this._checkGiftTimeoutState(now); break;

            // アイテムへ移動中：アイテムの近くに「到着」したらアイテムアクション（ITEM_ACTION）へ
            case STATE.ITEM_APPROACHING: this._checkItemApproachingState(arrived); break;

            // アイテムで遊び中：遊び時間（actionDuration）が終了したら待機（IDLE）へ
            case STATE.ITEM_ACTION: this._checkItemActionState(now); break;
        }
    }

    /** IDLE状態の遷移チェック */
    _checkIdleState(now) {
        // 低好感度時の隠れ処理
        if (this._tryHideWhenFriendshipLow()) return;

        // 通常の待機終了チェック
        if (now - this.timers.stateStart > this.timers.waitDuration) {
            this.status.state = STATE.WALKING;
            this._onStateChanged(this.status.state);
        }
    }

    /** 低好感度（とっても低い）時の隠れ場所移動試行 */
    _tryHideWhenFriendshipLow() {
        if (this.status.friendship > -31) return false;

        const hiddenX = 60;  // 隠れ家 (hideout.png) の中心付近
        const hiddenY = 80;
        const distToHidden = Math.sqrt((this.pos.x - hiddenX) ** 2 + (this.pos.y - hiddenY) ** 2);

        if (distToHidden <= 30) return false; // すでに隠れ家の中にいれば何もしない

        this.status.state = STATE.WALKING;
        this.pos.targetX = hiddenX;
        this.pos.targetY = hiddenY;
        this.pos.destinationSet = true;
        this._onStateChanged(this.status.state);
        return true;
    }

    /** プレゼントイベントの割り込みチェック */
    _checkGiftEventInterruption(now) {
        const nonInterruptibleStates = [
            STATE.GIFT_LEAVING, STATE.GIFT_SEARCHING, STATE.GIFT_RETURNING,
            STATE.GIFT_WAIT_FOR_USER_REACTION, STATE.GIFT_REACTION, STATE.GIFT_TIMEOUT,
            STATE.USER_INTERACTING
        ];

        if (nonInterruptibleStates.includes(this.status.state)) {
            return false;
        }

        return this._tryStartGiftEvent(now);
    }

    /** お土産イベント開始試行 */
    _tryStartGiftEvent(now) {
        const game = window.game;
        const timeSinceLastGift = now - game.lastGiftTime;
        const canStartGift = this.status.friendship >= 31 && timeSinceLastGift >= 30000 && !game.giftPartner;

        if (!canStartGift) return false;

        this.status.state = STATE.GIFT_LEAVING;
        game.giftPartner = this;
        this._onStateChanged(this.status.state);
        return true;
    }

    /** WALKING状態の遷移チェック */
    _checkWalkingState(arrived) {
        if (!arrived) return;
        this.status.state = STATE.IDLE;
        this._onStateChanged(this.status.state);
        this._handleArrival();
    }

    /** GIFT_LEAVING状態の遷移チェック */
    _checkGiftLeavingState(arrived) {
        if (!arrived) return;
        this.status.state = STATE.GIFT_SEARCHING;
        this._onStateChanged(this.status.state);
    }

    /** GIFT_SEARCHING状態の遷移チェック */
    _checkGiftSearchingState(now) {
        if (now - this.timers.stateStart <= 5000) return;
        this.status.state = STATE.GIFT_RETURNING;
        this._onStateChanged(this.status.state);
    }

    /** GIFT_RETURNING状態の遷移チェック */
    _checkGiftReturningState(now, arrived) {
        if (!arrived) return;
        this.status.state = STATE.GIFT_WAIT_FOR_USER_REACTION;
        window.game.startGiftReceiveEvent(this);
        this.timers.stateStart = now;
        this._onStateChanged(this.status.state);
    }

    /** GIFT_WAIT_FOR_USER_REACTION状態の遷移チェック */
    _checkGiftWaitState(now) {
        if (now - this.timers.stateStart <= 10000) return;
        this.status.state = STATE.GIFT_TIMEOUT;
        this.timers.stateStart = now;
        window.game.updateGiftUI('hide');
        this._onStateChanged(this.status.state);
    }

    /** GIFT_REACTION状態の遷移チェック */
    _checkGiftReactionState(now) {
        const reactionDur = this.timers.actionDuration || 3000;
        if (now - this.timers.stateStart <= reactionDur) return;
        window.game.completeGiftEvent();
        this._onStateChanged(STATE.IDLE);
    }

    /** GIFT_TIMEOUT状態の遷移チェック */
    _checkGiftTimeoutState(now) {
        const timeoutDur = this.timers.actionDuration || 5000;
        if (now - this.timers.stateStart <= timeoutDur) return;
        window.game.completeGiftEvent();
        this._onStateChanged(STATE.IDLE);
    }

    /** ITEM_APPROACHING状態の遷移チェック */
    _checkItemApproachingState(arrived) {
        if (!arrived) return;
        this.status.state = STATE.ITEM_ACTION;
        if (this.interaction.targetItem) {
            this._performItemAction(this.interaction.targetItem);
        }
        this._onStateChanged(this.status.state);
    }

    /** ITEM_ACTION状態の遷移チェック */
    _checkItemActionState(now) {
        const duration = this.timers.actionDuration || 3000;
        if (now - this.timers.actionStart <= duration) return;
        this.status.state = STATE.IDLE;
        this._onStateChanged(this.status.state);
    }

    /** 状態変更時のエフェクト発動（ASSETS方式） */
    _onStateChanged(newState) {
        // 1. 前の音声を停止
        this._stopCurrentVoice();

        // 2. 状態に関わらず、状態遷移した時刻を記録
        this.timers.stateStart = Date.now();

        // 3. 状態に応じた感情・アクションの自動割り当て
        this._applyStateAppearance(newState);

        // 3.5 低好感度時は表情を強制固定
        if (this.status.friendship <= -11 && this.status.emotion !== 'ITEM') {
            this.status.emotion = 'sad';
        }

        // 4. アセットの選択と適用
        this._applySelectedAsset(newState);

        // 5. モーションのリセット
        this.visual.motionTimer = 0;
    }

    /** 再生中の音声を停止 */
    _stopCurrentVoice() {
        if (this.visual.currentVoice) {
            this.visual.currentVoice.loop = false; // ループ解除
            this.visual.currentVoice.pause();
            this.visual.currentVoice.currentTime = 0; // 頭出し
            this.visual.currentVoice = null;
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
                this.status.action = 'idle';
                break;
            case STATE.WALKING:
            case STATE.ITEM_APPROACHING:
                this.status.action = 'walking';
                break;
            case STATE.GIFT_LEAVING:
            case STATE.GIFT_RETURNING:
                this.status.emotion = 'happy';
                this.status.action = 'walking';
                break;
            case STATE.GIFT_WAIT_FOR_USER_REACTION:
                this.status.emotion = 'happy';
                this.status.action = 'giftwait';
                break;
            case STATE.GIFT_REACTION:
                this.status.emotion = 'happy';
                this.status.action = 'giftreaction';
                break;
            case STATE.GIFT_TIMEOUT:
                this.status.emotion = 'sad';
                this.status.action = 'gifttimeout';
                break;
            case STATE.USER_INTERACTING:
                if (this.status.action === 'walking') {
                    this.status.action = 'idle';
                }
                break;
        }
    }

    /** 表情とアクションを即座に変更してアセットを反映させる (gameクラスから呼び出される) */
    setExpression(action, emotion) {
        if (action) this.status.action = action;
        if (emotion) this.status.emotion = emotion;
        this._applySelectedAsset(this.status.state);
    }

    /** 好感度ランクに基づいて基本感情を決定する (ヘルパー) */
    _updateBaseEmotion() {
        if (this.status.friendship <= -11) {
            this.status.emotion = 'sad';
        } else if (this.status.friendship <= 10) {
            this.status.emotion = 'normal';
        } else {
            this.status.emotion = 'happy';
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
            return p.length >= 4 && p[1] === type && p[2] === this.status.emotion && p[3] === this.status.action;
        });

        // 合致しなければ normal 感情で再検索
        if (candidates.length === 0) {
            candidates = Object.entries(ASSETS).filter(([key]) => {
                const p = key.split('_');
                return p[1] === type && p[2] === 'normal' && p[3] === this.status.action;
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
            this.visual.currentAsset = null;
            this.visual.motionType = 'none';
            return;
        }

        const [assetKey, assetData] = candidates[Math.floor(Math.random() * candidates.length)];
        this.visual.currentAssetKey = assetKey;
        this.visual.currentAsset = assetData;
        this.visual.motionType = assetData.movePattern || 'none';

        // 音声の再生とDuration設定
        this._playAssetSound(assetData, type);
    }

    /** アセットの音声を再生し、パフォーマンスなら時間を計測 */
    _playAssetSound(data, type) {
        const game = window.game;
        if (!data.soundfile || !game) return;

        this.visual.currentVoice = game.playSound(data.soundfile, data.pitch || 1.0);

        const voice = this.visual.currentVoice;
        if (type === 'performance' && voice) {
            const updateDur = () => {
                if (isNaN(voice.duration) || voice.duration <= 0) return;
                this.timers.actionDuration = voice.duration * 1000;
            };
            if (voice.readyState >= 1) updateDur();
            else voice.addEventListener('loadedmetadata', updateDur, { once: true });
        }
    }

    /** 現在の状態に応じた行動の実行 */
    _executeStateAction(dt) {
        const movementStates = [STATE.WALKING, STATE.GIFT_LEAVING, STATE.GIFT_RETURNING, STATE.ITEM_APPROACHING];
        const staticStates = [STATE.IDLE, STATE.GIFT_SEARCHING, STATE.GIFT_WAIT_FOR_USER_REACTION, STATE.USER_INTERACTING, STATE.ITEM_ACTION];

        if (movementStates.includes(this.status.state)) {
            // 目的地が決まっていなければ初期化
            if (!this.pos.destinationSet) {
                this._decideNextDestination();
            }
            // 移動を実行
            this._processMovement();
        }
        else if (staticStates.includes(this.status.state)) {
            // 到着直後（目的地設定が残っている）ならクリーンアップ
            if (this.pos.destinationSet) {
                this._handleArrival();
            }
        }
    }

    /** DOMの表示更新（画像、位置、アニメーションなど） */
    syncSpeakiDOM() {
        const dom = this.visual.dom;

        // 1. 画像切り替え (ASSETSから選択された画像を使用)
        if (this.visual.currentAsset && this.visual.currentAsset.imagefile) {
            const game = window.game;
            const img = game.images[this.visual.currentAsset.imagefile];
            if (img && dom.sprite.src !== img.src) {
                dom.sprite.src = img.src;
            }
        }

        // 2. 位置とサイズ
        dom.container.style.width = `${this.status.size}px`;
        dom.container.style.height = `${this.status.size}px`;

        const bob = Math.sin(Date.now() / 200 + this.id * 100) * 5; // IDで位相をずらす
        dom.container.style.left = `${this.pos.x - this.status.size / 2}px`;
        dom.container.style.top = `${this.pos.y - this.status.size / 2 + bob}px`;

        const flip = this.pos.facingLeft ? 1 : -1;
        const transform = `perspective(800px) rotateX(${this.visual.distortion.rotateX}deg) skewX(${this.visual.distortion.skewX}deg) scale(${this.visual.distortion.scale}) scaleX(${flip})`;
        dom.sprite.style.transform = transform;

        let isShowingGift = [STATE.GIFT_RETURNING, STATE.GIFT_WAIT_FOR_USER_REACTION, STATE.GIFT_REACTION].includes(this.status.state);

        if (isShowingGift) {
            dom.gift.classList.remove('hidden');
            // スピキ本体よりも手前に表示するため translateZ(100px) を追加
            dom.gift.style.transform = `translateX(-50%) translateZ(100px) scale(${1.0 / this.visual.distortion.scale}) scaleX(${flip})`;
        } else {
            dom.gift.classList.add('hidden');
        }

        dom.emoji.textContent = ''; // 絵文字は非表示にするため空に

        // 4. セリフ（text）の表示
        dom.debugText.textContent = (this.visual.currentAsset && this.visual.currentAsset.text) || '';
    }

    /** ドラッグ時・モーションアニメーションの更新 */
    _updateDistortion(dt) {
        this.visual.motionTimer += dt || 16;

        // インタラクト中（なでなで確定時）はマウス移動に伴う動的な歪みを適用
        if (this.interaction.isPetting) {
            this.visual.distortion.skewX += (this.visual.targetDistortion.skewX - this.visual.distortion.skewX) * 0.15;
            this.visual.distortion.rotateX += (this.visual.targetDistortion.rotateX - this.visual.distortion.rotateX) * 0.15;
            this.visual.distortion.scale += (this.visual.targetDistortion.scale - this.visual.distortion.scale) * 0.15;
            return;
        }

        // ASSETS定義に基づくモーション適用
        switch (this.visual.motionType) {
            case 'shake':
                this.visual.distortion.skewX = Math.sin(this.visual.motionTimer * 0.05) * 10;
                this.visual.distortion.rotateX *= 0.85;
                this.visual.distortion.scale = 1.0;
                break;
            case 'stretch':
                const stretch = Math.sin(this.visual.motionTimer * 0.01) * 0.1;
                this.visual.distortion.scale = 1.0 + stretch;
                this.visual.distortion.rotateX = stretch * -50;
                this.visual.distortion.skewX *= 0.85;
                break;
            case 'bounce':
                const bounce = Math.abs(Math.sin(this.visual.motionTimer * 0.01)) * 0.1;
                this.visual.distortion.scale = 1.0 + bounce;
                this.visual.distortion.skewX *= 0.85;
                this.visual.distortion.rotateX *= 0.85;
                break;
            case 'swing':
                const swingPhase = Math.sin(this.visual.motionTimer * 0.005);
                this.visual.distortion.skewX = swingPhase * 15; // 左右への傾き
                this.visual.distortion.scale = 1.0 + Math.abs(swingPhase) * 0.25; // 伸び
                this.visual.distortion.rotateX = Math.abs(swingPhase) * -10; // 伸びる時の前傾
                break;
            default:
                this.visual.distortion.skewX *= 0.85;
                this.visual.distortion.rotateX *= 0.85;
                this.visual.distortion.scale += (1.0 - this.visual.distortion.scale) * 0.15;
                break;
        }
    }

    /** アイテムへの接近を開始する (Gameクラスから呼び出される) */
    approachItem(item, offset = 100) {
        if (!item) return;

        this.status.state = STATE.ITEM_APPROACHING;
        this.interaction.targetItem = item;

        // アイテムから自分の方へ offset 離れた位置を目的地にする
        const dx = this.pos.x - item.x;
        const dy = this.pos.y - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.pos.targetX = item.x + (dx / dist) * offset;
            this.pos.targetY = item.y + (dy / dist) * offset;
        } else {
            // 完全に重なっている場合は右にずらす
            this.pos.targetX = item.x + offset;
            this.pos.targetY = item.y;
        }

        this.pos.destinationSet = true;
        this._onStateChanged(this.status.state);
    }

    /** 目的地を決定（移動開始時の1回だけ実行） */
    _decideNextDestination() {
        const canvasWidth = this.parentElement.clientWidth || window.innerWidth;
        const canvasHeight = this.parentElement.clientHeight || window.innerHeight;

        this.status.action = 'walking';
        this.pos.destinationSet = true;

        if (this.status.state === STATE.GIFT_LEAVING) {
            this.pos.targetX = -100;
            this.pos.targetY = canvasHeight / 2;
            return;
        }

        if (this.status.state === STATE.GIFT_RETURNING) {
            this.pos.targetX = canvasWidth * 0.4 + (Math.random() * 100 - 50);
            this.pos.targetY = canvasHeight * 0.5 + (Math.random() * 100 - 50);
            this._onStateChanged(this.status.state);
            return;
        }

        if (this.status.state === STATE.ITEM_APPROACHING && this.status.targetItem) {
            this.pos.targetX = this.status.targetItem.x;
            this.pos.targetY = this.status.targetItem.y;
            return;
        }

        // WALKINGまたはデフォルト（通常の散歩）
        this._decideWanderingDestination(canvasWidth, canvasHeight);
    }

    /** 通常の散歩中の目的地決定 */
    _decideWanderingDestination(w, h) {
        // 低好感度時は隠れ家付近限定
        if (this.status.friendship <= -31) {
            this.interaction.targetItem = null;
            this.pos.targetX = 50 + (Math.random() * 40 - 20);
            this.pos.targetY = 100 + (Math.random() * 40 - 20);
            this.pos.destinationSet = true;
            this._onStateChanged(this.status.state);
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
        this.interaction.targetItem = null;
        this.pos.targetX = Math.random() * (w - 100) + 50;
        this.pos.targetY = Math.random() * (h - 100) + 50;
        this._onStateChanged(this.status.state);
    }

    /** 移動処理 */
    _processMovement() {
        // 目的地が設定されていなければ何もしない
        if (!this.pos.destinationSet) return;

        const dx = this.pos.targetX - this.pos.x;
        const dy = this.pos.targetY - this.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 目的地に十分近い（5px以内）場合は、到着処理を実行して終了
        if (dist <= 5) {
            this._handleArrival();
            return;
        }

        // 移動継続：角度を計算して座標を更新
        const angle = Math.atan2(dy, dx);

        // 逃走中（好感度が低く、隠れ家に向かっている）なら速度を2倍にする
        let currentSpeed = this.pos.speed;
        const isHeadingToHidden = this.status.friendship <= -31 && Math.sqrt(Math.pow(this.pos.targetX - 50, 2) + Math.pow(this.pos.targetY - 100, 2)) < 30;
        if (isHeadingToHidden) {
            currentSpeed *= 2.0;
        }

        this.pos.x += Math.cos(angle) * currentSpeed;
        this.pos.y += Math.sin(angle) * currentSpeed;
        this.pos.angle = angle;

        // 進んでいる方向（左右）を更新
        if (Math.abs(dx) > 1) {
            this.pos.facingLeft = dx < 0;
        }
    }

    /** 目的地到着時の物理的なクリーンアップ */
    _handleArrival() {
        this.timers.stateStart = Date.now();
        this.pos.destinationSet = false;

        // 待機時間をある程度ランダムに決定 (2秒 ~ 8秒)
        this.timers.waitDuration = 2000 + Math.random() * 6000;

        // 到着時の物理的なクリーンアップのみ行う
        if (this.status.state !== STATE.WALKING) return;
        this.status.action = 'idle';
    }

    /** アイテムに到着した際の固有アクション */
    _performItemAction(item) {
        this.status.emotion = 'ITEM';
        this.status.action = item.id;

        // 時間を記録
        this.timers.actionStart = Date.now();
        this.timers.stateStart = this.timers.actionStart;
        this.interaction.targetItem = null;

        // 音声と画像アセットの切り替えは、この後の _onStateChanged(STATE.ITEM_ACTION) が行う
    }

    /** インタラクション終了時の処理（3秒間喜んでから元の行動に戻る） */
    _processFinishInteraction() {
        this.status.action = 'happy';

        // 3秒間その場で喜ぶモーションを維持する
        setTimeout(() => {
            // 待機中に別のドラッグやイベントが発生して状態が変わっていたら何もしない
            if (this.status.state !== STATE.USER_INTERACTING) return;

            this.status.action = 'idle';

            // 好感度が非常に低い場合、インタラクション終了後にすぐに隠れるように（IDLEへ）
            if (this.status.friendship <= -31) {
                this.status.state = STATE.IDLE;
                this._onStateChanged(this.status.state);
                return;
            }

            // 中断されていた行動があればそこに戻り、なければ待機へ
            this.status.state = (this.status.stateStack && this.status.stateStack.length > 0) ? this.status.stateStack.pop() : STATE.IDLE;
            this._onStateChanged(this.status.state);
        }, 3000);
    }

    /** 好感度のラベル取得 (5段階) (Gameクラスから呼び出される) */
    getFriendshipLabel() {
        if (this.status.friendship >= 31) return '私のことが大好きなようだ';
        if (this.status.friendship >= 11) return '私を信頼しているようだ';
        if (this.status.friendship >= -10) return 'ふつう';
        if (this.status.friendship >= -30) return '私を怖がっているようだ';
        return '怯えきっている (そのうち隠れ家から出てくるだろう)';
    }

    /** 好感度のCSSクラス取得 (Gameクラスから呼び出される) */
    getFriendshipClass() {
        if (this.status.friendship >= 31) return 'friendship-v-high';
        if (this.status.friendship >= 11) return 'friendship-high';
        if (this.status.friendship >= -10) return 'friendship-normal';
        if (this.status.friendship >= -30) return 'friendship-low';
        return 'friendship-v-low';
    }

    /** UI表示用のステータス名取得 (Gameクラスから呼び出される) */
    getStateLabel() {
        if (this.status.friendship <= -31 && [STATE.IDLE, STATE.WALKING].includes(this.status.state)) {
            return 'かくれてる';
        }

        switch (this.status.state) {
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
