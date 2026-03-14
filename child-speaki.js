import { STATE, ASSETS, ITEMS } from './config.js';
import { BaseCharacter } from './base-character.js';

/**
 * 子供のスピキクラス
 * BaseCharacterを継承し、小さく高い声、および自律的なアイテム配置ロジックを持つ
 */
export class ChildSpeaki extends BaseCharacter {
    constructor(game, id, parentElement, x, y, options = {}) {
        options.characterType = 'child';
        options.size = options.size || 80;             // 通常の半分程度のサイズ
        options.voicePitch = options.voicePitch || 1.6; // 高い声
        options.speed = options.speed || (1.0 + Math.random() * 2.0);
        super(game, id, parentElement, x, y, options);
        this.growthTime = 0; // NEW: 累積時間方式に変更
    }

    /** フレーム更新: 成長タイマーを進める */
    update(dt) {
        // IDLE状態またはWALKING状態で一定の条件下で成長（赤ちゃんよりは成長しにくい設定も可能だが一旦単純加算）
        // 成長停止設定がONの場合はカウントを進めない
        const isGrowthStopped = this.game && this.game.settings && this.game.settings.growthStopEnabled;
        if (!isGrowthStopped) {
            this.growthTime += dt;
        }
        super.update(dt);
    }

    /** 状態遷移の拡張: 自律的な行動を追加 */
    _updateStateTransition() {
        if (this.status.state === STATE.DYING) return; // 死亡中は遷移しない
        // 0. 進化チェック (累積時間が60秒経過 && 満腹度75以上)
        if (this.growthTime > 60000 && this.status.hunger >= 75) {
            if (this.game && this.game.evolveChildToAdult) {
                this.game.evolveChildToAdult(this);
                return; // 進化したら以降の処理は不要
            }
        }

        super._updateStateTransition();

        // 親クラス（BaseCharacter）にはない、Speaki同様の隠れ家ロジックを追加
        if (this.status.state === STATE.IDLE) {
            this._tryHideWhenFriendshipLow();
        }

        // 2. IDLE状態で一定時間経過後、低確率でアイテムを配置する（遊び）
        const now = Date.now();
        if (this.status.state === STATE.IDLE && now - this.timers.stateStart > 10000) {
            if (Math.random() < 0.005) { // 約 0.5% の確率
                this._placeRandomCandy();
            }
        }
    }

    /** 自律的な交流リクエストの更新 */
    _updateSocialRequest(dt) {
        super._updateSocialRequest(dt);

        if (!this.canInteract || this.status.state === STATE.DYING) return;
        if (this.status.state !== STATE.IDLE) return;
        if (this.interaction.isInteracting) return;

        const now = Date.now();
        if (!this.timers.lastChildSocialAttempt) this.timers.lastChildSocialAttempt = 0;
        if (now - this.timers.lastChildSocialAttempt < 15000) return;
        this.timers.lastChildSocialAttempt = now;

        // 子どもの泣き声イベント (空腹時に確率で発生)
        if (this.status.hunger < 30) {
            if (Math.random() < 0.1) { // 10%の確率で泣く
                if (this.game && this.game.social) {
                    this.game.social.requestSocialAction(this, null, 'CRYING');
                    this.status.emotion = 'sad';
                    this.status.action = 'crying';
                    this.showEmoji('😭', 5000);
                }
            }
        }
    }

    /** 目的地決定（散歩）の拡張: 低好感度時の隠れ家優先 */
    _decideWanderingDestination(w, h) {
        if (this.status.friendship <= -31) {
            this.interaction.targetItem = null;
            this.pos.targetX = 50 + (Math.random() * 40 - 20);
            this.pos.targetY = 100 + (Math.random() * 40 - 20);
            this.pos.destinationSet = true;
            return;
        }
        super._decideWanderingDestination(w, h);
    }

    /** 低好感度時の隠れ家移動 (Speakiと同等) */
    _tryHideWhenFriendshipLow() {
        if (this.status.friendship > -31) return false;

        const hiddenX = 60;
        const hiddenY = 80;
        const distToHidden = Math.sqrt((this.pos.x - hiddenX) ** 2 + (this.pos.y - hiddenY) ** 2);

        if (distToHidden <= 30) return false;

        this.status.state = STATE.WALKING;
        this._onStateChanged(this.status.state);
        this.pos.targetX = hiddenX;
        this.pos.targetY = hiddenY;
        this.pos.destinationSet = true;
        // this.pos.speed = 8.0; // BaseCharacter側で好感度を見て速度制御するため削除
        return true;
    }

    /** キャンディを自律的に配置する */
    _placeRandomCandy() {
        if (!this.game) return;

        // 自分の足元にキャンディを置く
        this.game.addItem('Candy', 'item', this.pos.x, this.pos.y);

        // 置いた後は少し離れる
        this.status.state = STATE.WALKING;
        this._onStateChanged(this.status.state);
        this.status.emotion = 'happy';
        // this._onStateChanged()内でアセットが適用されるため、ここでは再呼び出しを避ける
    }

    /** リスト表示用のラベル */
    getStateLabel() {
        return "こども";
    }
}

