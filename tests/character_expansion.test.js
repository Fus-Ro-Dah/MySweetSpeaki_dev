import { describe, it, expect, vi, beforeEach } from 'vitest';
import { STATE } from '../config.js';
import { NPCCharacter } from '../npc-character.js';
import { BaseCharacter } from '../base-character.js';
import { Speaki } from '../speaki.js';
import { Ashur } from '../ashur.js';
import { Posher } from '../posher.js';

// Mock DOM
global.document = {
    createElement: vi.fn(() => ({
        appendChild: vi.fn(),
        classList: { add: vi.fn(), remove: vi.fn() },
        style: {},
        setAttribute: vi.fn(),
    })),
};

describe('Character Expansion Logic', () => {
    let parentElement;

    beforeEach(() => {
        parentElement = {
            appendChild: vi.fn(),
            clientWidth: 1000,
            clientHeight: 800,
        };
        global.window = {
            game: {
                addItem: vi.fn(),
                playSound: vi.fn(),
                images: {},
                speakis: [],
            },
            innerWidth: 1000,
            innerHeight: 800,
            AudioContext: vi.fn(),
        };
    });

    describe('BaseCharacter Flags', () => {
        it('should respect hasHunger=false', () => {
            const char = new BaseCharacter('test', parentElement, 100, 100, { hasHunger: false });
            const initialHunger = char.status.hunger;
            char.update(1000);
            expect(char.status.hunger).toBe(initialHunger);
        });

        it('should respect hasHunger=true (default)', () => {
            const char = new BaseCharacter('test', parentElement, 100, 100);
            const initialHunger = char.status.hunger;
            char.update(1000);
            expect(char.status.hunger).toBeLessThan(initialHunger);
        });

        it('should respect hasEmotion=false', () => {
            const char = new BaseCharacter('test', parentElement, 100, 100, { hasEmotion: false });
            char.status.friendship = -50;
            char._updateBaseEmotion();
            expect(char.status.emotion).toBe('normal');
        });
    });

    describe('NPCCharacter', () => {
        it('should have canInteract=false by default', () => {
            const npc = new NPCCharacter('npc1', parentElement, 100, 100);
            expect(npc.canInteract).toBe(false);
        });

        it('should use ABILITY_ACTION state when executing ability', () => {
            const npc = new NPCCharacter('npc1', parentElement, 100, 100);
            npc.executeAbility('test_ability', { duration: 1000 });
            expect(npc.status.state).toBe(STATE.ABILITY_ACTION);
            expect(npc.status.action).toBe('test_ability');
        });

        it('should trigger _onAbilityEffect', () => {
            const npc = new NPCCharacter('npc1', parentElement, 100, 100);
            const spy = vi.spyOn(npc, '_onAbilityEffect');
            npc.executeAbility('magic', {});
            expect(spy).toHaveBeenCalledWith('magic', {});
        });
    });

    describe('Speaki Variant', () => {
        it('should accept characterType in options', () => {
            const variant = new Speaki('variant1', parentElement, 100, 100, { characterType: 'rabbit' });
            expect(variant.characterType).toBe('rabbit');
        });
    });

    describe('Ashur specific logic', () => {
        it('should initialize as ashur type', () => {
            const ashur = new Ashur('ashur1', parentElement, 0, 0);
            expect(ashur.characterType).toBe('ashur');
        });

        it('should find hungry Speaki as target', () => {
            const ashur = new Ashur('ashur1', parentElement, 0, 0);
            const hungrySpeaki = new Speaki('hungry', parentElement, 100, 100, { hunger: 20 });
            global.window.game.speakis = [ashur, hungrySpeaki];

            const target = ashur._findHungrySpeaki();
            expect(target).toBe(hungrySpeaki);
        });

        it('should place Mocaron when rescue ability triggers', () => {
            const ashur = new Ashur('ashur1', parentElement, 100, 100);
            ashur._onAbilityEffect('place_item', { itemType: 'Mocaron' });

            expect(global.window.game.addItem).toHaveBeenCalledWith('Mocaron', 'item', 100, 120);
        });
    });

    describe('Posher specific logic', () => {
        it('should initialize as posher type', () => {
            const posher = new Posher('posher1', parentElement, 0, 0);
            expect(posher.characterType).toBe('posher');
        });

        it('should place Poteto when rescue ability triggers', () => {
            const posher = new Posher('posher1', parentElement, 100, 100);
            posher._onAbilityEffect('place_item', { itemType: 'Poteto' });

            expect(global.window.game.addItem).toHaveBeenCalledWith('Poteto', 'item', 100, 120);
        });
    });
});
