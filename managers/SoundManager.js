import { ASSETS, ITEMS } from '../config.js';

/**
 * 音声・画像アセットの管理クラス
 * BGM再生、SE再生、画像/音声キャッシュを一元管理する
 */
export class SoundManager {
    constructor() {
        this.images = {};       // 画像キャッシュ（パス/キー -> Image）
        this.sounds = {};       // 音声キャッシュ（ファイル名 -> Audio）
        this.audioEnabled = false;
        this.audioCtx = null;   // AudioContext
        this.bgmBuffer = null;  // Web Audio API用デコード済みデータ
        this.bgmSource = null;  // 再生用ノード
        this.bgmFallback = null; // CORSエラー時のフォールバック用
    }

    /** アセット（画像・音声）の全読み込み */
    loadResources() {
        // ネストされたアセットを再帰的に読み込む
        this._loadNestedAssets(ASSETS);

        // ITEMSに定義された画像と音声をすべて読み込む
        Object.values(ITEMS).forEach(item => {
            if (item.imagefile) {
                const path = `assets/images/${item.imagefile}`;
                const img = new Image();
                img.src = path;
                const key = item.imagefile.replace('.png', '');
                this.images[key] = img;
                this.images[path] = img; // パス指定でも引けるように
            }
            if (item.soundfile && !this.sounds[item.soundfile]) {
                const audio = new Audio(`assets/sounds/${item.soundfile}`);
                this.sounds[item.soundfile] = audio;
            }
        });

        // BGMのロード (Web Audio API用)
        this._loadBGM('assets/music/he-jitsu-no-joh.mp3');
    }

    /** BGMをフェッチしてデコードする */
    async _loadBGM(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();

            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }

            this.bgmBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
            console.log("[Audio] BGM loaded and decoded (Web Audio API).");
        } catch (e) {
            console.warn("[Audio] Web Audio API failed (CORS?), falling back to standard Audio element:", e);
            // フォールバック: 標準の Audio オブジェクトを作成（file:// プロトコル等での回避策）
            this.bgmFallback = new Audio(url);
            this.bgmFallback.loop = true;
            this.bgmFallback.volume = 0.5;
        }
    }

    /** BGMの再生開始 */
    startBGM() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        if (this.bgmBuffer) {
            if (!this.bgmSource) {
                this.bgmSource = this.audioCtx.createBufferSource();
                this.bgmSource.buffer = this.bgmBuffer;
                this.bgmSource.loop = true;
                const gainNode = this.audioCtx.createGain();
                gainNode.gain.value = 0.5;
                this.bgmSource.connect(gainNode);
                gainNode.connect(this.audioCtx.destination);
                this.bgmSource.start(0);
                console.log("[Audio] Playing BGM via Web Audio API (Seamless).");
            }
        } else if (this.bgmFallback) {
            this.bgmFallback.play().catch(e => console.log("[Audio] Fallback playback failed:", e));
            console.log("[Audio] Playing BGM via Standard Audio (Fallback).");
        }
    }

    /** 音声の再生（インスタンスを返す） */
    playSound(fileName, pitch = 1.0) {
        if (!this.audioEnabled) return null;

        let audio = this.sounds[fileName];
        let src = audio ? audio.src : `assets/sounds/${fileName}`;

        // 未ロードの音源の場合は、new Audio して再生を試みる
        const playClone = new Audio(src);
        playClone.volume = 0.5;

        // ピッチ（再生速度）の設定
        if (pitch !== 1.0) {
            playClone.defaultPlaybackRate = pitch;
            playClone.playbackRate = pitch;

            if ('preservesPitch' in playClone) playClone.preservesPitch = false;
            if ('webkitPreservesPitch' in playClone) playClone.webkitPreservesPitch = false;
            if ('mozPreservesPitch' in playClone) playClone.mozPreservesPitch = false;
        }

        const promise = playClone.play();
        if (promise !== undefined) {
            promise.then(() => {
                if (pitch !== 1.0) {
                    playClone.playbackRate = pitch;
                }
            }).catch(e => {
                // AbortError (playリクエストが中断された) は正常な動作範囲内なので無視する
                if (e.name === 'AbortError') return;

                // ファイルが存在しないなどのエラー
                if (!audio) {
                    console.warn(`[Audio] Playback failed for unregistered sound: ${fileName}`, e);
                } else {
                    console.log("[Audio] Playback failed:", e);
                }

                // 再生失敗時も念のためリソース解放
                try {
                    playClone.src = "";
                    playClone.load();
                } catch(err) {}
            });
        }

        // メモリリーク対策: 再生終了時にリソースを明示的に解放する
        playClone.addEventListener('ended', () => {
            try {
                playClone.pause();
                playClone.src = "";
                playClone.load();
            } catch (e) {}
        }, { once: true });

        return playClone;
    }

    /** アセット定義を再帰的に探索して読み込む */
    _loadNestedAssets(node) {
        if (!node || typeof node !== 'object') return;

        // 子要素が配列（バリエーションリスト）なら、それは末端のアセットデータ群
        if (Array.isArray(node)) {
            node.forEach(data => {
                if (data.imagefile && !this.images[data.imagefile]) {
                    const img = new Image();
                    img.src = `assets/images/${data.imagefile}`;
                    this.images[data.imagefile] = img;
                    // キーでも引けるように（マッピングの互換性維持のため）
                    const key = data.imagefile.replace('.png', '');
                    this.images[key] = img;
                }
                if (data.soundfile && !this.sounds[data.soundfile]) {
                    const audio = new Audio(`assets/sounds/${data.soundfile}`);
                    this.sounds[data.soundfile] = audio;
                }
            });
            return;
        }

        // それ以外はさらに深く探索
        Object.values(node).forEach(child => this._loadNestedAssets(child));
    }

    /** 画像キャッシュから取得 */
    getImage(key) {
        return this.images[key] || null;
    }
}
