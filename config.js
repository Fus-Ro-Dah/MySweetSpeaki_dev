/**
 * My Sweet Speaki - 設定と定数
 */

// 状態定数の定義
export const STATE = {
    // 基本的な行動
    IDLE: 'idle',
    WALKING: 'walking',

    // お土産イベント
    GIFT_LEAVING: 'gift_leaving',
    GIFT_SEARCHING: 'gift_searching',
    GIFT_RETURNING: 'gift_returning',
    GIFT_WAIT_FOR_USER_REACTION: 'gift_wait_for_user_reaction',
    GIFT_REACTION: 'gift_reaction',
    GIFT_TIMEOUT: 'gift_timeout',

    // アイテムインタラクション
    ITEM_APPROACHING: 'item_approaching',
    ITEM_ACTION: 'item_action',

    // ユーザーインタラクション
    USER_INTERACTING: 'user_interacting',

    // スピキ同士のインタラクション(今後実装予定)
    GAME_APPROACHING: 'game_approaching',
    GAME_REACTION: 'game_reaction'
};

/**
 * 統合アセット定義 (ASSETS)
 * 形式: speaki_タイプ_感情_行動_番号
 */
export const ASSETS = {
    // -- Mood (状態の継続中ループ・継続するエフェクト) --
    // ---- 通常 ----
    // ------ 停止 ------
    speaki_mood_normal_idle_1: {
        imagefile: 'speaki_normal_idle_1.png',
        soundfile: 'チョワヨ.mp3', // 仮の割り当て
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'swing'
    },
    speaki_mood_normal_idle_2: {
        imagefile: 'speaki_normal_idle_2.png',
        soundfile: 'アーウ.mp3', // 仮の割り当て
        text: 'ｱｰｳ',
        movePattern: 'none'
    },
    speaki_mood_normal_idle_3: {
        imagefile: 'speaki_normal_idle_3.png',
        soundfile: 'スピキ.mp3',
        text: 'ｽﾋﾟｷ!',
        movePattern: 'swing'
    },
    // ------ 歩き ------
    speaki_mood_normal_walking_1: {
        imagefile: 'speaki_normal_walking_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'swing'
    },
    speaki_mood_normal_walking_2: {
        imagefile: 'speaki_normal_walking_2.png',
        soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3',
        text: 'ﾁｮﾜﾖ-ﾁｮﾜﾖ-',
        movePattern: 'swing'
    },
    speaki_mood_normal_walking_3: {
        imagefile: 'speaki_normal_walking_3.png',
        soundfile: 'スピキ.mp3',
        text: 'ｽﾋﾟｷ!',
        movePattern: 'none'
    },
    // ---- うれしい ----
    // ------ 停止 ------
    speaki_mood_happy_idle_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'none'
    },
    speaki_mood_happy_idle_2: {
        imagefile: 'speaki_happy_idle_2.png',
        soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3',
        text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ',
        movePattern: 'swing'
    },
    speaki_mood_happy_idle_3: {
        imagefile: 'speaki_happy_idle_3.png',
        soundfile: 'スピキ.mp3',
        text: 'ｽﾋﾟｷ!',
        movePattern: 'swing'
    },
    // ------ 歩き ------
    speaki_mood_happy_walking_1: {
        imagefile: 'speaki_happy_walking_1.png',
        soundfile: 'チョワヨチョワヨウェガレジチョワヨ.mp3',
        text: 'ﾁｮﾜﾖ-ﾁｮﾜﾖ-',
        movePattern: 'swing'
    },
    speaki_mood_happy_walking_2: {
        imagefile: 'speaki_happy_walking_2.png',
        soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3',
        text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ',
        movePattern: 'swing'
    },
    speaki_mood_happy_walking_3: {
        imagefile: 'speaki_happy_walking_3.png',
        soundfile: 'チョワヨチョワヨスンバコッチチョワヨ.mp3',
        text: 'ﾁｮﾜﾖ-ﾁｮﾜﾖ-',
        movePattern: 'swing'
    },
    // ---- 悲しい ----
    // ------ 停止 ------
    speaki_mood_sad_idle_1: {
        imagefile: 'speaki_sad_idle_1.png',
        soundfile: 'ウアア.mp3',
        text: 'ｳｱｱ!',
        movePattern: 'shake'
    },
    speaki_mood_sad_idle_2: {
        imagefile: 'speaki_sad_idle_2.png',
        soundfile: 'デルジバゼヨ.mp3',
        text: 'ﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!',
        movePattern: 'shake'
    },
    speaki_mood_sad_idle_3: {
        imagefile: 'speaki_sad_idle_3.png',
        soundfile: 'ウアアスピキデルジバゼヨ.mp3',
        text: 'ｳｱｱ!ｽﾋﾟｷﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!',
        movePattern: 'none'
    },
    speaki_mood_sad_idle_4: {
        imagefile: 'speaki_sad_walking_1.png',
        soundfile: 'スピキヲイジメヌンデ.mp3',
        text: 'ｽﾋﾟｷヲｲｼﾞﾒヌンデ...',
        movePattern: 'shake'
    },
    speaki_mood_sad_idle_5: {
        imagefile: 'speaki_sad_walking_3.png',
        soundfile: '本場スピキ叩き.mp3',
        text: 'ﾃﾞﾙｼﾞﾊﾞｾﾞヨ!',
        movePattern: 'shake'
    },
    speaki_mood_sad_idle_6: {
        imagefile: 'speaki_sad_walking_3.png',
        soundfile: '完全詠唱.mp3',
        text: '完全詠唱',
        movePattern: 'shake'
    },

    // ------ 歩き ------
    speaki_mood_sad_walking_1: {
        imagefile: 'speaki_sad_walking_1.png',
        soundfile: 'スピキヲイジメヌンデ.mp3',
        text: 'ｽﾋﾟｷヲｲｼﾞﾒヌンデ...',
        movePattern: 'shake'
    },
    speaki_mood_sad_walking_2: {
        imagefile: 'speaki_sad_walking_2.png',
        soundfile: 'アーウ.mp3',
        text: 'ｱｰｳ',
        movePattern: 'shake'
    },
    speaki_mood_sad_walking_3: {
        imagefile: 'speaki_sad_walking_3.png',
        soundfile: '本場スピキ叩き.mp3',
        text: 'ﾃﾞﾙｼﾞﾊﾞｾﾞヨ!',
        movePattern: 'none'
    },

    // -- Performance --
    // ---- アイテム ----
    speaki_performance_ITEM_Pumpkin_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'bounce'
    },
    speaki_performance_ITEM_BabySpeaki_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'bounce',
        pitch: 1.5
    },
    speaki_performance_ITEM_Candy_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'swing'
    },
    speaki_performance_ITEM_Mocaron_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'bounce'
    },
    speaki_performance_ITEM_AnimalCan_1: {
        imagefile: 'コミー.png',
        soundfile: 'これを食べて眠気を覚ますにゃん.mp3',
        text: 'これを食べて眠気を覚ますにゃん',
        movePattern: 'swing'
    },
    speaki_performance_ITEM_ShionMelone_1: {
        imagefile: 'speaki_sad_idle_1.png',
        soundfile: 'ウアア.mp3',
        text: 'ｳｱｱ!',
        movePattern: 'shake'
    },
    speaki_performance_ITEM_LeviDriver_1: {
        imagefile: 'speaki_sad_idle_1.png',
        soundfile: 'ウアア.mp3',
        text: 'ｳｱｱ!',
        movePattern: 'shake'
    },
    speaki_performance_ITEM_BrokenHobagi_1: {
        imagefile: 'speaki_sad_idle_1.png',
        soundfile: '慟哭.mp3',
        text: '慟哭',
        movePattern: 'shake'
    },

    speaki_performance_ITEM_generic_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'bounce'
    },
    // ---- ギフト ----
    speaki_mood_happy_giftwait_1: {
        imagefile: 'speaki_happy_idle_1.png', // ギフト待機画像
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ!!!!!',
        movePattern: 'none'
    },
    speaki_performance_happy_giftreaction_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: '本場スピキくすぐり.mp3',
        text: '(ｽﾋﾟｷはとっても満足げだ)',
        movePattern: 'swing'
    },
    speaki_performance_sad_gifttimeout_1: {
        imagefile: 'speaki_sad_idle_1.png',
        soundfile: 'アーウ.mp3',
        text: 'ｱｰｳ',
        movePattern: 'stretch'
    },
    // ---- なでなで (idle) ----
    speaki_performance_happy_idle_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'チョワヨ！',
        movePattern: 'bounce'
    },
    speaki_performance_normal_idle_1: {
        imagefile: 'speaki_normal_idle_1.png',
        soundfile: 'スピキ.mp3',
        text: 'ｽﾋﾟｷ?',
        movePattern: 'bounce'
    },
    speaki_performance_sad_idle_1: {
        imagefile: 'speaki_sad_idle_1.png',
        soundfile: 'アーウ.mp3',
        text: 'アーーウ...',
        movePattern: 'shake'
    },
    // ---- 叩く (surprised) ----
    speaki_performance_sad_surprised_1: {
        imagefile: 'speaki_sad_surprised_1.png',
        soundfile: 'ウアア.mp3',
        text: 'ｳｱｱｯ!',
        movePattern: 'shake'
    },
    speaki_performance_normal_surprised_1: {
        imagefile: 'speaki_normal_idle_2.png',
        soundfile: 'アーウ.mp3',
        text: '痛いよ！',
        movePattern: 'shake'
    },

    // -- Baby Speaki Assets (Alias of Speaki with modification if needed) --
    baby_mood_normal_idle_1: { imagefile: 'speaki_normal_idle_1.png', soundfile: 'スピキ.mp3', text: 'ﾋﾟｷ!', movePattern: 'swing' },
    baby_mood_normal_walking_1: { imagefile: 'speaki_normal_walking_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
    baby_mood_happy_idle_1: { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ｷｬﾊﾊ!', movePattern: 'bounce' },
    baby_mood_happy_walking_1: { imagefile: 'speaki_happy_walking_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
    baby_performance_ITEM_generic_1: { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾊﾟｸﾊﾟｸ!', movePattern: 'bounce' },
    baby_performance_normal_idle_1: { imagefile: 'speaki_normal_idle_1.png', soundfile: 'スピキ.mp3', text: 'ﾋﾟｷ?', movePattern: 'bounce' }
};

/**
 * 統合アイテム定義 (ITEMS)
 */
export const ITEMS = {
    Pumpkin: {
        name: 'かぼちゃ',
        imagefile: 'item_pumpkin.png',
        text: '',
        size: 180,
        pitch: 1.5,
        showInMenu: true,
        nutrition: 40,
        transform: { nextId: 'Pumpkin2', duration: 10000 }
    },
    Pumpkin2: {
        name: 'かぼちゃ_割れ',
        imagefile: 'item_pumpkin2.png',
        soundfile: 'ピキ.mp3',
        text: '',
        size: 180,
        pitch: 1.5,
        transform: { nextId: 'BabySpeaki', duration: 10000 }
    },
    BabySpeaki: {
        name: '赤ちゃんスピキ',
        imagefile: 'item_baby_speaki.png',
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ',
        size: 80,
        pitch: 1.5,
        transform: { nextId: 'BabySpeaki2', duration: 20000 }
    },
    BabySpeaki2: {
        name: '赤ちゃんスピキ2',
        imagefile: 'item_baby_speaki2.png',
        soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3',
        text: 'ﾁｮﾜﾖ',
        size: 80,
        pitch: 1.5,
        transform: { isAdult: 'baby', duration: 20000 }
    },
    Candy: {
        name: 'キャンディ',
        imagefile: 'item_キャンディ.png',
        size: 100,
        text: 'ﾜｱ ｷｬﾝﾃﾞｨﾀﾞ ｳｯﾋｮｰ!',
        showInMenu: true,
        nutrition: 15,
    },
    Mocaron: {
        name: 'モカロン',
        imagefile: 'item_モカロン.png',
        size: 100,
        text: '',
        showInMenu: true,
        nutrition: 25,
    },
    AnimalCan: {
        name: 'アニマル缶',
        imagefile: 'item_アニマル缶.png',
        soundfile: 'コミーだってやるときはやるにゃん.mp3',
        size: 100,
        text: 'エルフ族特製!',
        isSpecialGift: true,
        nutrition: 60,
    },
    Shionmelone: {
        name: 'シオン・ザ・メロンブレッド',
        imagefile: 'item_シオン・ザ・メロンブレッド.png',
        soundfile: 'シオン口上視線が泳いでいるぞ.mp3',
        size: 150,
        text: '元ネタ: https://youtu.be/Py06vYKp4EY?si=V2BOhdAMiVH_Rvh1',
        isSpecialGift: true,
    },
    LeviDriver: {
        name: 'レヴィ・ドライバー',
        imagefile: 'item_レヴィドライバー.png',
        soundfile: 'レヴィドライバー.mp3',
        size: 100,
        text: '元ネタ: https://youtu.be/WsQKUin6sb0?si=lltZElvtIdY4qbA6',
        isSpecialGift: true,
    },
    BrokenHobagi: {
        name: 'かぼちゃ粥',
        imagefile: 'item_かぼちゃ粥.png',
        size: 100,
        isSpecialGift: true,
        nutrition: 30,
    },
    RandomGift: {
        name: 'ランダムギフト(ｽﾋﾟｷからもらったプラスチックの分だけ配置できる)',
        imagefile: 'gift.png', // ギフト画像を使用
        size: 50,
        showInMenu: true,
        isRandomTool: true // 内部的な識別用
    }
};
