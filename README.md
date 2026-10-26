# Athrav Scientific Calculator

An elegant, precision scientific calculator crafted with vanilla web standards (HTML5, CSS3, and modern ES6+ JavaScript). Designed with the visual sophistication of a high-end physical timepiece and built for professional developer portfolios.

---

## Design System & Aesthetics

The interface adopts a bespoke luxury aesthetic inspired by precision Swiss instruments and tailored hardware:

- **Color Palette**:
  - **Deep Charcoal** (`#121316` / `#191b22`): Provides a grounded, glare-free dark canvas.
  - **Rich Burgundy** (`#611828` / `#751e31`): Distinctive, restrained accent for critical operations (AC, DEL, active mode states).
  - **Warm Cream** (`#faf6f0` / `#f6f1e9`): High-contrast, gentle text in dark mode and ivory marble surface in light mode.
  - **Restrained Rose-Gold** (`#d4a373` / `#b87a4c`): Metallic accents for the equals button, active memory registry chip, and subtle focus halos.
- **Micro-Interactions**: Tactile button elevation (`transform: translateY(-1.5px)` on hover, `translateY(1px)` on active press), subtle ambient shadows, and crisp `:focus-visible` rings for accessible navigation.
- **Dual Themes**: Complete Dark and Light theme implementations with instant switching and `localStorage` persistence.
- **Adaptive Layout**: Side-by-side workstation layout on desktop and tablet; compact mode with a collapsible scientific drawer on mobile phones.

---

## Core Capabilities & Features

### 1. Safe & Deterministic Expression Engine
- **Zero `eval()` or `new Function()`**: Implements a dedicated, hand-crafted Recursive Descent Parser and Tokenizer with an explicit mathematical grammar.
- **Implicit Multiplication**: Seamlessly interprets notations like `2(3 + 4)` as `2 × (3 + 4)`, `2π` as `2 × π`, and `(2+3)(4+5)` as `45`.
- **Precedence & Right-Associativity**: Strict PEMDAS/BODMAS adherence, including right-associative exponentiation (`2 ^ 3 ^ 2 = 512`).
- **Domain Guardrails & Precision**:
  - Graceful handling of division by zero (`10 / 0` → "Cannot divide by zero", `0 / 0` → "Undefined result").
  - Domain protection on square root (`√(-4)`), non-positive logarithms (`log(0)`, `ln(-1)`), inverse trig (`asin(2)`), and tangent asymptotes (`tan(90°)`).
  - Factorial verification for non-negative integers up to `170!`.
  - Floating-point precision cleanup ensuring `0.1 + 0.2` renders as `0.3`.

