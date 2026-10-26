/**
 * Athrav Scientific Calculator
 * Precision Math Parser, Memory Registry, History Manager & UI Controller
 * Zero external runtime dependencies. No eval() or new Function().
 */

// ============================================================================
// 1. Math Evaluator (Recursive Descent Parser & Tokenizer)
// ============================================================================
class MathEvaluator {
    constructor(options = {}) {
        this.angleMode = options.angleMode || 'DEG'; // 'DEG' or 'RAD'
    }

    setAngleMode(mode) {
        if (mode === 'DEG' || mode === 'RAD') {
            this.angleMode = mode;
        }
    }

    /**
     * Tokenize raw mathematical expression string.
     */
    tokenize(expression) {
        const tokens = [];
        let i = 0;
        // Strip out whitespace
        const s = String(expression).replace(/\s+/g, '');

        while (i < s.length) {
            const ch = s[i];

            // 1. Numbers (integers, floats, leading decimals like .5)
            if (/\d/.test(ch) || (ch === '.' && i + 1 < s.length && /\d/.test(s[i + 1]))) {
                let numStr = '';
                let hasDot = false;
                while (i < s.length && (/\d/.test(s[i]) || s[i] === '.')) {
                    if (s[i] === '.') {
                        if (hasDot) {
                            throw new Error('Invalid number format: multiple decimal points');
                        }
                        hasDot = true;
                    }
                    numStr += s[i];
                    i++;
                }
                tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
                continue;
            }

            // 2. Constants and Functions
            if (/[a-zA-Z]/.test(ch) || ch === 'π' || ch === '√') {
                if (ch === 'π') {
                    tokens.push({ type: 'CONSTANT', value: Math.PI, name: 'π' });
                    i++;
                    continue;
                }
                if (ch === '√') {
                    tokens.push({ type: 'FUNCTION', name: 'sqrt' });
                    i++;
                    continue;
                }

                let word = '';
                while (i < s.length && /[a-zA-Z0-9]/.test(s[i])) {
                    word += s[i];
                    i++;
                }

                const lower = word.toLowerCase();
                if (lower === 'pi') {
                    tokens.push({ type: 'CONSTANT', value: Math.PI, name: 'π' });
                } else if (lower === 'e') {
                    tokens.push({ type: 'CONSTANT', value: Math.E, name: 'e' });
                } else if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt', 'abs'].includes(lower)) {
                    tokens.push({ type: 'FUNCTION', name: lower });
                } else {
                    throw new Error(`Unknown function or identifier: "${word}"`);
                }
                continue;
            }

            // 3. Operators
            if (ch === '+' || ch === '-' || ch === '−' || ch === '*' || ch === '×' || ch === '/' || ch === '÷' || ch === '^' || ch === '%' || ch === '!' || ch === '²') {
                let op = ch;
                if (op === '×') op = '*';
                if (op === '÷') op = '/';
                if (op === '−') op = '-';
                tokens.push({ type: 'OPERATOR', value: op });
                i++;
                continue;
            }

            // 4. Parentheses
            if (ch === '(' || ch === ')') {
                tokens.push({ type: ch === '(' ? 'LPAREN' : 'RPAREN', value: ch });
                i++;
                continue;
            }

            throw new Error(`Unexpected character: "${ch}"`);
        }

