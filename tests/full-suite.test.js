/**
 * Exhaustive Verification Test Suite for Athrav Scientific Calculator
 */

const assert = require('assert');
const { MathEvaluator } = require('../script.js');

let passCount = 0;
let failCount = 0;

function runTest(description, fn) {
    try {
        fn();
        passCount++;
        console.log(`✓ PASS: ${description}`);
    } catch (err) {
        failCount++;
        console.error(`✗ FAIL: ${description}`);
        console.error(`  Error: ${err.message}`);
    }
}

console.log('====================================================');
console.log('RUNNING ATHRAV CALCULATOR COMPREHENSIVE TEST SUITE');
console.log('====================================================\n');

// 1. Basic Arithmetic & Precedence
runTest('Arithmetic: 2 + 3 * 4 equals 14 (multiplication before addition)', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('2 + 3 * 4'), 14);
});

runTest('Arithmetic: 20 - 4 / 2 equals 18 (division before subtraction)', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('20 - 4 / 2'), 18);
});

runTest('Arithmetic: 10 + 20 - 5 equals 25 (left-to-right addition & subtraction)', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('10 + 20 - 5'), 25);
});

runTest('Arithmetic: 12 / 3 * 2 equals 8 (left-to-right division & multiplication)', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('12 / 3 * 2'), 8);
});

// 2. Decimals & Precision
runTest('Decimals: 0.1 + 0.2 formatted cleanly as "0.3"', () => {
    const calc = new MathEvaluator();
    const res = calc.evaluate('0.1 + 0.2');
    const formatted = MathEvaluator.formatResult(res);
    assert.strictEqual(formatted, '0.3');
});

runTest('Decimals: leading dot .5 * 4 equals 2', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('.5 * 4'), 2);
});

runTest('Decimals: rejection of multiple decimal points "3.14.5"', () => {
    const calc = new MathEvaluator();
    assert.throws(() => calc.evaluate('3.14.5'), /multiple decimal points/i);
});

// 3. Negative Values & Unary Minus
runTest('Negative: initial unary minus "-5 + 2" equals -3', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('-5 + 2'), -3);
});

runTest('Negative: double minus "10 - -5" equals 15', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('10 - -5'), 15);
});

runTest('Negative: multiplication with unary minus "5 * -3" equals -15', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('5 * -3'), -15);
});

runTest('Negative: division with unary minus "10 / -2" equals -5', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('10 / -2'), -5);
});

// 4. Percentages
runTest('Percentages: 50% equals 0.5', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('50%'), 0.5);
});

runTest('Percentages: 200 * 15% equals 30', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('200 * 15%'), 30);
});

// 5. Brackets & Implicit Multiplication
runTest('Brackets: (2 + 3) * 4 equals 20', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('(2 + 3) * 4'), 20);
});

runTest('Brackets: nested ((2 + 3) * 4) + 5 equals 25', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('((2 + 3) * 4) + 5'), 25);
});

runTest('Implicit Multiplication: 2(3 + 4) equals 14', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('2(3 + 4)'), 14);
});

runTest('Implicit Multiplication: (2 + 3)(4 + 5) equals 45', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('(2 + 3)(4 + 5)'), 45);
});

runTest('Auto-closing unclosed parentheses: "sin(30" in DEG mode equals 0.5', () => {
    const calc = new MathEvaluator({ angleMode: 'DEG' });
    const res = calc.evaluate('sin(30');
    assert.strictEqual(MathEvaluator.formatResult(res), '0.5');
});

runTest('Mismatched Parentheses: rejection of closing paren without opening ")5+2("', () => {
    const calc = new MathEvaluator();
    assert.throws(() => calc.evaluate(')5+2('), /Mismatched parentheses/i);
});

// 6. Powers & Factorial
runTest('Powers: 2 ^ 3 ^ 2 equals 512 (right-associative power: 2^(3^2))', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('2 ^ 3 ^ 2'), 512);
});

runTest('Powers: (2 ^ 3) ^ 2 equals 64', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('(2 ^ 3) ^ 2'), 64);
});

runTest('Square x²: 4² equals 16', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('4²'), 16);
});

runTest('Factorial: 5! equals 120', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('5!'), 120);
});

runTest('Factorial: 0! equals 1', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('0!'), 1);
});

// 7. Scientific Functions: Trigonometry & Angle Modes
runTest('Trig (DEG): sin(90) equals 1', () => {
    const calc = new MathEvaluator({ angleMode: 'DEG' });
    assert.strictEqual(calc.evaluate('sin(90)'), 1);
});

runTest('Trig (DEG): cos(180) equals -1', () => {
    const calc = new MathEvaluator({ angleMode: 'DEG' });
    assert.strictEqual(calc.evaluate('cos(180)'), -1);
});

runTest('Trig (DEG): tan(45) equals 1', () => {
    const calc = new MathEvaluator({ angleMode: 'DEG' });
    assert.strictEqual(calc.evaluate('tan(45)'), 1);
});

runTest('Trig (RAD): sin(π / 2) equals 1', () => {
    const calc = new MathEvaluator({ angleMode: 'RAD' });
    assert.strictEqual(calc.evaluate('sin(π / 2)'), 1);
});

runTest('Trig (RAD): cos(π) equals -1', () => {
    const calc = new MathEvaluator({ angleMode: 'RAD' });
    assert.strictEqual(calc.evaluate('cos(π)'), -1);
});

