import { STATE, ASSETS } from './config.js';
import { BaseCharacter } from './base-character.js';

/**
 * 赤ちゃんスピキクラス
 * 動かず、常に喋り続ける。
 */
export class BabySpeaki extends BaseCharacter {
    constructor(id, parentElement, x, y, options = {}) {
        options.characterType = 'baby';
        options.size = options.size || 60;             // さらに小さい
        options.voicePitch = options.voicePitch || 2.0; // 極めて高い声
        options.speed = 0;                             // 動かない
        super(id, parentElement, x, y, options);
        this.idleGrowthTime = 0; // 実時間ではなくIDLE状態の累積時間で成長させる
    }

    /** フレーム更新: IDLE時のみ成長タイマーを進める */
    update(dt) {
        // IDLE状態、かつユーザーと直接触れ合っていない（なでられていない）間だけ成長
        if (this.status.state === STATE.IDLE && !this.interaction.isInteracting) {
            this.idleGrowthTime += dt;
        }
        super.update(dt);
    }

    /** 状態遷移の制限と自動進化、喋りループ */
    _updateStateTransition() {
        const now = Date.now();

        // 1. 進化チェック (累積IDLE時間が60秒経過で子供へ)
        if (this.idleGrowthTime > 60000) {
            if (window.game && window.game.evolveBabyToChild) {
                window.game.evolveBabyToChild(this);
                return;
            }
        }


        // 2. 常に何もしないIDLE状態を維持（USER_INTERACTING, 交流中以外）
        const allowedStates = [STATE.USER_INTERACTING, STATE.GAME_APPROACHING, STATE.GAME_REACTION];
        if (!allowedStates.includes(this.status.state)) {
            this.status.state = STATE.IDLE;
        }


        super._updateStateTransition();

        // 3. 喋りループ: 音声が再生されていないIDLE時、常に次のアセットを再生
        if (this.status.state === STATE.IDLE && !this.visual.currentVoice) {
            // アセット適用を強制（_onStateChangedを呼ぶことでASSETSからランダム選択される）
            this._onStateChanged(STATE.IDLE);
        }
    }

    /** 移動を封印 */
    _decideWanderingDestination(w, h) {
        this.pos.destinationSet = false;
    }

    /** 目的地決定を封印 */
    _decideNextDestination() {
        this.pos.destinationSet = false;
    }

    /** アイテムへの接近を封印 */
    approachItem(item, distance) {
        // 赤ちゃんはアイテムに反応しない
        return;
    }

    /** リスト表示用のラベル */
    getStateLabel() {
        switch (this.status.state) {
            case STATE.IDLE: return "赤ちゃん(ばぶばぶ)";
            case STATE.USER_INTERACTING: return "赤ちゃん(ふれあい中)";
            default: return "赤ちゃんスピキ";
        }
    }
}
