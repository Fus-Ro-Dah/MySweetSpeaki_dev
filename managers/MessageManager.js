import { MESSAGES } from '../config/messages.js';
import { STATE } from '../config.js';

/**
 * 観察メッセージの生成と管理を行うクラス
 */
export class MessageManager {
    constructor(game) {
        this.game = game;
        this.lastLogTimes = new Map(); // キャラクターごとの最終ログ時刻
        this.throttleInterval = 10000;  // 同一キャラクターの連投制限（ミリ秒）
        this.globalLastLogTime = 0;    // 全体での最終ログ時刻
        this.globalMinInterval = 1500; // 全体での最低間隔（ミリ秒）
    }

    /**
     * キャラクターの状態変化に基づいたログを生成
     * @param {BaseCharacter} char 対象のキャラクター
     */
    logStateChange(char) {
        // 全体のログ頻度を制限（5秒間隔に固定）
        if (Date.now() - this.globalLastLogTime < 5000) return;
        if (!this._canLog(char)) return;

        const isBaby = char.characterType === 'baby';
        const typeKey = isBaby ? 'baby' : 'speaki';
        const state = char.status.state;
        const emotion = char.status.emotion || 'normal';

        let templates = null;

        if (state === STATE.IDLE || state === STATE.WALKING) {
            const stateKey = state.toUpperCase(); // IDLE or WALKING
            const category = MESSAGES[typeKey][stateKey];

            // 優先順位ロジック
            // ①空腹値が30以下かどうか判定
            if (char.status.hunger <= 30 && category.hunger?.low) {
                templates = category.hunger.low;
            }
            // ②好感度が-20以下かどうか判定
            else if (char.status.friendship <= -20 && category.friendship?.low) {
                templates = category.friendship.low;
            }
            // ③④ 感情による表示
            else {
                const pool = [];
                if (emotion === 'sad') {
                    pool.push(...(category.default?.sad || []));
                } else if (emotion === 'normal') {
                    pool.push(...(category.default?.normal || []));
                } else {
                    // happy時
                    pool.push(...(category.default?.happy || []));
                    // 候補追加条件
                    if (char.status.friendship >= 20 && category.friendship?.high) {
                        pool.push(...category.friendship.high);
                    }
                    if (char.status.hunger >= 70 && category.hunger?.high) {
                        pool.push(...category.hunger.high);
                    }
                }
                templates = pool;
            }
        }
        else if (state === STATE.GIFT_LEAVING) {
            templates = MESSAGES[typeKey].GIFT_LEAVING;
        }
        else if (state === STATE.GIFT_RETURNING) {
            templates = MESSAGES[typeKey].GIFT_RETURNING;
        }

        if (templates && templates.length > 0) {
            this._send(char, this._getRandom(templates));
        }
    }

    /**
     * ユーザーとのインタラクションログ（撫でる・叩く）
     */
    logUserInteraction(char, type) {
        // 全体のログ頻度を制限
        if (Date.now() - this.globalLastLogTime < 5000) return;

        // type: 'isPetting' or 'isHit'
        const isBaby = char.characterType === 'baby';
        const typeKey = isBaby ? 'baby' : 'speaki';
        const templates = MESSAGES[typeKey].USER_INTERACTING?.[type];

        if (templates && templates.length > 0) {
            this._send(char, this._getRandom(templates));
        }
    }

    /**
     * アイテムへの反応ログ
     */
    logItemReaction(char, item) {
        if (!this._canLog(char)) return;

        const typeKey = char.characterType === 'baby' ? 'baby' : 'speaki';
        const itemType = item.type || item.id;

        // ユーザー指定のキー名に合わせる
        const templates = MESSAGES[typeKey].ITEM_ACTION?.[itemType];

        if (templates && templates.length > 0) {
            this._send(char, this._getRandom(templates));
        }
    }

    /**
     * キャラクター同士の交流ログ
     */
    logSocialInteraction(initiator, target, actionId) {

        const typeKey = initiator.characterType === 'baby' ? 'baby' : 'speaki';
        const socialData = MESSAGES[typeKey].GAME_REACTION?.[actionId];

        if (!socialData) return;

        let templates;
        if (Array.isArray(socialData)) {
            templates = socialData;
        } else {
            // initiator/target別
            // プログラムの実態に合わせる（始めた方がinitiator）
            templates = socialData.initiator;
        }

        if (templates && templates.length > 0) {
            // targetの名前も使えるようにする
            this._send(initiator, this._getRandom(templates), target);
        }

        // target側の反応も出す場合（必要に応じて）
        const targetTypeKey = target.characterType === 'baby' ? 'baby' : 'speaki';
        const targetSocialData = MESSAGES[targetTypeKey].GAME_REACTION?.[actionId];
        if (targetSocialData && targetSocialData.target) {
            // 社会的交流の連鎖は5秒制限に含めない（セットで表示するため、_sendはガードを通るはず）
            // ただし、_send側にガードがあるとここも止まるので注意。
            // ユーザーは「新規の出力」を5秒制限したいはず。
            setTimeout(() => {
                // target側の返答には連鎖フラグを立てず、通常の _send (5秒制限) を通す
                this._send(target, this._getRandom(targetSocialData.target), initiator);
            }, 1000);
        }
    }

    /**
     * メッセージ送信の実体
     * @param {BaseCharacter} char 
     * @param {string} template 
     * @param {BaseCharacter} target 
     */
    _send(char, template, target = null) {
        // 選択されているスピキのみメッセージを表示する (id=0を考慮)
        if (this.game.highlightedCharId === null || char.id !== this.game.highlightedCharId) {
            return;
        }

        // グローバル制限の最終チェック (5秒間隔)
        if (Date.now() - this.globalLastLogTime < 5000) {
            return;
        }

        let text = template.replace(/{name}/g, char.name);
        if (target) {
            text = text.replace(/{targetName}/g, target.name);
        }

        this.game.ui.addConsoleMessage(text);

        const now = Date.now();
        this.lastLogTimes.set(char.id, now);
        this.globalLastLogTime = now;
    }

    _canLog(char) {
        const lastTime = this.lastLogTimes.get(char.id) || 0;
        return (Date.now() - lastTime > this.throttleInterval);
    }

    _getRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}
