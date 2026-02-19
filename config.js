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
 * 形式: [キャラタイプ][カテゴリ][感情/ターゲット][アクション] = [バリエーション...]
 */
export const ASSETS = {
    speaki: {
        mood: {
            normal: {
                idle: [
                    { imagefile: 'speaki_normal_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    //{ imagefile: 'speaki_normal_idle_2.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ', movePattern: 'bounce' },
                    //{ imagefile: 'speaki_normal_idle_3.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' }
                ],
                walking: [
                    { imagefile: 'speaki_normal_walking_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_walking_2.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ-ﾁｮﾜﾖ-', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_walking_3.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' }
                ]
            },
            happy: {
                idle: [
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜヨ!', movePattern: 'none' },
                    { imagefile: 'speaki_happy_idle_2.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜヨｰ', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_idle_3.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' }
                ],
                walking: [
                    { imagefile: 'speaki_happy_walking_1.png', soundfile: 'チョワヨチョワヨウェガレジチョワヨ.mp3', text: 'ﾁｮﾜヨ-ﾁｮﾜヨ-', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_walking_2.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜヨｰﾁｮﾜヨｰ', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_walking_3.png', soundfile: 'チョワヨチョワヨスンバコッチチョワヨ.mp3', text: 'ﾁｮﾜヨ-ﾁｮﾜヨ-', movePattern: 'swing' }
                ],
                giftwait: [
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜヨ!!!!!', movePattern: 'none' }
                ]
            },
            sad: {
                idle: [
                    //{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_1.png', soundfile: 'ひきつけ.mp3', text: 'ﾋｯ…ﾋｯ…', movePattern: 'shake' },
                    //{ imagefile: 'speaki_sad_idle_2.png', soundfile: 'デルジバゼヨ.mp3', text: 'ﾃﾞﾙｼﾞﾊﾞｾﾞヨ!', movePattern: 'shake' },
                    //{ imagefile: 'speaki_sad_idle_3.png', soundfile: 'ウアアスピキデルジバゼヨ.mp3', text: 'ｳｱｱ!ｽﾋﾟｷﾃﾞﾙｼﾞﾊﾞｾﾞヨ!', movePattern: 'none' },
                    //{ imagefile: 'speaki_sad_walking_1.png', soundfile: 'スピキヲイジメヌンデ.mp3', text: 'ｽﾋﾟｷヲｲｼﾞメヌンデ...', movePattern: 'shake' },
                    //{ imagefile: 'speaki_sad_walking_3.png', soundfile: '本場スピキ叩き.mp3', text: 'ﾃﾞﾙｼﾞﾊﾞｾﾞヨ!', movePattern: 'shake' },
                    //{ imagefile: 'speaki_sad_walking_3.png', soundfile: '完全詠唱.mp3', text: '完全詠唱', movePattern: 'shake' }
                ],
                walking: [
                    { imagefile: 'speaki_sad_walking_1.png', soundfile: 'スピキヲイジメヌンデ.mp3', text: 'ｽﾋﾟｷヲｲｼﾞメヌンデ...', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_walking_2.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_walking_3.png', soundfile: '本場スピキ叩き.mp3', text: 'ﾃﾞﾙｼﾞﾊﾞｾﾞヨ!', movePattern: 'none' }
                ]
            }
        },
        performance: {
            ITEM: {
                Pumpkin: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜヨ!', movePattern: 'bounce' }],
                BabySpeaki: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜヨ!', movePattern: 'bounce', pitch: 1.5 }],
                Candy: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' }],
                Mocaron: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }],
                AnimalCan: [{ imagefile: 'コミー.png', soundfile: 'これを食べて眠気を覚ますにゃん.mp3', text: 'これを食べて眠気を覚ますにゃん', movePattern: 'swing' }],
                Shionmelone: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'bounce' }],
                LeviDriver: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'bounce' }],
                BrokenHobagi: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: '慟哭.mp3', text: '慟哭', movePattern: 'bounce' }],
                generic: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }]
            },
            happy: {
                idle: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }],
                giftreaction: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: '本場スピキくすぐり.mp3', text: '(ｽﾋﾟｷはとっても満足げだ)', movePattern: 'swing' }]
            },
            normal: {
                idle: [{ imagefile: 'speaki_normal_idle_1.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ?', movePattern: 'bounce' }],
                surprised: [{ imagefile: 'speaki_normal_idle_2.png', soundfile: 'アーウ.mp3', text: '痛いよ！', movePattern: 'bounce' }]
            },
            sad: {
                idle: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'アーウ.mp3', text: 'アーーウ...', movePattern: 'bounce' }],
                //surprised: [{ imagefile: 'speaki_sad_surprised_1.png', soundfile: '完全詠唱.mp3', text: '完全詠唱', movePattern: 'shake' }],
                surprised: [{ imagefile: 'speaki_sad_surprised_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱｯ!', movePattern: 'shake' }],
                gifttimeout: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ', movePattern: 'stretch' }]
            }
        }
    },
    baby: {
        mood: {
            normal: {
                idle: [{ imagefile: 'speaki_normal_idle_1.png', soundfile: 'スピキ.mp3', text: 'ﾋﾟｷ!', movePattern: 'swing' }],
                walking: [{ imagefile: 'speaki_normal_walking_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }]
            },
            happy: {
                idle: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ｷｬﾊﾊ!', movePattern: 'bounce' }],
                walking: [{ imagefile: 'speaki_happy_walking_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜヨ!', movePattern: 'bounce' }]
            },
            sad: {
                idle: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'アーウ.mp3', text: 'ｱｰｰｳ...', movePattern: 'bounce' }],
                walking: [{ imagefile: 'speaki_sad_walking_1.png', soundfile: 'アーウ.mp3', text: 'ｱーｳ...', movePattern: 'bounce' }]
            }
        },
        performance: {
            ITEM: {
                Pumpkin: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜヨ!', movePattern: 'bounce' }],
                BabySpeaki: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜヨ!', movePattern: 'bounce', pitch: 1.5 }],
                Candy: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' }],
                Mocaron: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }],
                AnimalCan: [{ imagefile: 'コミー.png', soundfile: 'これを食べて眠気を覚ますにゃん.mp3', text: 'これを食べて眠気を覚ますにゃん', movePattern: 'swing' }],
                Shionmelone: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'bounce' }],
                LeviDriver: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'bounce' }],
                BrokenHobagi: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: '慟哭.mp3', text: '慟哭', movePattern: 'bounce' }],
                generic: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }]
            },
            normal: {
                idle: [{ imagefile: 'speaki_normal_idle_1.png', soundfile: 'スピキ.mp3', text: 'ﾋﾟｷ?', movePattern: 'bounce' }]
            },
            sad: {
                idle: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'アーウ.mp3', text: 'ｱｰｰｳ...', movePattern: 'bounce' }],
                surprised: [{ imagefile: 'speaki_sad_surprised_1.png', soundfile: 'ウアア.mp3', text: 'ｱｱｯ!', movePattern: 'shake' }]
            }
        }
    }
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
        isFood: false, // 成長用なので勝手に食べない
        transform: { nextId: 'Pumpkin2', duration: 10000 }
    },
    Pumpkin2: {
        name: 'かぼちゃ_割れ',
        imagefile: 'item_pumpkin2.png',
        soundfile: 'ピキ.mp3',
        text: '',
        size: 180,
        pitch: 1.5,
        isFood: false,
        transform: { nextId: 'BabySpeaki', duration: 10000 }
    },
    BabySpeaki: {
        name: '赤ちゃんスピキ',
        imagefile: 'item_baby_speaki.png',
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ',
        size: 80,
        pitch: 1.5,
        isFood: false,
        transform: { nextId: 'BabySpeaki2', duration: 20000 }
    },
    BabySpeaki2: {
        name: '赤ちゃんスピキ2',
        imagefile: 'item_baby_speaki2.png',
        soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3',
        text: 'ﾁｮﾜﾖ',
        size: 80,
        pitch: 1.5,
        isFood: false,
        transform: { isAdult: 'baby', duration: 20000 }
    },
    Candy: {
        name: 'キャンディ',
        imagefile: 'item_キャンディ.png',
        size: 100,
        text: 'ﾜｱ ｷｬﾝﾃﾞｨﾀﾞ ｳｯﾋｮｰ!',
        showInMenu: true,
        nutrition: 15,
        isFood: true,
    },
    Mocaron: {
        name: 'モカロン',
        imagefile: 'item_モカロン.png',
        size: 100,
        text: '',
        showInMenu: true,
        nutrition: 25,
        isFood: true,
    },
    AnimalCan: {
        name: 'アニマル缶',
        imagefile: 'item_アニマル缶.png',
        soundfile: 'コミーだってやるときはやるにゃん.mp3',
        size: 100,
        text: 'エルフ族特製!',
        isSpecialGift: true,
        nutrition: 60,
        isFood: true,
    },
    Shionmelone: {
        name: 'シオン・ザ・メロンブレッド',
        imagefile: 'item_シオン・ザ・メロンブレッド.png',
        soundfile: 'シオン口上視線が泳いでいるぞ.mp3',
        size: 150,
        text: '元ネタ: https://youtu.be/Py06vYKp4EY?si=V2BOhdAMiVH_Rvh1',
        isSpecialGift: true,
        isFood: false,
    },
    LeviDriver: {
        name: 'レヴィ・ドライバー',
        imagefile: 'item_レヴィドライバー.png',
        soundfile: 'レヴィドライバー.mp3',
        size: 100,
        text: '元ネタ: https://youtu.be/WsQKUin6sb0?si=lltZElvtIdY4qbA6',
        isSpecialGift: true,
        isFood: false,
    },
    BrokenHobagi: {
        name: 'かぼちゃ粥',
        imagefile: 'item_かぼちゃ粥.png',
        size: 100,
        isSpecialGift: true,
        isFood: false,
    },
    RandomGift: {
        name: 'ランダムギフト(ｽﾋﾟｷからもらったプラスチックの分だけ配置できる)',
        imagefile: 'gift.png', // ギフト画像を使用
        size: 50,
        showInMenu: true,
        isRandomTool: true // 内部的な識別用
    }
};
