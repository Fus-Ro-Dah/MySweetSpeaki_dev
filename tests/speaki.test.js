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
        // timers.stateStart is set in constructor to Date.now()
        // We need to manipulate it or use fake timers
        speaki.timers.stateStart = Date.now() - 10000; // 10 seconds ago
        speaki.timers.waitDuration = 5000;

        speaki._updateStateTransition();

        expect(speaki.status.state).toBe(STATE.WALKING);
    });
});
