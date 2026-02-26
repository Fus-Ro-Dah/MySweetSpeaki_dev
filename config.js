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
    GAME_REACTION: 'game_reaction',

    // 特殊能力(アイテム配置など)
    ABILITY_ACTION: 'ability_action'
};

/**
 * 統合アセット定義 (ASSETS)
 * 形式: [キャラタイプ][カテゴリ][感情/ターゲット][アクション] = [バリエーション...]
 * スピキのtextは大体半角のカタカナであることに注意
 */
export const ASSETS = {
    speaki: {
        mood: {
            normal: {
                idle: [
                    { imagefile: 'speaki_normal_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_idle_2.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'none' },
                ],
                walking: [
                    { imagefile: 'speaki_normal_walking_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                ]
            },
            happy: {
                idle: [
                    { imagefile: 'speaki_happy_idle_2.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_idle_3.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_idle_4.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_idle_5.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' }
                ],
                walking: [
                    { imagefile: 'speaki_happy_walking_1.png', soundfile: 'チョワヨチョワヨウェガレジチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ-ﾁｮﾜﾖ-', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_walking_2.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_walking_3.png', soundfile: 'チョワヨチョワヨスンバコッチチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_walking_4.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'none' },
                    { imagefile: 'speaki_happy_walking_5.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' }
                ],
                giftwait: [
                    { imagefile: 'speaki_happy_giftwait.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!!!!!', movePattern: 'none' }
                ]
            },
            sad: {
                idle: [
                    { imagefile: 'speaki_sad_idle_1.png', soundfile: '完全詠唱.mp3', text: '完全詠唱', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_2.png', soundfile: 'デルジバゼヨ.mp3', text: 'ﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_3.png', soundfile: 'ウアアスピキデルジバゼヨ.mp3', text: 'ｳｱｱ!ｽﾋﾟｷﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_4.png', soundfile: 'スピキヲイジメヌンデ.mp3', text: 'ｽﾋﾟｷｦｲｼﾞﾒﾇﾝﾃﾞ...', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_5.png', soundfile: 'ひきつけ.mp3', text: 'ﾋｯｸ…ﾋｯｸ…', movePattern: 'shake' }
                ],
                walking: [
                    { imagefile: 'speaki_sad_walking_1.png', soundfile: 'スピキヲイジメヌンデ.mp3', text: 'ｽﾋﾟｷｦｲｼﾞﾒﾇﾝﾃﾞ...', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_walking_2.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_walking_3.png', soundfile: '本場スピキ叩き.mp3', text: 'ﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!', movePattern: 'none' }
                ]
            }
        },
        performance: {
            ITEM: {
                Pumpkin: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'bounce' }],
                BabySpeaki: [{ imagefile: 'speaki_happy_idle_2.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'bounce' }],
                Candy: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' }],
                Mocaron: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }],
                AnimalCan: [{ imagefile: 'コミー.png', soundfile: 'これを食べて眠気を覚ますにゃん.mp3', text: 'これを食べて眠気を覚ますにゃん', movePattern: 'swing' }],
                Shionmelone: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'bounce' }],
                LeviDriver: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'bounce' }],
                BrokenHobagi: [{ imagefile: 'speaki_sad_idle_3.png', soundfile: '慟哭.mp3', text: '慟哭', movePattern: 'shake' }],
                Poteto: [{ imagefile: 'speaki_item_poteto.png', soundfile: '本場スピキ撫で.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }],
                generic: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }]
            },
            happy: {
                idle: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }],
                giftreaction: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: '本場スピキくすぐり.mp3', text: '(ｽﾋﾟｷはとっても満足げだ)', movePattern: 'swing' }]
            },
            normal: {
                idle: [{ imagefile: 'speaki_normal_idle_1.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ?', movePattern: 'bounce' }],
                surprised: [{ imagefile: 'speaki_normal_idle_2.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ!', movePattern: 'bounce' }]
            },
            sad: {
                idle: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'アーウ.mp3', text: 'ｱｰｰｳ...', movePattern: 'bounce' }],
                surprised: [{ imagefile: 'speaki_sad_surprised_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱｯ!', movePattern: 'shake' }],
                gifttimeout: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'スピキヲイジメヌンデ.mp3', text: 'ｽﾋﾟｷｦｲｼﾞﾒﾇﾝﾃﾞ……', movePattern: 'shake' }]
            }
        }
    },
    baby: {
        mood: {
            //画像素材が足りないため、normal、idleの画像を使い回している
            normal: {
                idle: [
                    { imagefile: 'baby_normal_idle_1.png', soundfile: 'ピキ.mp3', text: 'ﾋﾟｷ!', movePattern: 'none' },
                    { imagefile: 'baby_normal_idle_1.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ…', movePattern: 'bounce' },
                    { imagefile: 'baby_normal_idle_1.png', soundfile: '無音08.mp3', text: '……', movePattern: 'bounce' },
                    { imagefile: 'baby_normal_idle_1.png', soundfile: '無音08.mp3', text: '……', movePattern: 'bounce' }
                ],
                walking: [{ imagefile: 'baby_normal_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'none' }]
            },
            happy: {
                idle: [{ imagefile: 'baby_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'none' }],
                walking: [{ imagefile: 'baby_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ばぶぅ!', movePattern: 'bounce' }]
            },
            sad: {
                idle: [{ imagefile: 'baby_normal_idle_1.png', soundfile: 'アーウ.mp3', text: 'ふええ...', movePattern: 'shake' }],
                walking: [{ imagefile: 'baby_normal_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱｱｱﾝ!!', movePattern: 'shake' }]
            }
        },
        performance: {
            ITEM: {
                Pumpkin: [{ imagefile: 'baby_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ばぶ!', movePattern: 'bounce' }],
                BabySpeaki: [{ imagefile: 'baby_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ばぶぅ!', movePattern: 'bounce', pitch: 2.0 }],
                Candy: [{ imagefile: 'baby_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ぺろぺろ', movePattern: 'swing' }],
                Mocaron: [{ imagefile: 'baby_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'もぐもぐ', movePattern: 'bounce' }],
                AnimalCan: [{ imagefile: 'コミー.png', soundfile: 'これを食べて眠気を覚ますにゃん.mp3', text: 'ばぶぅん', movePattern: 'swing' }],
                Shionmelone: [{ imagefile: 'baby_normal_idle_1.png', soundfile: 'ウアア.mp3', text: 'いや!', movePattern: 'bounce' }],
                LeviDriver: [{ imagefile: 'baby_normal_idle_1.png', soundfile: 'ウアア.mp3', text: 'だめ!', movePattern: 'bounce' }],
                BrokenHobagi: [{ imagefile: 'baby_normal_idle_1.png', soundfile: '慟哭.mp3', text: 'うわぁぁん', movePattern: 'bounce' }],
                Poteto: [{ imagefile: 'baby_happy_idle_1.png', soundfile: '本場スピキ撫で.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }],
                generic: [{ imagefile: 'baby_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ばぶぅ', movePattern: 'bounce' }]
            },
            normal: {
                idle: [{ imagefile: 'baby_normal_idle_1.png', soundfile: 'スピキ.mp3', text: 'ばぶぅ', movePattern: 'bounce' }],
                surprised: [{ imagefile: 'baby_normal_idle_2.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ!!', movePattern: 'shake' }]
            },
            sad: {
                idle: [{ imagefile: 'baby_normal_idle_1.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ...', movePattern: 'bounce' }],
                surprised: [{ imagefile: 'baby_normal_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱｱｱﾝ!!', movePattern: 'shake' }]
            }
        }
    },
    child: {
        mood: {
            normal: {
                idle: [
                    { imagefile: 'speaki_normal_idle_1.png', soundfile: 'スピキ.mp3', text: 'ﾋﾟｷ!', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_idle_2.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ!', movePattern: 'swing' }
                ],
                walking: [{ imagefile: 'speaki_normal_walking_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }]
            },
            happy: {
                idle: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' }],
                walking: [{ imagefile: 'speaki_happy_walking_2.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }]
            },
            sad: {
                idle: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'アーウ.mp3', text: 'ｱｰｰｳ...', movePattern: 'shake' }],
                walking: [{ imagefile: 'speaki_sad_walking_2.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ...', movePattern: 'shake' }]
            }
        },
        performance: {
            ITEM: {
                Pumpkin: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }],
                BabySpeaki: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce', pitch: 1.5 }],
                Candy: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' }],
                Mocaron: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }],
                AnimalCan: [{ imagefile: 'コミー.png', soundfile: 'これを食べて眠気を覚ますにゃん.mp3', text: 'これを食べて眠気を覚ますにゃん', movePattern: 'swing' }],
                Shionmelone: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'bounce' }],
                LeviDriver: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'bounce' }],
                BrokenHobagi: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: '慟哭.mp3', text: '慟哭', movePattern: 'bounce' }],
                Poteto: [{ imagefile: 'speaki_item_poteto.png', soundfile: '本場スピキ撫で.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }],
                generic: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜヨ!', movePattern: 'bounce' }]
            },
            normal: {
                idle: [{ imagefile: 'speaki_normal_idle_1.png', soundfile: 'スピキ.mp3', text: 'ﾋﾟｷ?', movePattern: 'bounce' }],
                surprised: [{ imagefile: 'speaki_normal_idle_2.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ！？', movePattern: 'bounce' }]
            },
            sad: {
                idle: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'アーウ.mp3', text: 'ｱｰｰｳ...', movePattern: 'bounce' }],
                surprised: [{ imagefile: 'speaki_sad_surprised_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱｯ！', movePattern: 'shake' }]
            }
        }
    },
    /* ashur: {
        mood: {
            normal: {
                idle: [{ imagefile: 'ashur_idle_1.png', soundfile: 'スピキ.mp3', text: 'ｱｼｭｰﾙ', movePattern: 'bounce' }],
                walking: [{ imagefile: 'ashur_walking_1.png', soundfile: 'スピキ.mp3', text: 'ｱｼｭｰﾙ', movePattern: 'bounce' }]
            }
        },
        performance: {
            normal: {
                idle: [{ imagefile: 'ashur_idle_1.png', soundfile: 'スピキ.mp3', text: 'ｱｼｭｰﾙ', movePattern: 'bounce' }],
                walking: [{ imagefile: 'ashur_walking_1.png', soundfile: 'スピキ.mp3', text: 'ｱｼｭｰﾙ', movePattern: 'bounce' }],
                place_item: [{ imagefile: 'ashur_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'どーぞ！', movePattern: 'jump' }]
            }
        }
    }, */
    posher: {
        mood: {
            normal: {
                idle: [
                    { imagefile: 'posher_idle_1.png', soundfile: 'さつまいも.mp3', text: 'さつまいも', movePattern: 'bounce' },
                    { imagefile: 'posher_idle_1.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'none' },
                    { imagefile: 'posher_idle_2.png', soundfile: 'いももかぼちゃのなかまでしょ.mp3', text: 'いももかぼちゃのなかまでしょ？', movePattern: 'bounce' }
                ],
                walking: [
                    //idleもwalkingも同じ画像としている
                    { imagefile: 'posher_idle_1.png', soundfile: 'さつまいもかぼちゃ.mp3', text: 'さつまいもかぼちゃ', movePattern: 'none' },
                    { imagefile: 'posher_idle_2.png', soundfile: 'いいわよ_ポーシャー.mp3', text: 'いいわよ', movePattern: 'none' }
                ]
            }
        },
        performance: {
            normal: {
                idle: [{ imagefile: 'posher_idle_1.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'bounce' }],
                walking: [{ imagefile: 'posher_idle_2.png', soundfile: 'いももかぼちゃのなかまでしょ.mp3', text: 'いももかぼちゃのなかまでしょ？', movePattern: 'bounce' }],
                place_item: [{ imagefile: 'posher_idle_1.png', soundfile: 'さつまいも.mp3', text: 'どーぞ！', movePattern: 'jump' }]
            }
        }
    }
};

/**
 * 統合アイテム定義 (ITEMS)
 */
export const ITEMS = {
    NormalPumpkin: {
        name: ' ﾎﾊﾞｷﾞ',
        imagefile: 'item_pumpkin.png',
        text: '',
        size: 180,
        showInMenu: true,
        isFood: false,
        friendshipChange: 2,
        forcedEmotion: 'happy'
    },
    Pumpkin: {
        name: 'ﾌｼｷﾞなﾎﾊﾞｷﾞ',
        imagefile: 'item_pumpkin.png',
        text: '',
        size: 180,
        showInMenu: true,
        isFood: false,
        transform: { nextId: 'Pumpkin2', duration: 10000 },
        friendshipChange: 2,
        forcedEmotion: 'happy'
    },
    Pumpkin2: {
        name: 'ﾌｼｷﾞなﾎﾊﾞｷﾞ_割れ',
        imagefile: 'item_pumpkin2.png',
        soundfile: 'ピキ.mp3',
        text: '',
        size: 180,
        pitch: 1.5,
        isFood: false,
        transform: { isAdult: 'baby', duration: 10000 }
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
        friendshipChange: 2,
        forcedEmotion: 'happy'
    },
    Mocaron: {
        name: 'モカロン',
        imagefile: 'item_モカロン.png',
        size: 100,
        text: '',
        showInMenu: true,
        nutrition: 25,
        isFood: true,
        friendshipChange: 5,
        forcedEmotion: 'happy'
    },
    Poteto: {
        name: 'さつまいも',
        imagefile: 'item_poteto.png',
        size: 100,
        text: '',
        showInMenu: true,
        nutrition: 15,
        isFood: true,
        friendshipChange: 0, //ポーシャーから与えられるため
        forcedEmotion: 'happy'
    },
    AnimalCan: {
        name: 'アニマル缶',
        imagefile: 'item_アニマル缶.png',
        soundfile: 'コミーだってやるときはやるにゃん.mp3',
        size: 100,
        text: 'エルフ族特製!',
        isSpecialGift: true,
    },
    Shionmelone: {
        name: 'シオン・ザ・メロンブレッド',
        imagefile: 'item_シオン・ザ・メロンブレッド.png',
        soundfile: 'シオン口上視線が泳いでいるぞ.mp3',
        size: 150,
        text: '元ネタ: https://youtu.be/Py06vYKp4EY?si=V2BOhdAMiVH_Rvh1',
        isSpecialGift: true,
        isFood: false,
        forcedEmotion: 'happy'
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
        forcedEmotion: 'sad'
    },
    RandomGift: {
        name: 'ランダムアイテム',
        imagefile: 'gift.png', // ギフト画像を使用
        size: 50,
        showInMenu: true,
        isRandomTool: true // 内部的な識別用
    }
};

/**
 * バイト(NPC呼出)定義 (JOBS)
 */
export const JOBS = {
    /*     CallAshur: {
            name: 'エシュール(モカロン屋さん)',
            imagefile: 'ashur_idle_1.png',
            size: 80,
            showInMenu: true,
            npcType: 'ashur'
        }, */
    CallPosher: {
        name: '給餌係 Pさん',
        imagefile: 'posher_idle_1.png',
        size: 150,
        showInMenu: true,
        npcType: 'posher'
    }
};
