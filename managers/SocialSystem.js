import { STATE } from '../config.js';

/**
 * 交流（ソーシャル）管理クラス
 * スピキ同士のおしゃべり、ターゲット指定型交流の調整を担当する
 * ハイブリッド型: キャラクターからのリクエストを受け付けつつ、頻度・衝突を中央管理する
 */
export class SocialSystem {
    constructor(game) {
        this.game = game;
        this.lastSocialTime = 0;      // 最後に交流が「開始」した時間
        this.lastSocialDebugTime = 0;  // デバッグログ用
    }

    _getSocialActionTemplates() {
        const game = this.game;
        return [
            {
                id: 'GIVE_CANDY',
                priority: 10,
                canTrigger: (a, b) => (b.status.hunger < 40 && a.status.hunger > 60),
                execute: (initiator, target) => this.triggerDirectedSocialAction(initiator, target, {
                    footImage: 'assets/images/item_キャンディ.png',
                    initiatorAction: 'idle',
                    receiverAction: 'happy',
                    sequence: [
                        { origin: 'happy', target: 'normal' },
                        { origin: 'happy', target: 'happy' }
                    ],
                    onComplete: (r) => { r.status.hunger = Math.min(100, r.status.hunger + 30); }
                })
            },
            {
                id: 'CRYING',
                priority: 20,
                movementType: 'TARGET_TO_INITIATOR', // 大人が赤ちゃんに歩み寄る
                canTrigger: (a, b) => {
                    const isCrying = a.status.action === 'crying';
                    const isSpeaki = b.characterType === 'speaki';
                    const isHealthy = b.status.hunger > 40;
                    if (isCrying && (!isSpeaki || !isHealthy)) {
                        console.log(`[Social] CRYING candidate ${b.id} rejected: isSpeaki=${isSpeaki}, hunger=${b.status.hunger}`);
                    }
                    return isCrying && isSpeaki && isHealthy;
                },
                execute: (baby, adult) => {
                    console.log(`[Social] 大人 ${adult.id} が泣いている赤ちゃん ${baby.id} を助けることに決めました`);
                    this.triggerDirectedSocialAction(baby, adult, {
                        movementType: 'TARGET_TO_INITIATOR',
                        initiatorAction: 'happy',
                        receiverAction: 'idle',
                        sequence: [
                            { origin: 'sad', target: 'happy' },
                            { origin: 'sad', target: 'happy' },
                            { origin: 'happy', target: 'happy' }
                        ],
                        onComplete: (b) => {
                            b.status.hunger = Math.min(100, b.status.hunger + 20);
                            b.status.emotion = 'happy';
                        }
                    });
                }
            },
            {
                id: 'CHAT',
                priority: 1,
                canTrigger: (a, b) => {
                    const dist = Math.sqrt((a.pos.x - b.pos.x) ** 2 + (a.pos.y - b.pos.y) ** 2);
                    return dist < 400 && !(a.characterType === 'baby' && b.characterType === 'baby');
                },
                execute: (a, b) => this.startInteraction(a, b, {
                    sequence: [
                        { origin: 'random', target: 'random' },
                        { origin: 'random', target: 'random' },
                        { origin: 'random', target: 'random' }
                    ]
                })
            }
        ];
    }

    /** キャラクターからのリクエストを受け付ける（ハイブリッド型の中核） */
    requestSocialAction(initiator, target, actionId) {
        // 1. ターゲットが指定されていない場合、近隣から探す (自律検索)
        if (!target) {
            const candidates = this.game.speakis.filter(s =>
                s !== initiator &&
                s.canInteract &&
                !this._isInSocialState(s) &&
                !s.interaction.isInteracting &&
                Math.sqrt((initiator.pos.x - s.pos.x) ** 2 + (initiator.pos.y - s.pos.y) ** 2) < 800 // 範囲を少し広げる
            );
            if (candidates.length === 0) return false;
            target = candidates[Math.floor(Math.random() * candidates.length)];
        }

        // 衝突チェック: targetが既に交流中ならNG
        if (this._isInSocialState(target)) return false;
        if (this._isInSocialState(initiator)) return false;

        // 頻度チェック (全体系)
        if (Date.now() - this.lastSocialTime < 2000) return false;

        // テンプレートからアクションを探す
        const template = this._getSocialActionTemplates().find(t => t.id === actionId);
        if (!template) return false;

        // 実行条件チェック
        if (!template.canTrigger(initiator, target) && !template.canTrigger(target, initiator)) {
            return false;
        }

        // 実行
        console.log(`[Social] Action requested: ${actionId} from ${initiator.id} to ${target.id}`);
        template.execute(initiator, target);
        this.lastSocialTime = Date.now();
        return true;
    }

