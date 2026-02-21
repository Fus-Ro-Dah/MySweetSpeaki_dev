import { STATE, ITEMS } from './config.js';
import { NPCCharacter } from './npc-character.js';

/**
 * Ashurクラス
 * 満腹度が低い(30以下)スピキを見つけ、近くに移動してモカロンを配置するNPC
 */
export class Ashur extends NPCCharacter {
    constructor(id, parentElement, x, y, options = {}) {
        options.characterType = options.characterType || 'ashur';
        options.speed = options.speed || 1.5;
        super(id, parentElement, x, y, options);

        this.baseSpeed = this.pos.speed;
        this.dashSpeed = this.baseSpeed * 2.0;
        this.targetSpeaki = null;
    }

    /** 目的地決定ロジック (空腹スピキ探索) */
    _decideWanderingDestination(w, h) {
        const game = window.game;
        if (!game) return super._decideWanderingDestination(w, h);

        // 満腹度が30以下の他のスピキを探す
        const hungrySpeaki = game.speakis.find(s =>
            s !== this &&
            s.hasHunger &&
            s.status.hunger <= 30
        );

        if (hungrySpeaki) {
            this.targetSpeaki = hungrySpeaki;
            this.pos.targetX = hungrySpeaki.pos.x;
            this.pos.targetY = hungrySpeaki.pos.y;
            this.pos.speed = this.dashSpeed; // 急行モード
            this.pos.destinationSet = true;
        } else {
            this.targetSpeaki = null;
            this.pos.speed = this.baseSpeed;
            super._decideWanderingDestination(w, h);
        }
    }

    /** 到着時の処理 */
    _handleArrival() {
        // もしターゲット(空腹スピキ)の近くに到着していたらアイテムを置く
        if (this.targetSpeaki) {
            const dist = Math.sqrt(
                (this.pos.x - this.targetSpeaki.pos.x) ** 2 +
                (this.pos.y - this.targetSpeaki.pos.y) ** 2
            );

            if (dist <= 150) {
                this.executeAbility('place_item', {
                    itemType: 'Mocaron',
                    duration: 1500
                });
            }
        }

        this.targetSpeaki = null;
        this.pos.speed = this.baseSpeed;
        super._handleArrival();
    }

    /** 能力の効果実行 */
    _onAbilityEffect(abilityId, options) {
        if (abilityId === 'place_item') {
            const game = window.game;
            if (game) {
                // 足元にモカロンを配置
                game.addItem(options.itemType || 'Mocaron', 'item', this.pos.x, this.pos.y + 20);
            }
        }
    }

    /** UI表示用ラベル */
    getStateLabel() {
        if (this.targetSpeaki) return "Ashur(救助中)";
        return super.getStateLabel().replace("NPC", "Ashur");
    }
}
