import { STATE, ASSETS, ITEMS } from './config.js';
import { BaseCharacter } from './base-character.js';

/**
 * 子供のスピキクラス
 * BaseCharacterを継承し、小さく高い声、および自律的なアイテム配置ロジックを持つ
 */
export class BabySpeaki extends BaseCharacter {
    constructor(id, parentElement, x, y, options = {}) {
        options.characterType = 'baby';
        options.size = options.size || 80;             // 通常の半分程度のサイズ
        options.voicePitch = options.voicePitch || 1.6; // 高い声
        options.speed = options.speed || (1.0 + Math.random() * 2.0);
        super(id, parentElement, x, y, options);
    }

    /** 状態遷移の拡張: 自律的な行動を追加 */
    _updateStateTransition() {
        super._updateStateTransition();

        const now = Date.now();
        // IDLE状態で一定時間経過後、低確率でアイテムを配置する（遊び）
        if (this.status.state === STATE.IDLE && now - this.timers.stateStart > 10000) {
            if (Math.random() < 0.005) { // 約 0.5% の確率
                this._placeRandomCandy();
            }
        }
    }

    /** キャンディを自律的に配置する */
    _placeRandomCandy() {
        if (!window.game) return;

        // 自分の足元にキャンディを置く
        window.game.addItem('Candy', 'item', this.pos.x, this.pos.y);

        // 置いた後は少し離れる
        this.status.state = STATE.WALKING;
        this._onStateChanged(this.status.state);
        this.status.emotion = 'happy';
        this._applySelectedAsset(this.status.state);
    }

    /** リスト表示用のラベル */
    getStateLabel() {
        switch (this.status.state) {
            case STATE.IDLE: return "こども(のんびり)";
            case STATE.WALKING: return "こども(てくてく)";
            case STATE.ITEM_APPROACHING: return "なにかある！";
            case STATE.ITEM_ACTION: return "あそんでる！";
            default: return "こどもスピキ";
        }
    }
}