    /** キャラクターが交流状態にあるかチェック */
    _isInSocialState(char) {
        return [STATE.GAME_APPROACHING, STATE.GAME_REACTION].includes(char.status.state);
    }

    /** 中央管理による更新 */
    update(dt) {
        const game = this.game;
        const now = Date.now();

        // 1. 確率計算 (基準: 2匹のときに300秒に1回程度に引き下げ。基本はリクエストベースにする)
        const eventsPerSec = game.speakis.length / 600;
        const probPerFrame = (dt / 1000) * eventsPerSec;

        // 短時間に連続発生しすぎないよう最低 2秒 のインターバル
        if (now - this.lastSocialTime < 2000) return;

        // ロール実行
        if (Math.random() > probPerFrame) return;

        // 候補のピックアップ
        const candidates = game.speakis.filter(s =>
            s.canInteract &&
            s.status.friendship > -31 &&
            [STATE.IDLE, STATE.WALKING].includes(s.status.state) &&
            !s.interaction.isInteracting
        );

        if (candidates.length < 2) return;

        // ペアの選定
        const shuffled = [...candidates].sort(() => Math.random() - 0.5);
        const templates = this._getSocialActionTemplates();

        for (let i = 0; i < shuffled.length; i++) {
            const char1 = shuffled[i];
            const partners = shuffled.filter(c => c !== char1);
            if (partners.length === 0) break;

            const char2 = partners[Math.floor(Math.random() * partners.length)];

            for (const template of [...templates].sort((a, b) => b.priority - a.priority)) {
                let initiator = null;
                let target = null;

                if (template.canTrigger(char1, char2)) {
                    initiator = char1; target = char2;
                } else if (template.canTrigger(char2, char1)) {
                    initiator = char2; target = char1;
                }

                if (initiator && target) {
                    console.log(`[Game] Social Event triggered by probability: ${template.id} between ${initiator.id} and ${target.id}`);
                    template.execute(initiator, target);
                    this.lastSocialTime = now;
                    return;
                }
            }
        }
    }

    /** ターゲット指定型（一方からの駆け寄り）交流の開始 */
    triggerDirectedSocialAction(initiator, target, options) {
        // 状態保存と遷移
        initiator.status.stateStack.push(initiator.status.state);
        target.status.stateStack.push(target.status.state);

        const movementType = options.movementType || 'INITIATOR_TO_TARGET';

        if (movementType === 'TARGET_TO_INITIATOR') {
            // ターゲット（大人など）がイニシエーター（赤ちゃんなど）に歩み寄る
            target.status.state = STATE.GAME_APPROACHING;
            initiator.status.state = STATE.GAME_REACTION;

            // パートナー紐付け
            target.socialConfig = { partner: initiator, isInitiator: true, isOrigin: false, options: options };
            initiator.socialConfig = { partner: target, isInitiator: false, isOrigin: true, options: options };

            // ターン制御（歩み寄る側が先行）
            target.status.isMySocialTurn = true;
            initiator.status.isMySocialTurn = false;
        } else {
            // イニシエーターがターゲットに歩み寄る（従来通り）
            initiator.status.state = STATE.GAME_APPROACHING;
            target.status.state = STATE.GAME_REACTION;

            // パートナー紐付け
            initiator.socialConfig = { partner: target, isInitiator: true, isOrigin: true, options: options };
            target.socialConfig = { partner: initiator, isInitiator: false, isOrigin: false, options: options };

            // ターン制御
            initiator.status.isMySocialTurn = true;
            target.status.isMySocialTurn = false;
        }

        initiator.status.socialTurnCount = 0;
        target.status.socialTurnCount = 0;

        // 演出開始
        initiator.showEmoji(movementType === 'TARGET_TO_INITIATOR' ? '!' : '💬', null);
        target.showEmoji(movementType === 'TARGET_TO_INITIATOR' ? '💬' : '!', null);

        initiator._onStateChanged(initiator.status.state);
        target._onStateChanged(target.status.state);

        // 状態変更後に目的地を確定させる
        if (movementType === 'TARGET_TO_INITIATOR') {
            target.pos.targetX = initiator.pos.x + (target.pos.x < initiator.pos.x ? -120 : 120);
            target.pos.targetY = initiator.pos.y;
            target.pos.destinationSet = true;
        } else {
            initiator.pos.targetX = target.pos.x + (initiator.pos.x < target.pos.x ? -120 : 120);
            initiator.pos.targetY = target.pos.y;
            initiator.pos.destinationSet = true;
        }
    }