### 2. Scientific & Trigonometric Suite
- **Trigonometric**: `sin`, `cos`, `tan` with precision snapping for common angles (e.g. `sin(30°) = 0.5`, `cos(90°) = 0`).
- **Inverse Trigonometric (`2nd` Mode)**: `sin⁻¹` (`asin`), `cos⁻¹` (`acos`), `tan⁻¹` (`atan`).
- **Angle Modes**: Instant toggle between Degrees (`DEG`) and Radians (`RAD`).
- **Logarithmic & Exponential**: Common logarithm `log₁₀`, Natural logarithm `ln`, `eˣ`, `10ˣ`.
- **Roots, Powers & Factorial**: Square root `√`, square `x²`, general exponentiation `xʸ` (`^`), factorial `x!`, reciprocal `1/x`, absolute value `|x|`.
- **Mathematical Constants**: `π` (Pi) and `e` (Euler's Number).

### 3. Memory Registry (Hardware Style)
- **MC (Memory Clear)**: Resets registry to 0 and clears indicator.
- **MR (Memory Recall)**: Restores stored value into the current calculation.
- **M+ (Memory Add)**: Evaluates current expression or result and adds to memory.
- **M− (Memory Subtract)**: Evaluates current expression or result and subtracts from memory.
- **Memory Indicator**: Visual rose-gold `M` chip glows on the display whenever stored memory is non-zero. Persisted across page refreshes via `localStorage`.

### 4. Calculation History
- **Persistent Ledger**: Stores up to 50 recent calculations locally.
- **Interactive Retrieval**:
  - Click on any historical expression to load it back into the active calculation.
  - Click on any result to insert that value into the current formula.
- **Item Management**: Individual deletion of entries or one-click "Clear All History".

### 5. Non-Intrusive Validation & UX
- No native browser `alert()` popups. Validation warnings and status messages appear cleanly inside an in-display status bar and subtle toast notifications.
- Decimal point guard prevents malformed tokens like `3.14.5`.
- Auto-balancing parentheses on evaluation.
- One-click copy for expressions and results with confirmation tooltips.

---

## Technology Stack

- **HTML5**: Semantic markup, ARIA live regions (`role="status"`, `aria-live="polite"`), and accessible button labels.
- **CSS3**: Custom design tokens (CSS variables), Flexbox, CSS Grid, media queries, and dark/light color schemes.
- **JavaScript (ES6+)**: Vanilla object-oriented classes (`MathEvaluator`, `CalculatorApp`), strict event delegation, and zero third-party dependencies.

---

## Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `0` – `9` | Input Digits |
| `.` | Decimal Point (guards against duplicates) |
| `+`, `-` | Addition / Subtraction |
| `*` or `x` | Multiplication (`×`) |
| `/` | Division (`÷`) |
| `^` | Power (`xʸ`) |
| `%` | Percentage (`÷ 100`) |
| `!` | Factorial |
| `(`, `)` | Parentheses |
| `Enter` or `=` | Calculate Result |
| `Backspace` | Delete last character / token |
| `Escape` or `Delete` or `C` | All Clear (`AC`) |
| `P` | Insert Constant `π` |
| `E` | Insert Constant `e` |
| `S` | Insert Sine function `sin(` |
| `H` | Toggle Calculation History Drawer |
| `T` | Toggle Dark / Light Theme |

---

## Project Structure

```text
├── index.html              # Main application markup with semantic layout
├── style.css               # Design system, CSS tokens, dark/light themes, animations
├── script.js               # Parser engine, memory registry, history & UI controller
├── README.md               # Architecture documentation & usage guide
├── .gitignore              # Ignored files and patterns
└── tests/
    ├── full-suite.test.js  # 51 automated unit tests for math grammar and edge cases
    ├── calculator-app.test.js # DOM controller, state, and interaction test suite
    ├── calculator-core.test.js # Core memory registry and evaluator test suite
    └── sign-toggle.test.js # Sign inversion and regex helper unit tests
```

---

## Automated Verification & Testing

The project includes an automated test suite executed via Node.js:

```bash
# Run comprehensive mathematical grammar and domain error tests
node tests/full-suite.test.js

# Run controller and UI state tests
node tests/calculator-app.test.js

# Run sign toggle unit tests
node tests/sign-toggle.test.js
```

All 51 core evaluation tests pass without warnings, covering:
- Standard precedence and nested parentheses
- Negative values and unary minus interactions
- Degree and Radian trigonometry and inverse functions
- Domain error checks (`√(-1)`, `log(0)`, `tan(90°)`, non-integer factorials)
- Memory addition, subtraction, recall, and reset
- Local history state persistence and filtering

---

## Deployment Instructions

### GitHub Pages (Recommended)
1. Push your repository to GitHub.
2. In the repository settings, navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Branch**, select `main` (or `master`) and folder `/ (root)`.
4. Click **Save**. GitHub Pages will serve the application statically within seconds.

### Vercel / Netlify
- **Vercel**: Run `npx vercel` or connect the repository via the Vercel dashboard. No build commands or framework presets are needed (`Output Directory: .`).
- **Netlify**: Connect your GitHub repository or drag-and-drop the project directory onto the Netlify dashboard.

---

## Capturing Portfolio Screenshots (Guidance)

For presenting this project in a portfolio or GitHub overview:
1. **Desktop View (Dark Mode)**: Capture the complete workstation view with the scientific keypad expanded side-by-side (`1280 × 800` resolution).
2. **History Drawer Open**: Perform 2–3 calculations (e.g. `sin(30) + 10`, `2 ^ 8`, `15% × 240`) and open the history drawer on the right.
3. **Light Mode**: Toggle the theme using the header button to demonstrate the cream and burgundy palette.
4. **Mobile Viewport**: Emulate mobile (`390 × 844` or `412 × 915`) in browser developer tools to display the compact standard keypad and collapsible scientific tray.

---

## License & Attribution

Open-source under the MIT License. Developed for portfolio showcase and production-grade calculator use.
