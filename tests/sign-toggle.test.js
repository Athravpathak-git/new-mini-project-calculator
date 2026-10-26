// Test sign toggle and input validator helpers
const assert = require('assert');

function toggleSign(expr) {
    if (!expr || expr === '0') {
        return '-';
    }

    // Pattern 1: ends in (-X) where X is a number
    const negParenRegex = /\(\s*-\s*([0-9.]+|π|e)\s*\)$/;
    if (negParenRegex.test(expr)) {
        return expr.replace(negParenRegex, '$1');
    }

    // Pattern 2: starts with a lone - and number
    if (/^-\s*([0-9.]+|π|e)$/.test(expr)) {
        return expr.replace(/^-\s*/, '');
    }

    // Pattern 3: ends in an operator then a number e.g. "10 + 5" -> "10 + (-5)"
    const opNumRegex = /([+\-×*÷/^]\s*)([0-9.]+|π|e)$/;
    if (opNumRegex.test(expr)) {
        return expr.replace(opNumRegex, '$1(-$2)');
    }

    // Pattern 4: just a positive number at start e.g. "42" -> "-42"
    if (/^([0-9.]+|π|e)$/.test(expr)) {
        return '-' + expr;
    }

    // Fallback: wrap in -()
    return `-(${expr})`;
}

// Test cases for sign toggle
assert.strictEqual(toggleSign('0'), '-');
assert.strictEqual(toggleSign(''), '-');
assert.strictEqual(toggleSign('42'), '-42');
assert.strictEqual(toggleSign('-42'), '42');
assert.strictEqual(toggleSign('10 + 5'), '10 + (-5)');
assert.strictEqual(toggleSign('10 + (-5)'), '10 + 5');
assert.strictEqual(toggleSign('10 × 2.5'), '10 × (-2.5)');
assert.strictEqual(toggleSign('10 × (-2.5)'), '10 × 2.5');

console.log('PASS: toggleSign test cases all passed!');