        return tokens;
    }

    /**
     * Injects implicit multiplication tokens:
     * e.g., 2(3) -> 2 * (3), (2)(3) -> (2) * (3), 2π -> 2 * π, 2sin(30) -> 2 * sin(30)
     */
    insertImplicitMultiplication(tokens) {
        const result = [];
        for (let i = 0; i < tokens.length; i++) {
            const current = tokens[i];
            result.push(current);

            if (i + 1 < tokens.length) {
                const next = tokens[i + 1];

                const isCurrentOperand =
                    current.type === 'NUMBER' ||
                    current.type === 'CONSTANT' ||
                    current.type === 'RPAREN' ||
                    (current.type === 'OPERATOR' && (current.value === '!' || current.value === '%' || current.value === '²'));

                const isNextOperand =
                    next.type === 'NUMBER' ||
                    next.type === 'CONSTANT' ||
                    next.type === 'FUNCTION' ||
                    next.type === 'LPAREN';

                if (isCurrentOperand && isNextOperand) {
                    result.push({ type: 'OPERATOR', value: '*' });
                }
            }
        }
        return result;
    }

    /**
     * Parses and safely evaluates the expression.
     */
    evaluate(expression) {
        if (!expression || String(expression).trim() === '') {
            return 0;
        }

        // Clean any trailing '='
        let cleanExpr = String(expression).trim().replace(/=+$/, '');
        const rawTokens = this.tokenize(cleanExpr);
        if (rawTokens.length === 0) return 0;

        const tokens = this.insertImplicitMultiplication(rawTokens);

        // Check parentheses balance and auto-close missing ones
        let openCount = 0;
        for (const t of tokens) {
            if (t.type === 'LPAREN') openCount++;
            if (t.type === 'RPAREN') {
                openCount--;
                if (openCount < 0) {
                    throw new Error('Mismatched parentheses: unexpected closing parenthesis');
                }
            }
        }
        while (openCount > 0) {
            tokens.push({ type: 'RPAREN', value: ')' });
            openCount--;
        }

        let pos = 0;

        function peek() {
            return tokens[pos] || null;
        }

        function consume(expectedType = null, expectedValue = null) {
            const t = tokens[pos];
            if (!t) {
                throw new Error('Incomplete expression');
            }
            if (expectedType && t.type !== expectedType) {
                throw new Error(`Expected ${expectedType} but got ${t.type}`);
            }
            if (expectedValue && t.value !== expectedValue) {
                throw new Error(`Expected ${expectedValue} but got ${t.value}`);
            }
            pos++;
            return t;
        }

        const self = this;

        // Grammar Parser
        function parseExpression() {
            return parseAddition();
        }

        function parseAddition() {
            let left = parseMultiplication();
            while (peek() && peek().type === 'OPERATOR' && (peek().value === '+' || peek().value === '-')) {
                const op = consume().value;
                const right = parseMultiplication();
                if (op === '+') {
                    left = left + right;
                } else {
                    left = left - right;
                }
            }
            return left;
        }

        function parseMultiplication() {
            let left = parsePower();
            while (peek() && peek().type === 'OPERATOR' && (peek().value === '*' || peek().value === '/')) {
                const op = consume().value;
                const right = parsePower();
                if (op === '*') {
                    left = left * right;
                } else {
                    if (right === 0) {
                        if (left === 0) throw new Error('Undefined result (0 ÷ 0)');
                        throw new Error('Cannot divide by zero');
                    }
                    left = left / right;
                }
            }
            return left;
        }

        function parsePower() {
            const left = parseUnaryPrefix();
            if (peek() && peek().type === 'OPERATOR' && peek().value === '^') {
                consume();
                const right = parsePower(); // right-associative recursion
                if (left < 0 && Math.floor(right) !== right) {
                    throw new Error('Invalid power: negative base with fractional exponent');
                }
                const result = Math.pow(left, right);
                if (isNaN(result) || !isFinite(result)) {
                    throw new Error('Math overflow or domain error in exponentiation');
                }
                return result;
            }
            return left;
        }

        function parseUnaryPrefix() {
            if (peek() && peek().type === 'OPERATOR' && (peek().value === '+' || peek().value === '-')) {
                const op = consume().value;
                const operand = parseUnaryPrefix();
                return op === '-' ? -operand : operand;
            }
            return parseUnaryPostfix();
        }

        function parseUnaryPostfix() {
            let val = parsePrimary();
            while (peek() && peek().type === 'OPERATOR' && (peek().value === '!' || peek().value === '%' || peek().value === '²')) {
                const op = consume().value;
                if (op === '!') {
                    if (val < 0 || Math.floor(val) !== val) {
                        throw new Error('Factorial only defined for non-negative integers');
                    }
                    if (val > 170) {
                        throw new Error('Factorial overflow (maximum n is 170)');
                    }
                    let res = 1;
                    for (let n = 2; n <= val; n++) {
                        res *= n;
                    }
                    val = res;
                } else if (op === '%') {
                    val = val / 100;
                } else if (op === '²') {
                    val = val * val;
                }
            }
            return val;
        }

        function parsePrimary() {
            const t = peek();
            if (!t) {
                throw new Error('Incomplete expression');
            }

            if (t.type === 'NUMBER') {
                consume();
                return t.value;
            }

            if (t.type === 'CONSTANT') {
                consume();
                return t.value;
            }

            if (t.type === 'FUNCTION') {
                const fnToken = consume();
                const fnName = fnToken.name;

                if (peek() && peek().type === 'LPAREN') {
                    consume('LPAREN');
                    const arg = parseExpression();
                    consume('RPAREN');
                    return evaluateFunction(fnName, arg);
                } else {
                    const arg = parseUnaryPrefix();
                    return evaluateFunction(fnName, arg);
                }
            }

            if (t.type === 'LPAREN') {
                consume('LPAREN');
                const val = parseExpression();
                consume('RPAREN');
                return val;
            }

            throw new Error(`Unexpected token "${t.value || t.type}"`);
        }

        function evaluateFunction(name, arg) {
            const isDeg = self.angleMode === 'DEG';
            const toRad = (deg) => (deg * Math.PI) / 180;
            const toDeg = (rad) => (rad * 180) / Math.PI;

            switch (name) {
                case 'sin': {
                    if (isDeg) {
                        if (Math.abs(arg % 180) < 1e-12) return 0;
                        if (Math.abs((arg - 90) % 360) < 1e-12) return 1;
                        if (Math.abs((arg + 90) % 360) < 1e-12) return -1;
                        if (Math.abs((arg - 30) % 360) < 1e-12 || Math.abs((arg - 150) % 360) < 1e-12) return 0.5;
                        if (Math.abs((arg + 30) % 360) < 1e-12 || Math.abs((arg + 150) % 360) < 1e-12) return -0.5;
                    }
                    const rad = isDeg ? toRad(arg) : arg;
                    const res = Math.sin(rad);
                    return Math.abs(res) < 1e-14 ? 0 : res;
                }
                case 'cos': {
                    if (isDeg) {
                        if (Math.abs((arg - 90) % 180) < 1e-12) return 0;
                        if (Math.abs(arg % 360) < 1e-12) return 1;
                        if (Math.abs((arg - 180) % 360) < 1e-12) return -1;
                        if (Math.abs((arg - 60) % 360) < 1e-12 || Math.abs((arg + 60) % 360) < 1e-12) return 0.5;
                        if (Math.abs((arg - 120) % 360) < 1e-12 || Math.abs((arg + 120) % 360) < 1e-12) return -0.5;
                    }
                    const rad = isDeg ? toRad(arg) : arg;
                    const res = Math.cos(rad);
                    return Math.abs(res) < 1e-14 ? 0 : res;
                }
                case 'tan': {
                    if (isDeg) {
                        if (Math.abs((arg - 90) % 180) < 1e-12) {
                            throw new Error('Undefined (tan vertical asymptote at 90°)');
                        }
                        if (Math.abs(arg % 180) < 1e-12) return 0;
                        if (Math.abs((arg - 45) % 180) < 1e-12) return 1;
                        if (Math.abs((arg + 45) % 180) < 1e-12) return -1;
                        return Math.tan(toRad(arg));
                    }
                    const cosVal = Math.cos(arg);
                    if (Math.abs(cosVal) < 1e-14) {
                        throw new Error('Undefined (tan vertical asymptote)');
                    }
                    return Math.tan(arg);
                }
                case 'asin': {
                    if (arg < -1 || arg > 1) {
                        throw new Error('Invalid domain: asin input must be between -1 and 1');
                    }
                    const rad = Math.asin(arg);
                    return isDeg ? toDeg(rad) : rad;
                }
                case 'acos': {
                    if (arg < -1 || arg > 1) {
                        throw new Error('Invalid domain: acos input must be between -1 and 1');
                    }
                    const rad = Math.acos(arg);
                    return isDeg ? toDeg(rad) : rad;
                }
                case 'atan': {
                    const rad = Math.atan(arg);
                    return isDeg ? toDeg(rad) : rad;
                }
                case 'sqrt': {
                    if (arg < 0) {
                        throw new Error('Invalid domain: square root of negative number');
                    }
                    return Math.sqrt(arg);
                }
                case 'log': {
                    if (arg <= 0) {
                        throw new Error('Invalid domain: log requires positive number');
                    }
                    return Math.log10(arg);
                }
                case 'ln': {
                    if (arg <= 0) {
                        throw new Error('Invalid domain: ln requires positive number');
                    }
                    return Math.log(arg);
                }
                case 'abs': {
                    return Math.abs(arg);
                }
                default:
                    throw new Error(`Unsupported function: ${name}`);
            }
        }

        const result = parseExpression();

        if (pos < tokens.length) {
            throw new Error(`Unexpected token after expression: "${tokens[pos].value || tokens[pos].type}"`);
        }

        if (isNaN(result) || !isFinite(result)) {
            throw new Error('Calculation error: result is not a finite number');
        }

        return result;
    }

    /**
     * Clean floating point inaccuracies (e.g., 0.1 + 0.2 = 0.3)
     */
    static formatResult(val) {
        if (typeof val !== 'number' || isNaN(val)) return 'Error';
        if (!isFinite(val)) return val > 0 ? 'Infinity' : '-Infinity';

        // Check if close to integer
        if (Math.abs(val - Math.round(val)) < 1e-12) {
            return String(Math.round(val));
        }

        // Handle very large or very small scientific numbers
        const abs = Math.abs(val);
        if (abs >= 1e14 || (abs > 0 && abs < 1e-7)) {
            const expStr = val.toExponential(8);
            return expStr.replace(/\.?0+e/, 'e');
        }

        // Standard decimal with precision cleanup
        const fixed = parseFloat(val.toFixed(10));
        return String(fixed);
    }
}