    /** 従来型の（お互いに歩み寄る）交流の開始 */
    startInteraction(char1, char2, options = {}) {
        // 常に左にいる方をchar1, 右にいる方をchar2にする
        if (char1.pos.x > char2.pos.x) {
            [char1, char2] = [char2, char1];
        }

        let target1, target2;
        if (char1.characterType === 'baby') {
            target1 = { x: char1.pos.x, y: char1.pos.y };
            target2 = { x: char1.pos.x + 80, y: char1.pos.y };
        } else if (char2.characterType === 'baby') {
            target1 = { x: char2.pos.x - 80, y: char2.pos.y };
            target2 = { x: char2.pos.x, y: char2.pos.y };
        } else {
            const midX = (char1.pos.x + char2.pos.x) / 2;
            const midY = (char1.pos.y + char2.pos.y) / 2;
            target1 = { x: midX - 80, y: midY };
            target2 = { x: midX + 80, y: midY };
        }

        const start = (char, targetPos, partner, isFirst) => {
            char.status.stateStack.push(char.status.state);
            char.status.state = STATE.GAME_APPROACHING;
            char.status.isMySocialTurn = isFirst;
            char.status.socialTurnCount = 0;
            char.socialConfig = { partner, isInitiator: isFirst, isOrigin: isFirst, options: options };
            char.showEmoji('💬', null);
            char._onStateChanged(char.status.state);

            char.pos.targetX = targetPos.x;
            char.pos.targetY = targetPos.y;
            char.pos.destinationSet = true;
        };

        start(char1, target1, char2, true);
        start(char2, target2, char1, false);
    }

    /** コンソール等からのテスト用コマンド */
    testSocial(actionId = 'GIVE_CANDY') {
        const game = this.game;
        if (game.speakis.length < 2) {
            console.error("[Test] Not enough speakis to test social actions.");
            return;
        }
        const initiator = game.speakis[0];
        const target = game.speakis[1];

        if (actionId === 'CHAT') {
            this.startInteraction(initiator, target, {
                sequence: [
                    { initiator: 'random', target: 'random' },
                    { initiator: 'random', target: 'random' },
                    { initiator: 'random', target: 'random' }
                ]
            });
            return;
        }

        const template = this._getSocialActionTemplates().find(t => t.id === actionId);
        if (template && template.execute) {
            console.log(`[Test] Executing template for ${actionId}`);
            template.execute(initiator, target);
        } else {
            console.error(`[Test] Unknown social action or no executor: ${actionId}`);
        }
    }

    /** デバッグ用: 赤ちゃんを強制的に泣かせ、大人を呼ぶ (1:1) */
    forceBabyCrying() {
        const baby = this.game.speakis.find(s => s.characterType === 'baby');
        if (!baby) {
            console.error("[Social] No baby found to cry.");
            return;
        }
        console.log(`[Social] Forcing Baby Crying 1:1 action for ${baby.id}`);
        baby.status.emotion = 'sad';
        baby.status.action = 'crying';
        baby.showEmoji('😭', 5000);

        // 近くの大人を一人見つけてリクエストを投げる
        const success = this.requestSocialAction(baby, null, 'CRYING');
        if (!success) {
            console.warn("[Social] No partner found for forced crying.");
        }
    }
}