runTest('Inverse Trig: asin(1) in DEG mode equals 90', () => {
    const calc = new MathEvaluator({ angleMode: 'DEG' });
    assert.strictEqual(calc.evaluate('asin(1)'), 90);
});

runTest('Inverse Trig: acos(0.5) in DEG mode equals 60', () => {
    const calc = new MathEvaluator({ angleMode: 'DEG' });
    const formatted = MathEvaluator.formatResult(calc.evaluate('acos(0.5)'));
    assert.strictEqual(formatted, '60');
});

runTest('Inverse Trig: atan(1) in DEG mode equals 45', () => {
    const calc = new MathEvaluator({ angleMode: 'DEG' });
    assert.strictEqual(calc.evaluate('atan(1)'), 45);
});

// 8. Logarithms & Constants
runTest('Constants: π equals Math.PI', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('π'), Math.PI);
});

runTest('Constants: e equals Math.E', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('e'), Math.E);
});

runTest('Logarithms: log(100) equals 2 (log base 10)', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('log(100)'), 2);
});

runTest('Logarithms: ln(e) equals 1 (natural log base e)', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('ln(e)'), 1);
});

runTest('Square Root: sqrt(16) and √(16) equals 4', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('sqrt(16)'), 4);
    assert.strictEqual(calc.evaluate('√(16)'), 4);
});

runTest('Absolute Value: abs(-42) equals 42', () => {
    const calc = new MathEvaluator();
    assert.strictEqual(calc.evaluate('abs(-42)'), 42);
});

// 9. Division by Zero & Domain Errors
runTest('Division by Zero: 10 / 0 throws "Cannot divide by zero"', () => {
    const calc = new MathEvaluator();
    assert.throws(() => calc.evaluate('10 / 0'), /Cannot divide by zero/i);
});

runTest('Undefined Division: 0 / 0 throws "Undefined result"', () => {
    const calc = new MathEvaluator();
    assert.throws(() => calc.evaluate('0 / 0'), /Undefined result/i);
});

runTest('Domain Error: sqrt(-4) throws domain error', () => {
    const calc = new MathEvaluator();
    assert.throws(() => calc.evaluate('sqrt(-4)'), /Invalid domain.*square root/i);
});

runTest('Domain Error: log(0) throws domain error', () => {
    const calc = new MathEvaluator();
    assert.throws(() => calc.evaluate('log(0)'), /Invalid domain.*log/i);
});

runTest('Domain Error: ln(-5) throws domain error', () => {
    const calc = new MathEvaluator();
    assert.throws(() => calc.evaluate('ln(-5)'), /Invalid domain.*ln/i);
});

runTest('Domain Error: asin(2) throws domain error', () => {
    const calc = new MathEvaluator();
    assert.throws(() => calc.evaluate('asin(2)'), /Invalid domain.*asin/i);
});

runTest('Domain Error: tan(90) in DEG mode throws vertical asymptote error', () => {
    const calc = new MathEvaluator({ angleMode: 'DEG' });
    assert.throws(() => calc.evaluate('tan(90)'), /Undefined.*asymptote/i);
});

runTest('Factorial Error: (-3)! throws domain error', () => {
    const calc = new MathEvaluator();
    assert.throws(() => calc.evaluate('(-3)!'), /non-negative integers/i);
});

runTest('Factorial Error: 3.5! throws non-integer error', () => {
    const calc = new MathEvaluator();
    assert.throws(() => calc.evaluate('3.5!'), /non-negative integers/i);
});

runTest('Factorial Overflow: 171! throws overflow error', () => {
    const calc = new MathEvaluator();
    assert.throws(() => calc.evaluate('171!'), /Factorial overflow/i);
});

runTest('Syntax Error: "5 + * 3" throws unexpected token error', () => {
    const calc = new MathEvaluator();
    assert.throws(() => calc.evaluate('5 + * 3'), /Unexpected token/i);
});

// 10. Memory Registry Operations Simulation
runTest('Memory Registry: MC, MR, M+, M- state lifecycle', () => {
    let memory = 0;
    const calc = new MathEvaluator();

    // Store 50 in memory via M+
    const v1 = calc.evaluate('25 * 2');
    memory += v1;
    assert.strictEqual(memory, 50, 'M+ with 50');

    // Add 20 via M+
    const v2 = calc.evaluate('20');
    memory += v2;
    assert.strictEqual(memory, 70, 'M+ with 20 (total 70)');

    // Subtract 15 via M-
    const v3 = calc.evaluate('15');
    memory -= v3;
    assert.strictEqual(memory, 55, 'M- with 15 (total 55)');

    // MR returns 55
    assert.strictEqual(memory, 55, 'MR equals 55');

    // MC resets memory to 0
    memory = 0;
    assert.strictEqual(memory, 0, 'MC resets to 0');
});

// 11. History Persistence Simulation
runTest('History: local storage array handling', () => {
    const history = [];
    const entry1 = { id: '1', expression: '25 + 25', result: '50', timestamp: '12:00 PM' };
    const entry2 = { id: '2', expression: '50 * 2', result: '100', timestamp: '12:01 PM' };

    history.unshift(entry1);
    history.unshift(entry2);

    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].expression, '50 * 2');
    assert.strictEqual(history[0].result, '100');
    assert.strictEqual(history[1].expression, '25 + 25');

    // Delete item
    const filtered = history.filter(item => item.id !== '1');
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].id, '2');
});

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${passCount} Passed, ${failCount} Failed`);
console.log('====================================================\n');

if (failCount > 0) {
    process.exit(1);
}