// ============================================================================
// 2. Calculator UI & State Controller
// ============================================================================
class CalculatorApp {
    constructor() {
        this.evaluator = new MathEvaluator({ angleMode: 'DEG' });

        // State
        this.expression = '';
        this.result = '0';
        this.isCalculated = false;
        this.angleMode = 'DEG';
        this.is2ndActive = false;
        this.isScientificOpen = true;
        this.memory = 0;
        this.history = [];
        this.theme = 'dark';

        // Cache DOM elements
        this.elements = {};
        this.initDOM();
        this.loadState();
        this.bindEvents();
        this.updateDisplay();
        this.updateKeypadLabels();
    }

    initDOM() {
        this.elements = {
            expressionDisplay: document.getElementById('expressionDisplay'),
            resultDisplay: document.getElementById('resultDisplay'),
            statusMessage: document.getElementById('statusMessage'),
            memIndicator: document.getElementById('memIndicator'),
            angleIndicator: document.getElementById('angleIndicator'),
            invIndicator: document.getElementById('invIndicator'),
            angleModeBtn: document.getElementById('angleModeBtn'),
            angleModeText: document.getElementById('angleModeText'),
            btnAngleLabel: document.getElementById('btnAngleLabel'),
            toggleSciBtn: document.getElementById('toggleSciBtn'),
            scientificPanel: document.getElementById('scientificPanel'),
            keypadContainer: document.getElementById('keypadContainer'),
            btn2nd: document.getElementById('btn2nd'),
            historyToggleBtn: document.getElementById('historyToggleBtn'),
            historyBadge: document.getElementById('historyBadge'),
            historyDrawer: document.getElementById('historyDrawer'),
            drawerOverlay: document.getElementById('drawerOverlay'),
            historyList: document.getElementById('historyList'),
            historyEmpty: document.getElementById('historyEmpty'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            closeHistoryBtn: document.getElementById('closeHistoryBtn'),
            themeToggleBtn: document.getElementById('themeToggleBtn'),
            moonIcon: document.getElementById('moonIcon'),
            sunIcon: document.getElementById('sunIcon'),
            toastMessage: document.getElementById('toastMessage')
        };
    }

    loadState() {
        // Theme
        const savedTheme = localStorage.getItem('athrav_calc_theme');
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            this.setTheme('light');
        } else {
            this.setTheme('dark');
        }

        // Angle mode
        const savedAngle = localStorage.getItem('athrav_calc_angle');
        if (savedAngle === 'RAD' || savedAngle === 'DEG') {
            this.setAngleMode(savedAngle);
        }

        // Memory
        const savedMemory = parseFloat(localStorage.getItem('athrav_calc_memory'));
        if (!isNaN(savedMemory) && savedMemory !== 0) {
            this.memory = savedMemory;
            this.elements.memIndicator.classList.remove('hidden');
        }

        // Scientific keypad preference (default open)
        const savedSci = localStorage.getItem('athrav_calc_sci');
        if (savedSci !== null) {
            this.setScientificKeypad(savedSci === 'true');
        } else {
            this.setScientificKeypad(true);
        }

        // History
        try {
            const savedHistory = JSON.parse(localStorage.getItem('athrav_calc_history'));
            if (Array.isArray(savedHistory)) {
                this.history = savedHistory;
            }
        } catch {
            this.history = [];
        }
        this.renderHistory();
    }

