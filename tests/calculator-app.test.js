/**
 * UI State & Controller Test Suite with Mock DOM
 */

const assert = require('assert');
const { MathEvaluator, CalculatorApp } = require('../script.js');

// Mock localStorage
const localStorageStore = {};
global.localStorage = {
    getItem: (key) => localStorageStore[key] || null,
    setItem: (key, val) => { localStorageStore[key] = String(val); },
    removeItem: (key) => { delete localStorageStore[key]; },
    clear: () => { for (const k in localStorageStore) delete localStorageStore[k]; }
};

// Mock matchMedia
global.window = {
    matchMedia: () => ({ matches: false }),
    addEventListener: () => {}
};

// Mock Document and Elements
function createMockElement(id, tag = 'div') {
    return {
        id,
        tagName: tag.toUpperCase(),
        textContent: '',
        innerHTML: '',
        classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            contains(c) { return this.classes.has(c); },
            toggle(c) { if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c); }
        },
        parentElement: {
            scrollLeft: 0,
            scrollWidth: 100,
            addEventListener: () => {}
        },
        dataset: {},
        setAttribute: () => {},
        getAttribute: () => null,
        appendChild(child) { this.children = this.children || []; this.children.push(child); },
        addEventListener: () => {},
        querySelector: (sel) => createMockElement('sub-' + sel)
    };
}

const mockIds = [
    'calculator', 'expressionDisplay', 'resultDisplay', 'statusMessage',
    'memIndicator', 'angleIndicator', 'invIndicator', 'angleModeBtn',
    'angleModeText', 'btnAngleLabel', 'toggleSciBtn', 'scientificPanel',
    'keypadContainer', 'btn2nd', 'historyToggleBtn', 'historyBadge',
    'historyDrawer', 'drawerOverlay', 'historyList', 'historyEmpty',
    'clearHistoryBtn', 'closeHistoryBtn', 'themeToggleBtn', 'moonIcon',
    'sunIcon', 'toastMessage', 'btnSin', 'btnCos', 'btnTan', 'btnLn',
    'btnLog', 'btnSqrt'
];

global.document = {
    createElement(tag) {
        return createMockElement('mock-' + tag, tag);
    },
    querySelector(sel) {
        return createMockElement('mock-meta', 'meta');
    },
    getElementById(id) {
        if (!this._elements) this._elements = {};
        if (!this._elements[id]) {
            this._elements[id] = createMockElement(id);
            if (id.startsWith('btn')) {
                this._elements[id].querySelector = (sel) => createMockElement('sub', 'span');
            }
        }
        return this._elements[id];
    },
    documentElement: createMockElement('html'),
    body: createMockElement('body')
};

console.log('Testing CalculatorApp UI and State Controller...');

const app = new CalculatorApp();

// 1. Digit and operator input
app.inputDigit('9');
app.inputInsert('×');
app.inputDigit('6');
assert.strictEqual(app.expression, '9 × 6');
app.calculate();
assert.strictEqual(app.result, '54');
assert.strictEqual(app.isCalculated, true);

// 2. Continuing calculation with previous result
app.inputInsert('+');
assert.strictEqual(app.expression, '54 + ');
app.inputDigit('6');
app.calculate();
assert.strictEqual(app.result, '60');

// 3. Decimal point prevention
app.clearAll();
app.inputDigit('3');
app.inputDecimal();
app.inputDigit('1');
app.inputDigit('4');
app.inputDecimal(); // Should be rejected
assert.strictEqual(app.expression, '3.14', 'Decimal point should not duplicate');

// 4. Sign inversion
app.toggleSign();
assert.strictEqual(app.expression, '−3.14');
app.toggleSign();
assert.strictEqual(app.expression, '3.14');

// 5. Memory Operations
app.clearAll();
app.inputDigit('4');
app.inputDigit('2');
app.calculate();
app.memoryAdd();
assert.strictEqual(app.memory, 42, 'Memory should store 42');
assert.strictEqual(localStorageStore['athrav_calc_memory'], '42');

app.clearAll();
app.memoryRecall();
assert.strictEqual(app.expression, '42', 'Memory recall should load 42');

app.memorySubtract();
assert.strictEqual(app.memory, 0, 'Memory subtract 42 from 42 should equal 0');

// 6. Angle Mode Toggle
assert.strictEqual(app.angleMode, 'DEG');
app.toggleAngleMode();
assert.strictEqual(app.angleMode, 'RAD');
assert.strictEqual(localStorageStore['athrav_calc_angle'], 'RAD');
app.toggleAngleMode();
assert.strictEqual(app.angleMode, 'DEG');

// 7. Theme Toggle
app.setTheme('dark');
assert.strictEqual(app.theme, 'dark');
app.toggleTheme();
assert.strictEqual(app.theme, 'light');
assert.strictEqual(localStorageStore['athrav_calc_theme'], 'light');
app.toggleTheme();
assert.strictEqual(app.theme, 'dark');

// 8. Scientific Keypad Toggle
app.setScientificKeypad(true);
assert.strictEqual(app.isScientificOpen, true);
app.toggleScientificKeypad();
assert.strictEqual(app.isScientificOpen, false);
assert.strictEqual(localStorageStore['athrav_calc_sci'], 'false');

// 9. Keyboard Event Simulation
app.clearAll();
app.handleKeyboard({ key: '7', preventDefault: () => {} });
app.handleKeyboard({ key: '+', preventDefault: () => {} });
app.handleKeyboard({ key: '8', preventDefault: () => {} });
app.handleKeyboard({ key: 'Enter', preventDefault: () => {} });
assert.strictEqual(app.result, '15');

app.handleKeyboard({ key: 'Backspace', preventDefault: () => {} }); // Clears on isCalculated
assert.strictEqual(app.expression, '');

console.log('✓ ALL CalculatorApp Controller Tests Passed Successfully!');
