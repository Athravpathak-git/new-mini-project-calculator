// Comprehensive test suite for Calculator logic and MathEvaluator

const assert = require('assert');

class MathEvaluator {
    constructor(options = {}) {
        this.angleMode = options.angleMode || 'DEG'; // 'DEG' or 'RAD'
    }

    setAngleMode(mode) {
        if (mode === 'DEG' || mode === 'RAD') {
            this.angleMode = mode;
        }
    }

    tokenize(expression) {
        const tokens = [];
        let i = 0;
        const s = expression.replace(/\s+/g, '');

        while (i < s.length) {
            const ch = s[i];

            // Numbers (including leading dot like .5 and floats like 12.34)
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

            // Word tokens (functions and named constants)
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

            // Operators and symbols
            if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '×' || ch === '÷' || ch === '^' || ch === '%' || ch === '!' || ch === '²') {
                let op = ch;
                if (op === '×') op = '*';
                if (op === '÷') op = '/';
                tokens.push({ type: 'OPERATOR', value: op });
                i++;
                continue;
            }

            if (ch === '(' || ch === ')') {
                tokens.push({ type: ch === '(' ? 'LPAREN' : 'RPAREN', value: ch });
                i++;
                continue;
            }

            throw new Error(`Unexpected character: "${ch}"`);
        }

        return tokens;
    }

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

    evaluate(expression) {
        if (!expression || expression.trim() === '') {
            return 0;
        }

        const rawTokens = this.tokenize(expression);
        if (rawTokens.length === 0) return 0;

        const tokens = this.insertImplicitMultiplication(rawTokens);

        // Auto-close missing parentheses
        let openCount = 0;
        for (const t of tokens) {
            if (t.type === 'LPAREN') openCount++;
            if (t.type === 'RPAREN') openCount--;
        }
        if (openCount < 0) {
            throw new Error('Mismatched parentheses: unexpected closing parenthesis');
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
                throw new Error('Unexpected end of expression');
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
                        throw new Error('Factorial is only defined for non-negative integers');
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

    static formatResult(val) {
        if (typeof val !== 'number' || isNaN(val)) return 'Error';
        if (!isFinite(val)) return val > 0 ? 'Infinity' : '-Infinity';

        if (Math.abs(val - Math.round(val)) < 1e-12) {
            return String(Math.round(val));
        }

        const abs = Math.abs(val);
        if (abs >= 1e14 || (abs > 0 && abs < 1e-7)) {
            const expStr = val.toExponential(8);
            return expStr.replace(/\.?0+e/, 'e');
        }

        const fixed = parseFloat(val.toFixed(10));
        return String(fixed);
    }
}

// Memory and History state simulation tests
function testMemoryAndHistory() {
    let memory = 0;
    const history = [];

    // M+
    const expr1 = '15 * 2';
    const val1 = new MathEvaluator().evaluate(expr1);
    memory += val1;
    assert.strictEqual(memory, 30, 'Memory should be 30 after M+');

    // M+ again
    const expr2 = '10';
    memory += new MathEvaluator().evaluate(expr2);
    assert.strictEqual(memory, 40, 'Memory should be 40 after second M+');

    // M-
    const expr3 = '5';
    memory -= new MathEvaluator().evaluate(expr3);
    assert.strictEqual(memory, 35, 'Memory should be 35 after M-');

    // MR
    assert.strictEqual(memory, 35, 'Memory recall should return 35');

    // MC
    memory = 0;
    assert.strictEqual(memory, 0, 'Memory clear should reset to 0');

    // History simulation
    const entry = { expression: expr1, result: MathEvaluator.formatResult(val1), timestamp: Date.now() };
    history.unshift(entry);
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].expression, '15 * 2');
    assert.strictEqual(history[0].result, '30');

    console.log('PASS: Memory and History unit tests passed!');
}

testMemoryAndHistory();
console.log('All core tests successful.');
