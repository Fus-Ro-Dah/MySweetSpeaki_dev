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
        // インタラクションは5秒制限を設ける（連打防止）
        if (!this._canLog(char)) return;

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
        // アイテム反応はハイライトチェックのみ（5秒制限はバイパス）
        if (this.game.highlightedCharId !== char.id) return;

        const typeKey = char.characterType === 'baby' ? 'baby' : 'speaki';
        const itemType = item.id || item.type;

        // ユーザー指定のキー名に合わせる
        const templates = MESSAGES[typeKey].ITEM_ACTION?.[itemType];

        if (templates && templates.length > 0) {
            this._send(char, this._getRandom(templates), null, true); // タイマー更新あり
        }
    }

    /**
     * キャラクター同士の交流ログ
     */
    logSocialInteraction(initiator, target, actionId) {
        // 交流はハイライトされているスピキがいれば表示（5秒制限はバイパス）
        const isInitiatorHighlighted = this.game.highlightedCharId === initiator.id;
        const isTargetHighlighted = this.game.highlightedCharId === target.id;
        if (!isInitiatorHighlighted && !isTargetHighlighted) return;

        const typeKey = initiator.characterType === 'baby' ? 'baby' : 'speaki';
        const socialData = MESSAGES[typeKey].GAME_REACTION?.[actionId];

        if (!socialData) return;

        // 1. initiator(誘った側)のメッセージ
        if (isInitiatorHighlighted) {
            let templates;
            if (Array.isArray(socialData)) {
                templates = socialData;
            } else {
                templates = socialData.initiator;
            }

            if (templates && templates.length > 0) {
                this._send(initiator, this._getRandom(templates), target, true); // タイマー更新あり
            }
        }

        // 2. target(誘われた側)の反応
        const targetTypeKey = target.characterType === 'baby' ? 'baby' : 'speaki';
        const targetSocialData = MESSAGES[targetTypeKey].GAME_REACTION?.[actionId];
        
        if (isTargetHighlighted && targetSocialData && targetSocialData.target) {
            setTimeout(() => {
                this._send(target, this._getRandom(targetSocialData.target), initiator, true); // タイマー更新あり
            }, 1000);
        }
    }

    /**
     * ログ出力が可能かチェック (5秒制限用)
     * @param {BaseCharacter} char 対象のキャラクター
     * @returns {boolean} ログ出力が可能であればtrue
     */
    _canLog(char) {
        const now = Date.now();
        // 全体での5秒制限
        if (now - this.globalLastLogTime < 5000) return false;

        // ハイライトされているスピキのみ対象
        if (this.game.highlightedCharId === null || char.id !== this.game.highlightedCharId) {
            return false;
        }

        return true;
    }

    /**
     * メッセージ送信の実体
     * @param {BaseCharacter} char 対象のキャラクター
     * @param {string} template メッセージテンプレート
     * @param {BaseCharacter} target ターゲットキャラクター (オプション)
     * @param {boolean} updateGlobalTimer 全体ログ時刻を更新するかどうか (デフォルト: true)
     */
    _send(char, template, target = null, updateGlobalTimer = true) {
        if (!this.game.ui) return;

        let text = template.replace(/{name}/g, char.name);
        if (target) {
            text = text.replace(/{targetName}/g, target.name);
        }

        // メッセージを表示
        this.game.ui.addConsoleMessage(text);

        // タイムスタンプ更新
        if (updateGlobalTimer) {
            this.globalLastLogTime = Date.now();
        }
    }

    _getRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}
