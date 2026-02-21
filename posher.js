import { Ashur } from './ashur.js';

/**
 * Posherクラス
 * Ashurのバリアントで、配置するアイテムが「Poteto」であるNPC
 */
export class Posher extends Ashur {
    constructor(id, parentElement, x, y, options = {}) {
        options.characterType = options.characterType || 'posher';
        options.size = options.size || 300; // NPCを少し大きく
        super(id, parentElement, x, y, options);
    }

    /** 目的地決定ロジック (空腹スピキ探索) - 名称表示のためオーバーライド */
    _decideWanderingDestination(w, h) {
        super._decideWanderingDestination(w, h);
    }

    /** 到着時の処理 - 置くアイテムをPotetoに変更 */
    _handleArrival() {
        if (this.targetSpeaki) {
            const dist = Math.sqrt(
                (this.pos.x - this.targetSpeaki.pos.x) ** 2 +
                (this.pos.y - this.targetSpeaki.pos.y) ** 2
            );

            if (dist <= 150) {
                this.executeAbility('place_item', {
                    itemType: 'Poteto',
                    duration: 1500
                });
            }
        }

        this.targetSpeaki = null;
        this.pos.speed = this.baseSpeed;
        // NPCCharacter._handleArrival を呼ぶ (Ashur._handleArrival は Mocaron 固定なので飛ばす)
        // ただし Ashur を継承しているため、super.super は呼べない。
        // Ashur._handleArrival の中身を Poteto に変えて再実装する。
        const proto = Object.getPrototypeOf(Object.getPrototypeOf(this));
        proto._handleArrival.call(this);
    }

    /** 能力の効果実行 - Potetoを配置 */
    _onAbilityEffect(abilityId, options) {
        if (abilityId === 'place_item') {
            const game = window.game;
            if (game) {
                // 足元にPotetoを配置
                game.addItem(options.itemType || 'Poteto', 'item', this.pos.x, this.pos.y + 20);
            }
        }
    }

    /** UI表示用ラベル */
    getStateLabel() {
        if (this.targetSpeaki) return "Posher(救助中)";
        return super.getStateLabel().replace("Ashur", "Posher");
    }
}
