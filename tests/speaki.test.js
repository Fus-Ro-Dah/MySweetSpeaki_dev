import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Speaki } from '../speaki.js';
import { STATE } from '../config.js';

describe('Speaki Character Logic', () => {
    let speaki;
    let mockParent;

    beforeEach(() => {
        // Mock global window and game
        global.window = {
            game: {
                highlightedCharId: null,
                images: {},
                playSound: vi.fn(),
                lastGiftTime: Date.now(),
                giftPartner: null,
                speakis: [] // Add this to fix the error in _checkSocialInteractions
            },
            innerWidth: 1200,
            innerHeight: 800
        };

        // Mock parentElement
        mockParent = {
            appendChild: vi.fn(),
            clientWidth: 1200,
            clientHeight: 800
        };

        speaki = new Speaki(1, mockParent, 100, 100, {
            hunger: 50,
            friendship: 0
        });

        // Add to mock list AFTER creation if needed
        global.window.game.speakis.push(speaki);
    });

    it('should initialize with correct status', () => {
        expect(speaki.status.hunger).toBe(50);
        expect(speaki.status.state).toBe(STATE.IDLE);
    });

    it('should decrease hunger over time', () => {
        const initialHunger = speaki.status.hunger;
        // dt is in ms. hunger decrease is dt / 5000 in update()
        // DT = 5000 -> 5000/5000 = 1
        speaki.update(5000);
        // 浮動小数点の誤差を考慮して toBeCloseTo を使うか、正確な計算値を期待する
        expect(speaki.status.hunger).toBe(initialHunger - 1);
    });

    it('should transition to IDLE if hunger is 0 and walking', () => {
        speaki.status.hunger = 0;
        speaki.status.state = STATE.WALKING;

        speaki._updateStateTransition();

        expect(speaki.status.state).toBe(STATE.IDLE);
    });

    it('should set sad emotion when starving', () => {
        speaki.status.hunger = 0;
        // updateAppearanceByStatus inside update
        speaki.update(16);

        expect(speaki.status.emotion).toBe('sad');
    });

    it('should transition from IDLE to WALKING after waitDuration', () => {
        speaki.status.state = STATE.IDLE;
        speaki.timers.stateStart = Date.now() - 10000;
        speaki.timers.waitDuration = 5000;
        speaki._updateStateTransition();
        expect(speaki.status.state).toBe(STATE.WALKING);
    });

    it('should set sad emotion and maintain ITEM_ACTION if food is gone when character arrives', () => {
        const mockItem = { id: 'Candy', consume: vi.fn(), x: 200, y: 200 };
        // window.game.placedItems does NOT contain mockItem (others ate it)
        global.window.game.placedItems = [];

        // 接近中に「到着」したと仮定
        speaki.status.state = STATE.ITEM_ACTION;
        speaki.status.friendship = 0;

        speaki._performItemAction(mockItem);

        // ITEM_ACTION のまま、アイテムIDをアクションに持ち、悲しい顔をする
        expect(speaki.status.emotion).toBe('sad');
        expect(speaki.status.action).toBe('Candy');
        expect(speaki.status.state).toBe(STATE.ITEM_ACTION);
    });

    it('should set happy emotion and decrease hunger if food is eaten successfully', () => {
        const mockItem = { id: 'Candy', consume: vi.fn(() => true), x: 200, y: 200 };
        global.window.game.placedItems = [mockItem];

        speaki.status.hunger = 50;
        speaki.status.friendship = 50; // Ensure BaseCharacter defaults to 'happy'
        speaki.status.state = STATE.ITEM_APPROACHING;
        speaki._performItemAction(mockItem);

        expect(speaki.status.emotion).toBe('happy');
        expect(speaki.status.hunger).toBeGreaterThan(50);
        expect(global.window.game.placedItems.length).toBe(0);
    });

    it('should not consume item and set emotion to ITEM if non-food item is interacted with', () => {
        const mockItem = { id: 'LeviDriver', consume: vi.fn(), x: 200, y: 200 };
        global.window.game.placedItems = [mockItem];

        speaki.status.hunger = 50;
        speaki.status.state = STATE.ITEM_APPROACHING;
        speaki._performItemAction(mockItem);

        expect(speaki.status.hunger).toBe(50); // Hunger not changed
        expect(global.window.game.placedItems.length).toBe(1); // Not consumed
        // _performItemAction stays in emotion 'ITEM' for non-food items
        expect(speaki.status.emotion).toBe('ITEM');
    });
});