    bindEvents() {
        // Click events on calculator container using event delegation
        document.getElementById('calculator').addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            // Digits
            if (btn.dataset.digit !== undefined) {
                this.inputDigit(btn.dataset.digit);
                return;
            }

            // Insert operators/functions
            if (btn.dataset.insert !== undefined) {
                this.inputInsert(btn.dataset.insert);
                return;
            }

            // Action buttons
            if (btn.dataset.action !== undefined) {
                this.handleAction(btn.dataset.action);
                return;
            }
        });

        // Header controls
        this.elements.angleModeBtn.addEventListener('click', () => this.toggleAngleMode());
        this.elements.toggleSciBtn.addEventListener('click', () => this.toggleScientificKeypad());
        this.elements.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

        // History drawer controls
        this.elements.historyToggleBtn.addEventListener('click', () => this.openHistory());
        this.elements.closeHistoryBtn.addEventListener('click', () => this.closeHistory());
        this.elements.drawerOverlay.addEventListener('click', () => this.closeHistory());
        this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

        // Click on displays to copy
        this.elements.expressionDisplay.parentElement.addEventListener('click', () => {
            if (this.expression) {
                this.copyToClipboard(this.expression, 'Expression copied');
            }
        });
        this.elements.resultDisplay.parentElement.addEventListener('click', () => {
            if (this.result && this.result !== 'Error') {
                this.copyToClipboard(this.result, 'Result copied');
            }
        });

        // Global keyboard support
        window.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // ========================================================================
    // 3. User Input Logic & Validation
    // ========================================================================

    inputDigit(digit) {
        this.clearStatus();

        if (this.isCalculated) {
            // Start fresh equation
            this.expression = digit;
            this.result = digit;
            this.isCalculated = false;
        } else {
            if (this.expression === '0') {
                this.expression = digit;
            } else {
                this.expression += digit;
            }
            this.result = this.expression;
        }

        this.updateDisplay();
    }

    inputInsert(text) {
        this.clearStatus();

        // 2nd Mode inverse substitutions
        if (this.is2ndActive) {
            if (text === 'sin(') text = 'asin(';
            else if (text === 'cos(') text = 'acos(';
            else if (text === 'tan(') text = 'atan(';
            else if (text === 'ln(') text = 'e^(';
            else if (text === 'log(') text = '10^(';
            else if (text === '√(') text = 'abs(';
        }

        // If user enters an operator right after a calculation, continue with previous result
        if (this.isCalculated) {
            const isBinaryOp = ['+', '−', '×', '÷', '^', '%', '²'].includes(text);
            if (isBinaryOp && this.result !== 'Error') {
                this.expression = this.result + ' ' + text + ' ';
            } else {
                this.expression = text;
            }
            this.isCalculated = false;
            this.updateDisplay();
            return;
        }

        // Prevent invalid double operators while allowing unary minus
        const isOperator = ['+', '−', '×', '÷', '^'].includes(text);
        if (isOperator) {
            // Trim trailing space if present
            let expr = this.expression.trim();
            const lastChar = expr.slice(-1);

            if (['+', '−', '×', '÷', '^'].includes(lastChar)) {
                // Allow unary minus after multiply or divide e.g. "5 × −"
                if (text === '−' && (lastChar === '×' || lastChar === '÷' || lastChar === '^')) {
                    this.expression = expr + ' − ';
                    this.updateDisplay();
                    return;
                }
                // Replace previous operator
                this.expression = expr.slice(0, -1).trim() + ' ' + text + ' ';
                this.updateDisplay();
                return;
            }
            this.expression += ' ' + text + ' ';
            this.updateDisplay();
            return;
        }

        // Append token
        this.expression += text;
        this.updateDisplay();
    }

    handleAction(action) {
        this.clearStatus();

        switch (action) {
            case 'clear':
                this.clearAll();
                break;
            case 'delete':
                this.deleteLast();
                break;
            case 'decimal':
                this.inputDecimal();
                break;
            case 'sign':
                this.toggleSign();
                break;
            case 'calculate':
                this.calculate();
                break;
            case 'toggle-2nd':
                this.toggle2nd();
                break;
            case 'toggle-deg':
                this.toggleAngleMode();
                break;
            case 'reciprocal':
                this.inputReciprocal();
                break;
            case 'mem-clear':
                this.memoryClear();
                break;
            case 'mem-recall':
                this.memoryRecall();
                break;
            case 'mem-add':
                this.memoryAdd();
                break;
            case 'mem-sub':
                this.memorySubtract();
                break;
            default:
                break;
        }
    }

    inputDecimal() {
        if (this.isCalculated) {
            this.expression = '0.';
            this.result = '0.';
            this.isCalculated = false;
            this.updateDisplay();
            return;
        }

        // Check if current number token already contains a decimal point
        const match = this.expression.match(/([0-9.]*)$/);
        const currentToken = match ? match[1] : '';

        if (currentToken.includes('.')) {
            this.showStatus('Decimal already entered', true);
            return;
        }

        if (!currentToken || currentToken.length === 0) {
            // If empty or follows an operator / space / open paren
            const last = this.expression.trim().slice(-1);
            if (!last || ['+', '−', '×', '÷', '^', '('].includes(last)) {
                this.expression += '0.';
            } else {
                this.expression += '.';
            }
        } else {
            this.expression += '.';
        }

        this.updateDisplay();
    }

    toggleSign() {
        if (this.isCalculated && this.result !== 'Error') {
            const num = parseFloat(this.result);
            if (!isNaN(num)) {
                const toggled = -num;
                this.result = MathEvaluator.formatResult(toggled);
                this.expression = this.result;
                this.updateDisplay();
            }
            return;
        }

        if (!this.expression || this.expression === '0') {
            this.expression = '−';
            this.updateDisplay();
            return;
        }

        // Pattern 1: ends in (-X)
        const negParenRegex = /\(\s*[−-]\s*([0-9.]+|π|e)\s*\)$/;
        if (negParenRegex.test(this.expression)) {
            this.expression = this.expression.replace(negParenRegex, '$1');
            this.updateDisplay();
            return;
        }

        // Pattern 2: starts with a lone -
        if (/^[−-]\s*([0-9.]+|π|e)$/.test(this.expression)) {
            this.expression = this.expression.replace(/^[−-]\s*/, '');
            this.updateDisplay();
            return;
        }

        // Pattern 3: ends in operator then number e.g. "10 + 5" -> "10 + (−5)"
        const opNumRegex = /([+\-−×*÷/^]\s*)([0-9.]+|π|e)$/;
        if (opNumRegex.test(this.expression)) {
            this.expression = this.expression.replace(opNumRegex, '$1(−$2)');
            this.updateDisplay();
            return;
        }

        // Pattern 4: just a positive number at start e.g. "42" -> "−42"
        if (/^([0-9.]+|π|e)$/.test(this.expression)) {
            this.expression = '−' + this.expression;
            this.updateDisplay();
            return;
        }

        // Fallback: wrap in −()
        this.expression = `−(${this.expression})`;
        this.updateDisplay();
    }

    inputReciprocal() {
        if (this.isCalculated && this.result !== 'Error') {
            this.expression = `(1 / ${this.result})`;
            this.isCalculated = false;
            this.calculate();
            return;
        }

        if (!this.expression || this.expression === '0') {
            this.expression = '(1 / ';
        } else {
            this.expression = `(1 / (${this.expression}))`;
        }
        this.updateDisplay();
    }

    clearAll() {
        this.expression = '';
        this.result = '0';
        this.isCalculated = false;
        this.clearStatus();
        this.updateDisplay();
    }

    deleteLast() {
        if (this.isCalculated) {
            this.clearAll();
            return;
        }

        if (!this.expression || this.expression.length === 0) {
            this.result = '0';
            this.updateDisplay();
            return;
        }

        // Delete multi-character function tokens cleanly
        const fnPattern = /(asin\(|acos\(|atan\(|sin\(|cos\(|tan\(|log\(|ln\(|sqrt\(|abs\(|10\^\(|e\^\(|√\(| \(−\)| \(-\))$/;
        if (fnPattern.test(this.expression)) {
            this.expression = this.expression.replace(fnPattern, '');
        } else {
            // Trim space if trailing
            let expr = this.expression.trimEnd();
            this.expression = expr.slice(0, -1);
        }

        this.updateDisplay();
    }

    calculate() {
        if (!this.expression || this.expression.trim() === '') {
            return;
        }

        try {
            const rawVal = this.evaluator.evaluate(this.expression);
            const formatted = MathEvaluator.formatResult(rawVal);

            // Record history
            const historyEntry = {
                id: Date.now() + Math.random().toString(36).substr(2, 4),
                expression: this.expression,
                result: formatted,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            this.saveHistory(historyEntry);

            this.result = formatted;
            this.expression = this.expression + ' =';
            this.isCalculated = true;
            this.updateDisplay();
        } catch (err) {
            this.showStatus(err.message || 'Syntax Error', true);
            this.result = 'Error';
            this.updateDisplay();
        }
    }

    // ========================================================================
    // 4. Memory Registry Operations
    // ========================================================================

    memoryClear() {
        this.memory = 0;
        localStorage.removeItem('athrav_calc_memory');
        this.elements.memIndicator.classList.add('hidden');
        this.showToast('Memory Cleared');
        this.showStatus('Memory = 0', false);
    }

    memoryRecall() {
        if (this.memory === 0) {
            this.showStatus('Memory is empty', false);
            return;
        }
        const memStr = MathEvaluator.formatResult(this.memory);
        if (this.isCalculated || !this.expression || this.expression === '0') {
            this.expression = memStr;
            this.result = memStr;
            this.isCalculated = false;
        } else {
            this.expression += memStr;
        }
        this.showToast(`Recalled Memory: ${memStr}`);
        this.updateDisplay();
    }

    memoryAdd() {
        const val = this.getCurrentNumericValue();
        if (val === null) return;

        this.memory += val;
        localStorage.setItem('athrav_calc_memory', String(this.memory));
        this.elements.memIndicator.classList.remove('hidden');
        this.showToast(`M+ (${MathEvaluator.formatResult(this.memory)})`);
        this.showStatus(`Memory = ${MathEvaluator.formatResult(this.memory)}`, false);
    }

    memorySubtract() {
        const val = this.getCurrentNumericValue();
        if (val === null) return;

        this.memory -= val;
        localStorage.setItem('athrav_calc_memory', String(this.memory));
        this.elements.memIndicator.classList.remove('hidden');
        this.showToast(`M− (${MathEvaluator.formatResult(this.memory)})`);
        this.showStatus(`Memory = ${MathEvaluator.formatResult(this.memory)}`, false);
    }

    getCurrentNumericValue() {
        try {
            let val;
            if (this.isCalculated && this.result !== 'Error') {
                val = parseFloat(this.result);
            } else if (this.expression) {
                val = this.evaluator.evaluate(this.expression);
            } else {
                val = 0;
            }
            if (isNaN(val) || !isFinite(val)) {
                this.showStatus('Cannot store invalid value in memory', true);
                return null;
            }
            return val;
        } catch (err) {
            this.showStatus(err.message || 'Calculation error', true);
            return null;
        }
    }

    // ========================================================================
    // 5. Scientific Modifiers & Modes
    // ========================================================================

    toggle2nd() {
        this.is2ndActive = !this.is2ndActive;
        if (this.is2ndActive) {
            this.elements.btn2nd.classList.add('active');
            this.elements.invIndicator.classList.remove('hidden');
            this.elements.scientificPanel.classList.add('is-inverse');
        } else {
            this.elements.btn2nd.classList.remove('active');
            this.elements.invIndicator.classList.add('hidden');
            this.elements.scientificPanel.classList.remove('is-inverse');
        }
        this.updateKeypadLabels();
    }

    updateKeypadLabels() {
        const sinBtn = document.getElementById('btnSin');
        const cosBtn = document.getElementById('btnCos');
        const tanBtn = document.getElementById('btnTan');
        const lnBtn = document.getElementById('btnLn');
        const logBtn = document.getElementById('btnLog');
        const sqrtBtn = document.getElementById('btnSqrt');

        if (this.is2ndActive) {
            if (sinBtn) sinBtn.querySelector('.primary-label').textContent = 'sin⁻¹';
            if (cosBtn) cosBtn.querySelector('.primary-label').textContent = 'cos⁻¹';
            if (tanBtn) tanBtn.querySelector('.primary-label').textContent = 'tan⁻¹';
            if (lnBtn) lnBtn.querySelector('.primary-label').textContent = 'eˣ';
            if (logBtn) logBtn.querySelector('.primary-label').textContent = '10ˣ';
            if (sqrtBtn) sqrtBtn.querySelector('.primary-label').textContent = '|x|';
        } else {
            if (sinBtn) sinBtn.querySelector('.primary-label').textContent = 'sin';
            if (cosBtn) cosBtn.querySelector('.primary-label').textContent = 'cos';
            if (tanBtn) tanBtn.querySelector('.primary-label').textContent = 'tan';
            if (lnBtn) lnBtn.querySelector('.primary-label').textContent = 'ln';
            if (logBtn) logBtn.querySelector('.primary-label').textContent = 'log';
            if (sqrtBtn) sqrtBtn.querySelector('.primary-label').textContent = '√';
        }
    }

    toggleAngleMode() {
        const nextMode = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
        this.setAngleMode(nextMode);
        this.showToast(`Angle Mode: ${nextMode}`);
    }

    setAngleMode(mode) {
        this.angleMode = mode;
        this.evaluator.setAngleMode(mode);
        this.elements.angleModeText.textContent = mode;
        this.elements.angleIndicator.textContent = mode;
        this.elements.btnAngleLabel.textContent = mode === 'DEG' ? 'rad' : 'deg';
        this.elements.angleModeBtn.setAttribute('aria-label', `Angle mode: ${mode}. Click to toggle.`);
        localStorage.setItem('athrav_calc_angle', mode);
    }

    toggleScientificKeypad() {
        this.setScientificKeypad(!this.isScientificOpen);
    }

    setScientificKeypad(isOpen) {
        this.isScientificOpen = isOpen;
        localStorage.setItem('athrav_calc_sci', String(isOpen));

        if (isOpen) {
            this.elements.scientificPanel.classList.remove('collapsed');
            this.elements.toggleSciBtn.classList.add('active');
            this.elements.toggleSciBtn.setAttribute('aria-expanded', 'true');
            this.elements.keypadContainer.classList.add('with-scientific');
        } else {
            this.elements.scientificPanel.classList.add('collapsed');
            this.elements.toggleSciBtn.classList.remove('active');
            this.elements.toggleSciBtn.setAttribute('aria-expanded', 'false');
            this.elements.keypadContainer.classList.remove('with-scientific');
        }
    }

    // ========================================================================
    // 6. Calculation History System
    // ========================================================================

    saveHistory(entry) {
        this.history.unshift(entry);
        if (this.history.length > 50) {
            this.history.pop();
        }
        localStorage.setItem('athrav_calc_history', JSON.stringify(this.history));
        this.renderHistory();
    }

    renderHistory() {
        const count = this.history.length;
        this.elements.historyBadge.textContent = count;
        this.elements.historyBadge.setAttribute('aria-label', `${count} items in history`);

        if (count === 0) {
            this.elements.historyEmpty.classList.remove('hidden');
            this.elements.historyList.innerHTML = '';
            return;
        }

        this.elements.historyEmpty.classList.add('hidden');
        this.elements.historyList.innerHTML = '';

        this.history.forEach((item) => {
            const li = document.createElement('li');
            li.className = 'history-item';

            li.innerHTML = `
                <div class="history-item-top">
                    <span class="history-timestamp">${item.timestamp || ''}</span>
                    <button class="history-delete-btn" aria-label="Delete entry" title="Delete">✕</button>
                </div>
                <button class="history-expr-btn" title="Click to use expression">${this.escapeHTML(item.expression)}</button>
                <button class="history-result-btn" title="Click to insert result">= ${this.escapeHTML(item.result)}</button>
            `;

            // Click expression -> restore to display
            li.querySelector('.history-expr-btn').addEventListener('click', () => {
                this.expression = item.expression.replace(/=+$/, '').trim();
                this.result = item.result;
                this.isCalculated = false;
                this.updateDisplay();
                this.closeHistory();
                this.showToast('Expression loaded');
            });

            // Click result -> insert result
            li.querySelector('.history-result-btn').addEventListener('click', () => {
                if (this.isCalculated || !this.expression || this.expression === '0') {
                    this.expression = item.result;
                    this.result = item.result;
                    this.isCalculated = false;
                } else {
                    this.expression += item.result;
                }
                this.updateDisplay();
                this.closeHistory();
                this.showToast('Result inserted');
            });

            // Delete individual entry
            li.querySelector('.history-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteHistoryItem(item.id);
            });

            this.elements.historyList.appendChild(li);
        });
    }

    deleteHistoryItem(id) {
        this.history = this.history.filter((item) => item.id !== id);
        localStorage.setItem('athrav_calc_history', JSON.stringify(this.history));
        this.renderHistory();
    }

    clearHistory() {
        if (this.history.length === 0) return;
        this.history = [];
        localStorage.removeItem('athrav_calc_history');
        this.renderHistory();
        this.showToast('History Cleared');
    }

    openHistory() {
        this.elements.historyDrawer.classList.add('open');
        this.elements.historyDrawer.setAttribute('aria-hidden', 'false');
        this.elements.drawerOverlay.classList.add('active');
        this.elements.drawerOverlay.setAttribute('aria-hidden', 'false');
    }

    closeHistory() {
        this.elements.historyDrawer.classList.remove('open');
        this.elements.historyDrawer.setAttribute('aria-hidden', 'true');
        this.elements.drawerOverlay.classList.remove('active');
        this.elements.drawerOverlay.setAttribute('aria-hidden', 'true');
    }

    // ========================================================================
    // 7. Theme Management
    // ========================================================================

    toggleTheme() {
        const newTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        this.showToast(`Theme: ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)}`);
    }

    setTheme(theme) {
        this.theme = theme;
        localStorage.setItem('athrav_calc_theme', theme);
        document.documentElement.setAttribute('data-theme', theme);

        if (theme === 'light') {
            document.body.classList.remove('dark');
            document.body.classList.add('light');
            this.elements.moonIcon.classList.add('hidden');
            this.elements.sunIcon.classList.remove('hidden');
            const metaTheme = document.querySelector ? document.querySelector('meta[name="theme-color"]') : null;
            if (metaTheme && metaTheme.setAttribute) metaTheme.setAttribute('content', '#f6f1e9');
        } else {
            document.body.classList.remove('light');
            document.body.classList.add('dark');
            this.elements.moonIcon.classList.remove('hidden');
            this.elements.sunIcon.classList.add('hidden');
            const metaTheme = document.querySelector ? document.querySelector('meta[name="theme-color"]') : null;
            if (metaTheme && metaTheme.setAttribute) metaTheme.setAttribute('content', '#121316');
        }
    }

    // ========================================================================
    // 8. Keyboard Shortcuts & Event Routing
    // ========================================================================

    handleKeyboard(e) {
        // Prevent interfering if an input or editable field is active
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
            return;
        }

        let handled = false;
        const key = e.key;

        // Digits
        if (key >= '0' && key <= '9') {
            this.inputDigit(key);
            handled = true;
        } else if (key === '.') {
            this.inputDecimal();
            handled = true;
        } else if (key === '+' || key === '-') {
            this.inputInsert(key === '-' ? '−' : '+');
            handled = true;
        } else if (key === '*' || key === 'x' || key === 'X') {
            this.inputInsert('×');
            handled = true;
        } else if (key === '/') {
            this.inputInsert('÷');
            handled = true;
        } else if (key === '%' || key === '^' || key === '!') {
            this.inputInsert(key);
            handled = true;
        } else if (key === '(' || key === ')') {
            this.inputInsert(key);
            handled = true;
        } else if (key === 'Enter' || key === '=') {
            this.calculate();
            handled = true;
        } else if (key === 'Backspace') {
            this.deleteLast();
            handled = true;
        } else if (key === 'Escape' || key === 'Delete') {
            this.clearAll();
            handled = true;
        } else if (key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
            this.clearAll();
            handled = true;
        } else if (key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey) {
            if (this.elements.historyDrawer.classList.contains('open')) {
                this.closeHistory();
            } else {
                this.openHistory();
            }
            handled = true;
        } else if (key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
            this.toggleTheme();
            handled = true;
        } else if (key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey) {
            this.inputInsert('π');
            handled = true;
        } else if (key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey) {
            this.inputInsert('e');
            handled = true;
        } else if (key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
            this.inputInsert('sin(');
            handled = true;
        }

        if (handled) {
            e.preventDefault();
            // Blur currently focused button to prevent duplicate activations on Enter
            if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
                document.activeElement.blur();
            }
        }
    }

    // ========================================================================
    // 9. Display & Notification Helpers
    // ========================================================================

    updateDisplay() {
        this.elements.expressionDisplay.textContent = this.expression || '';
        this.elements.resultDisplay.textContent = this.result || '0';

        // Auto-scroll expression display to the end
        this.elements.expressionDisplay.parentElement.scrollLeft =
            this.elements.expressionDisplay.parentElement.scrollWidth;

        // Auto-scale font size if result is long
        const resultLen = (this.result || '').length;
        this.elements.resultDisplay.classList.remove('size-medium', 'size-small');
        if (resultLen > 14) {
            this.elements.resultDisplay.classList.add('size-small');
        } else if (resultLen > 9) {
            this.elements.resultDisplay.classList.add('size-medium');
        }
    }

    showStatus(msg, isError = false) {
        const el = this.elements.statusMessage;
        el.textContent = msg;
        el.classList.remove('is-error', 'is-success');
        if (isError) {
            el.classList.add('is-error');
        } else {
            el.classList.add('is-success');
        }

        if (this._statusTimer) clearTimeout(this._statusTimer);
        this._statusTimer = setTimeout(() => {
            el.textContent = '';
            el.classList.remove('is-error', 'is-success');
        }, 4000);
    }

    clearStatus() {
        if (this._statusTimer) clearTimeout(this._statusTimer);
        this.elements.statusMessage.textContent = '';
        this.elements.statusMessage.classList.remove('is-error', 'is-success');
    }

    showToast(message) {
        const toast = this.elements.toastMessage;
        toast.textContent = message;
        toast.classList.add('show');
        toast.setAttribute('aria-hidden', 'false');

        if (this._toastTimer) clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.classList.remove('show');
            toast.setAttribute('aria-hidden', 'true');
        }, 2500);
    }

    copyToClipboard(text, successToast = 'Copied to clipboard') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(
                () => this.showToast(successToast),
                () => this.fallbackCopy(text, successToast)
            );
        } else {
            this.fallbackCopy(text, successToast);
        }
    }

    fallbackCopy(text, successToast) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            this.showToast(successToast);
        } catch {
            this.showStatus('Could not copy to clipboard', true);
        }
        document.body.removeChild(ta);
    }

    escapeHTML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

// Initialize on DOM load in browser environment
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.calculatorApp = new CalculatorApp();
    });
}

// Module export for Node.js unit tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MathEvaluator, CalculatorApp };
}
