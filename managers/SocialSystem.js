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
                    onComplete: (r) => {
                        r.status.hunger = Math.min(100, r.status.hunger + 30);
                        r.changeMood(10); // お菓子をもらって上機嫌
                        initiator.changeMood(5); // お菓子をあげて自分も満足
                    }
                })
            },
            {
                id: 'CRYING',
                priority: 20,
                movementType: 'TARGET_TO_ORIGIN', // 大人が赤ちゃんに歩み寄る
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
                        movementType: 'TARGET_TO_ORIGIN',
                        initiatorAction: 'happy',
                        receiverAction: 'idle',
                        sequence: [
                            { origin: 'sad', target: 'happy' },
                            { origin: 'sad', target: 'happy' },
                            { origin: 'happy', target: 'happy' }
                        ],
                        onComplete: () => {
                            baby.status.hunger = Math.min(100, baby.status.hunger + 20);
                            baby.status.emotion = 'happy';
                            baby.changeMood(15); // なだめてもらって安心
                            adult.changeMood(5); // 助けてあげて満足
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
                        { origin: 'normal', target: 'normal' },
                        { origin: 'normal', target: 'normal' },
                        { origin: 'happy', target: 'happy' }
                    ],
                    onComplete: () => {
                        a.changeMood(2);
                        b.changeMood(2);
                    }
                })
            },
            {
                id: 'HAPPY_DANCE',
                priority: 15,
                canTrigger: (a, b) => {
                    return a.characterType === 'speaki' && b.characterType === 'speaki' &&
                        a.status.mood > 20 && b.status.mood > 20;
                },
                execute: (a, b) => this.startInteraction(a, b, {
                    sequence: [
                        { origin: 'performance.action.dance', target: 'performance.action.hop' },
                        { origin: 'performance.action.hop', target: 'performance.action.dance' }
                    ],
                    onComplete: () => {
                        a.changeMood(5);
                        b.changeMood(5);
                    }
                })
            },
            {
                id: 'SOOTHE',
                priority: 15,
                movementType: 'TARGET_TO_ORIGIN',
                canTrigger: (a, b) => {
                    // a: 泣いている/不機嫌な子, b: 助ける大人/余裕のある子
                    return a.status.mood < -30 && b.status.mood >= 0;
                },
                execute: (sadOne, helper) => this.triggerDirectedSocialAction(sadOne, helper, {
                    movementType: 'TARGET_TO_ORIGIN',
                    initiatorAction: 'happy',
                    receiverAction: 'sad',
                    sequence: [
                        { origin: 'sad', target: 'happy' },
                        { origin: 'sad', target: 'happy' },
                        { origin: 'happy', target: 'happy' }
                    ],
                    onComplete: () => {
                        sadOne.changeMood(35); // 大幅回復
                        helper.changeMood(10);
                    }
                })
            },
            {
                id: 'PLAY_PUMPKIN',
                priority: 18,
                canTrigger: (a, b) => {
                    if (a.characterType !== 'speaki' || b.characterType !== 'speaki') return false;
                    if (a.status.mood < -20 || b.status.mood < -20) return false;

                    // 近くに ToyPumpkin があるか
                    const items = this.game.placedItems || [];
                    const pumpkin = items.find(it => it.id === 'ToyPumpkin' &&
                        Math.hypot(a.pos.x - it.x, a.pos.y - it.y) < 500);
                    return !!pumpkin;
                },
                execute: (a, b) => this.startInteraction(a, b, {
                    sequence: [
                        { origin: 'performance.action.hop', target: 'performance.action.jump' },
                        { origin: 'performance.action.dance', target: 'performance.action.hop' }
                    ],
                    onComplete: () => {
                        a.changeMood(10);
                        b.changeMood(10);
                    }
                })
            },
            {
                id: 'BABY_CARE',
                priority: 25,
                movementType: 'TARGET_TO_ORIGIN',
                canTrigger: (a, b) => {
                    // a: 赤ちゃん, b: 大人スピキ
                    return a.characterType === 'baby' && b.characterType === 'speaki' && b.status.hunger > 20;
                },
                execute: (baby, adult) => this.triggerDirectedSocialAction(baby, adult, {
                    movementType: 'TARGET_TO_ORIGIN',
                    initiatorAction: 'happy',
                    receiverAction: 'idle',
                    sequence: [
                        { origin: 'performance.action.eat', target: 'performance.action.feed' },
                        { origin: 'performance.action.eat', target: 'performance.action.feed' }
                    ],
                    onComplete: () => {
                        baby.status.hunger = Math.min(100, baby.status.hunger + 15);
                        baby.changeMood(20);
                        adult.changeMood(5);
                    }
                })
            }
        ];
    }

    /** キャラクターからのリクエストを受け付ける（ハイブリッド型の中核） */
    requestSocialAction(initiator, target, actionId = null) {
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

        const templates = this._getSocialActionTemplates();
        let selectedTemplate = null;

        if (actionId) {
            // 指定されたアクションを探す
            selectedTemplate = templates.find(t => t.id === actionId);
            if (!selectedTemplate) return false;
            
            // 実行条件チェック
            if (!selectedTemplate.canTrigger(initiator, target) && !selectedTemplate.canTrigger(target, initiator)) {
                return false;
            }
        } else {
            // 【新機能】現在実行可能なアクションの中から最も優先度が高いものを選ぶ
            const possibleTemplates = templates.filter(t => 
                t.canTrigger(initiator, target) || t.canTrigger(target, initiator)
            );

            if (possibleTemplates.length === 0) return false;

            // 優先度(priority)が高い順にソートして、一番上を採用
            possibleTemplates.sort((a, b) => (b.priority || 0) - (a.priority || 0));
            selectedTemplate = possibleTemplates[0];
        }

        // 実行
        console.log(`[Social] Action selected: ${selectedTemplate.id} (Priority: ${selectedTemplate.priority}) from ${initiator.id} to ${target.id}`);
        selectedTemplate.execute(initiator, target);
        this.lastSocialTime = Date.now();
        return true;
    }

    /** キャラクターが交流状態にあるかチェック */
    _isInSocialState(char) {
        return [STATE.GAME_APPROACHING, STATE.GAME_REACTION].includes(char.status.state);
    }

    /** 中央管理による更新 */
    update(dt) {
        // 今後、全体管理で定期的にゲーム状態を監視する処理が必要であればここに追記する。
        // （キャラクターの自律的リクエストにより交流が発火するため、乱数によるマッチングは廃止した）
    }

    /** ターゲット指定型（一方からの駆け寄り）交流の開始 */
    triggerDirectedSocialAction(origin, target, options) {
        // 状態保存と遷移
        origin.status.stateStack.push(origin.status.state);
        target.status.stateStack.push(target.status.state);

        const movementType = options.movementType || 'ORIGIN_TO_TARGET';

        if (movementType === 'TARGET_TO_ORIGIN') {
            // ターゲット（大人など）がイニシエーター（赤ちゃんなど）に歩み寄る
            target.status.state = STATE.GAME_APPROACHING;
            origin.status.state = STATE.GAME_REACTION;

            // パートナー紐付け
            target.socialConfig = { partner: origin, isInitiator: true, isOrigin: false, options: options };
            origin.socialConfig = { partner: target, isInitiator: false, isOrigin: true, options: options };

            // ターン制御（待機している側が先行して反応できるようにする）
            target.status.isMySocialTurn = false;
            origin.status.isMySocialTurn = true;
        } else {
            // イニシエーターがターゲットに歩み寄る（従来通り）
            origin.status.state = STATE.GAME_APPROACHING;
            target.status.state = STATE.GAME_REACTION;

            // パートナー紐付け
            origin.socialConfig = { partner: target, isInitiator: true, isOrigin: true, options: options };
            target.socialConfig = { partner: origin, isInitiator: false, isOrigin: false, options: options };

            // ターン制御（待機している側が先行して反応できるようにする）
            origin.status.isMySocialTurn = false;
            target.status.isMySocialTurn = true;
        }

        origin.status.socialTurnCount = 0;
        target.status.socialTurnCount = 0;

        // 演出開始
        origin.showEmoji(movementType === 'TARGET_TO_ORIGIN' ? '!' : '💬', null);
        target.showEmoji(movementType === 'TARGET_TO_ORIGIN' ? '💬' : '!', null);

        origin._onStateChanged(origin.status.state);
        target._onStateChanged(target.status.state);

        // 状態変更後に目的地を確定させる
        if (movementType === 'TARGET_TO_ORIGIN') {
            target.pos.targetX = origin.pos.x + (target.pos.x < origin.pos.x ? -120 : 120);
            target.pos.targetY = origin.pos.y;
            target.pos.destinationSet = true;
        } else {
            origin.pos.targetX = target.pos.x + (origin.pos.x < target.pos.x ? -120 : 120);
            origin.pos.targetY = target.pos.y;
            origin.pos.destinationSet = true;
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

    /** デバッグ用: 強制的に赤ちゃん/子どもを泣かせる (CRYING) */
    forceCrying() {
        const childOrBaby = this.game.speakis.find(s => s.characterType === 'baby' || s.characterType === 'child');
        const adult = this.game.speakis.find(s => s.characterType === 'speaki');
        if (!childOrBaby || !adult) {
            console.error("[Social] テストに必要なスピキ（赤子/子どもと大人1人ずつ）がいません。");
            return;
        }
        childOrBaby.status.emotion = 'sad';
        childOrBaby.status.action = 'crying';
        childOrBaby.showEmoji('😭', 5000);
        adult.status.hunger = 100;

        const success = this.requestSocialAction(childOrBaby, adult, 'CRYING');
        if (!success) console.warn("[Social] 開始できませんでした。既に交流中などの理由が考えられます。");
        else console.log(`[Social] 強制的に ${childOrBaby.id} が泣き、大人が助けに行きます`);
    }

    /** デバッグ用: 強制的にお菓子を配らせる (GIVE_CANDY) */
    forceGiveCandy() {
        const adult = this.game.speakis.find(s => s.characterType === 'speaki' && !this._isInSocialState(s));
        const childOrBaby = this.game.speakis.find(s => (s.characterType === 'baby' || s.characterType === 'child') && !this._isInSocialState(s));
        if (!adult || !childOrBaby) {
            console.error("[Social] テストに必要なフリー状態のスピキ（赤子/子どもと大人1人ずつ）がいません。");
            return;
        }
        adult.status.hunger = 100;
        childOrBaby.status.hunger = 10;

        const success = this.requestSocialAction(adult, childOrBaby, 'GIVE_CANDY');
        if (!success) console.warn("[Social] 開始できませんでした。");
        else console.log(`[Social] 強制的に ${adult.id} が ${childOrBaby.id} にお菓子を配りに行きます`);
    }

    /** デバッグ用: 強制的におしゃべりさせる (CHAT) */
    forceChat() {
        const adults = this.game.speakis.filter(s => s.characterType === 'speaki' && !this._isInSocialState(s));
        if (adults.length < 2) {
            console.error("[Social] おしゃべりできるフリーの大人が2匹以上いません。");
            return;
        }
        const initiator = adults[0];
        const target = adults[1];

        // CHATは距離チェック(400px以内)があるため、確実に成功するよう一時的に接近させる
        initiator.pos.x = target.pos.x + 100;
        initiator.pos.y = target.pos.y;

        const success = this.requestSocialAction(initiator, target, 'CHAT');
        if (!success) console.warn("[Social] 開始できませんでした。");
        else console.log(`[Social] 強制的に ${initiator.id} が ${target.id} とおしゃべりを開始します`);
    }

    /** デバッグ用: ハッピーダンス (HAPPY_DANCE) */
    forceHappyDance() {
        const candidates = this.game.speakis.filter(s => s.characterType === 'speaki' && !this._isInSocialState(s));
        if (candidates.length < 2) return console.error("[Social] フリーのスピキが2匹必要です");

        candidates[0].status.mood = 50;
        candidates[1].status.mood = 50;

        const success = this.requestSocialAction(candidates[0], candidates[1], 'HAPPY_DANCE');
        if (success) console.log("[Social] HAPPY_DANCE 開始");
    }

    /** デバッグ用: なだめる (SOOTHE) */
    forceSoothe() {
        const sadOne = this.game.speakis.find(s => !this._isInSocialState(s));
        const helper = this.game.speakis.find(s => s !== sadOne && !this._isInSocialState(s));
        if (!sadOne || !helper) return console.error("[Social] フリーのスピキが2匹必要です");

        sadOne.status.mood = -50;
        helper.status.mood = 50;

        const success = this.requestSocialAction(sadOne, helper, 'SOOTHE');
        if (success) console.log("[Social] SOOTHE 開始");
    }

    /** デバッグ用: かぼちゃ遊び (PLAY_PUMPKIN) */
    forcePlayPumpkin() {
        const candidates = this.game.speakis.filter(s => s.characterType === 'speaki' && !this._isInSocialState(s));
        if (candidates.length < 2) return console.error("[Social] フリーのスピキが2匹必要です");

        // 近くに ToyPumpkin を置く（なければ作る）
        let pumpkin = (this.game.placedItems || []).find(it => it.id === 'ToyPumpkin');
        if (!pumpkin) {
            console.log("[Social] ToyPumpkinがなかったので中央に配置します");
            this.game.items.addItem('ToyPumpkin', 'toy', 600, 400);
            pumpkin = this.game.placedItems.find(it => it.id === 'ToyPumpkin');
        }

        candidates[0].pos.x = pumpkin.x - 50;
        candidates[0].pos.y = pumpkin.y;
        candidates[1].pos.x = pumpkin.x + 50;
        candidates[1].pos.y = pumpkin.y;
        candidates[0].status.mood = 0;
        candidates[1].status.mood = 0;

        const success = this.requestSocialAction(candidates[0], candidates[1], 'PLAY_PUMPKIN');
        if (success) console.log("[Social] PLAY_PUMPKIN 開始");
    }

    /** デバッグ用: 赤ちゃんのお世話 (BABY_CARE) */
    forceBabyCare() {
        const baby = this.game.speakis.find(s => s.characterType === 'baby' && !this._isInSocialState(s));
        const adult = this.game.speakis.find(s => s.characterType === 'speaki' && !this._isInSocialState(s));
        if (!baby || !adult) return console.error("[Social] フリーの赤ちゃんと大人が必要です");

        adult.status.hunger = 100;
        const success = this.requestSocialAction(baby, adult, 'BABY_CARE');
        if (success) console.log("[Social] BABY_CARE 開始");
    }
}
