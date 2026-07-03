# Playwright Complete Guide — Beginner to Professional
> Pojjari project च्या actual code वर based — 450+ tests, 17 files

---

## PART 1: PLAYWRIGHT म्हणजे काय?

### सोप्या भाषेत:
Playwright एक **automated browser testing tool** आहे. म्हणजे तुम्ही manually browser मध्ये जे करतो — login करणं, button click करणं, form fill करणं — हे सगळं **automatically** आणि **automatically verify** करता येतं.

### का वापरतो?
```
Problem: Application मध्ये 160+ APIs आहेत, 50+ pages आहेत.
        प्रत्येक code change नंतर manually test करणं = 3-4 तास लागतात.

Solution: Playwright — एकदा test लिहा, कधीही 5 मिनिटांत 450 tests run होतात.
```

### तीन प्रकारचे testing:
```
Unit Test      → एक function test करतो (Jest)
                 e.g., addNumbers(2, 3) === 5 ?

API Test       → HTTP request/response test करतो (Supertest / Playwright request)
                 e.g., POST /api/auth/login → 200 status + token येतो का?

E2E Test       → Real browser मध्ये, real user सारखं test करतो (Playwright)
                 e.g., Browser उघड → Login page → Form fill → Submit → Dashboard दिसतो का?
```

Playwright तिन्ही करू शकतो, पण Pojjari मध्ये मुख्यतः **API testing + E2E testing** वापरतो.

---

## PART 2: INSTALLATION

### Step 1: Node.js project असणं आवश्यक आहे
```bash
# Check Node.js installed आहे का
node --version   # v18+ असायला हवं
npm --version
```

### Step 2: Playwright install करा
```bash
# Pojjari मध्ये e2e/ folder मध्ये आहे
cd e2e

# Install
npm install -D @playwright/test

# Browsers download करा (Chromium, Firefox, WebKit)
npx playwright install

# फक्त Chromium (fast, lighter)
npx playwright install chromium
```

### Step 3: Verify installation
```bash
npx playwright --version
# Playwright v1.x.x
```

### Step 4: package.json scripts
```json
{
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:headed": "playwright test --headed",
    "test:report": "playwright show-report"
  }
}
```

### Folder structure (Pojjari):
```
e2e/
├── playwright.config.js      ← Configuration
├── global-setup.js           ← Before all tests run (server start check)
├── playwright-report/        ← HTML report (auto generate)
└── tests/
    ├── auth.spec.js          ← 40 tests
    ├── booking-flow.spec.js  ← 29 tests
    ├── admin-panel.spec.js   ← 50 tests
    ├── api-core.spec.js      ← 45 tests
    ├── poojas.spec.js        ← 38 tests
    ├── public-pages.spec.js  ← 71 tests
    ├── security.spec.js      ← 10 tests
    ├── performance.spec.js   ← 9 tests
    └── ... 17 files total
```

---

## PART 3: CONFIGURATION — playwright.config.js

### Pojjari चा actual config:
```js
// e2e/playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',              // Tests कुठे आहेत
  globalSetup: './global-setup.js', // सगळ्या tests आधी run होणारं file

  fullyParallel: true,  // सगळे tests parallel run होतात (fast)
  forbidOnly: !!process.env.CI, // CI मध्ये test.only() चालत नाही (safety)
  retries: process.env.CI ? 2 : 1, // Fail झाला तर 1-2 वेळा retry

  timeout: 60_000,  // प्रत्येक test साठी 60 seconds max

  // Reporters — output कसा दाखवायचा
  reporter: [
    ['list'],   // Terminal मध्ये list
    ['html', { outputFolder: 'playwright-report', open: 'never' }], // HTML report
    ['json', { outputFile: 'playwright-report/results.json' }],     // JSON output
  ],

  use: {
    baseURL: 'http://localhost:5173',  // App URL — page.goto('/login') = http://localhost:5173/login
    trace: 'on-first-retry',          // Fail झाल्यावर trace capture
    screenshot: 'only-on-failure',    // Fail झाल्यावर screenshot
    video: 'retain-on-failure',       // Fail झाल्यावर video
    actionTimeout: 10_000,            // Click/fill timeout 10s
    navigationTimeout: 15_000,        // Page load timeout 15s
  },

  // Multiple browsers/devices वर test
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
      },
    },
    {
      name: 'tablet-chrome',
      use: {
        ...devices['iPad (gen 7)'],
        viewport: { width: 768, height: 1024 },
      },
    },
  ],
});
```

---

## PART 4: BASIC SYNTAX — BEGINNER LEVEL

### Test file structure:
```js
// test-name.spec.js  ← file नेहमी .spec.js ने end होतं

const { test, expect } = require('@playwright/test');

// Single test
test('test चं नाव — काय test करतोय', async ({ page }) => {
  // Test code इथे
});

// Group of related tests
test.describe('Auth — Login Tests', () => {
  test('TC-01: Valid login works', async ({ page }) => {
    // ...
  });
  test('TC-02: Invalid login fails', async ({ page }) => {
    // ...
  });
});
```

### `page` vs `request` — फरक:
```js
// page = Real browser window — UI test साठी
test('UI test', async ({ page }) => {
  await page.goto('/login');
  await page.click('button');
  await expect(page.locator('h1')).toBeVisible();
});

// request = HTTP client — API test साठी (browser open होत नाही)
test('API test', async ({ request }) => {
  const res = await request.post('http://localhost:5000/api/auth/login', {
    data: { phone: '9307720459', password: 'Admin@123' }
  });
  expect(res.status()).toBe(200);
});
```

---

## PART 5: PAGE ACTIONS — सगळ्या important commands

### Navigation:
```js
await page.goto('/login');                          // URL वर जा
await page.goto('/login', { waitUntil: 'domcontentloaded' }); // DOM load झाल्यावर
await page.goto('http://localhost:5173/dashboard'); // Full URL

await page.goBack();   // Browser back button
await page.goForward(); // Browser forward button
await page.reload();   // Page refresh
```

### Locators — Elements शोधणं:
```js
// CSS Selector
page.locator('button')                    // सगळे buttons
page.locator('button[type="submit"]')     // Submit button
page.locator('input[name="phone"]')       // Phone input
page.locator('.error-message')            // Class
page.locator('#loginForm')                // ID
page.locator('form button')               // Form च्या आत button

// Text वरून शोध
page.locator('button', { hasText: 'Login' })
page.locator('text=Register करा')

// Placeholder वरून
page.locator('input[placeholder="फोन नंबर"]')

// Type वरून
page.locator('input[type="password"]')
page.locator('input[type="tel"]')         // Phone number input

// nth element (0 = पहिला)
page.locator('button').first()            // पहिला button
page.locator('button').nth(2)             // तिसरा button
page.locator('button').last()             // शेवटचा button

// Filter
page.locator('button').filter({ hasText: /👁|show|hide/i })
```

### Actions:
```js
// Click
await page.locator('button[type="submit"]').click();
await page.locator('a[href="/register"]').click();

// Fill input
await page.locator('input[name="phone"]').fill('9307720459');
await page.locator('input[type="password"]').fill('Admin@123');

// Clear + Fill
await page.locator('input').clear();
await page.locator('input').fill('new value');

// Press keyboard key
await page.locator('input').press('Enter');
await page.locator('input').press('Tab');

// Select dropdown
await page.locator('select[name="category"]').selectOption('pooja');
await page.locator('select').selectOption({ label: 'Satyanarayan Pooja' });

// Check/Uncheck checkbox
await page.locator('input[type="checkbox"]').check();
await page.locator('input[type="checkbox"]').uncheck();

// Upload file
await page.locator('input[type="file"]').setInputFiles('test-image.jpg');

// Scroll
await page.locator('.card-list').scrollIntoViewIfNeeded();
await page.mouse.wheel(0, 300); // Down scroll

// Hover
await page.locator('.menu-item').hover();

// Wait for timeout (last resort, avoid this)
await page.waitForTimeout(1000); // 1 second wait
```

### Wait commands (important!):
```js
// Element visible होईपर्यंत wait
await expect(page.locator('.dashboard')).toBeVisible({ timeout: 5000 });

// Navigation होईपर्यंत wait
await page.waitForURL('/dashboard');
await page.waitForURL('**/dashboard'); // Pattern

// Specific event wait
await page.waitForLoadState('networkidle'); // Network quiet झाल्यावर
await page.waitForLoadState('domcontentloaded'); // DOM ready

// Response wait
const [response] = await Promise.all([
  page.waitForResponse('**/api/auth/login'),
  page.locator('button[type="submit"]').click()
]);
```

---

## PART 6: ASSERTIONS (expect) — Verify करणं

```js
// Element visible आहे का?
await expect(page.locator('.welcome')).toBeVisible();
await expect(page.locator('.error')).not.toBeVisible();

// Text आहे का?
await expect(page.locator('h1')).toHaveText('Pojjari');
await expect(page.locator('.msg')).toContainText('यशस्वी'); // Partial match

// URL check
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveURL(/\/dashboard/); // Regex

// Title check
await expect(page).toHaveTitle('Pojjari — पूजा बुकिंग');

// Input value
await expect(page.locator('input[name="name"]')).toHaveValue('Prathamesh');

// Element count
await expect(page.locator('.pooja-card')).toHaveCount(10);

// Element attribute
await expect(page.locator('img')).toHaveAttribute('alt', 'Pooja Image');

// Element enabled/disabled
await expect(page.locator('button[type="submit"]')).toBeEnabled();
await expect(page.locator('button.loading')).toBeDisabled();

// Element checked
await expect(page.locator('input[type="checkbox"]')).toBeChecked();

// API Response assertions
const res = await request.post('...');
expect(res.status()).toBe(200);
expect(res.ok()).toBeTruthy();
const body = await res.json();
expect(body.success).toBe(true);
expect(body.data.token).toBeTruthy();
expect(body.data.user.role).toBe('admin');
expect(body.data.password_hash).toBeUndefined(); // Field नसायला हवं
expect([200, 201]).toContain(res.status()); // Multiple valid values
```

---

## PART 7: POJJARI चे ACTUAL TEST PATTERNS

### Pattern 1: API Helper function
```js
// auth.spec.js मधून — Helper function
const API_URL = 'http://localhost:5000/api';
const ADMIN_PHONE = '9307720459';
const ADMIN_PASSWORD = 'Admin@123';

// Helper — API call सोपा करतो
async function apiPost(request, path, body, token = null) {
  return request.post(`${API_URL}${path}`, {
    data: body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Vापर
const res = await apiPost(request, '/auth/login', {
  phone: ADMIN_PHONE, password: ADMIN_PASSWORD
});
```

### Pattern 2: beforeAll — एकदा setup करा
```js
test.describe('Auth API — /me endpoint', () => {
  let adminToken = ''; // Shared variable

  // सगळ्या tests आधी एकदाच run होतो
  test.beforeAll(async ({ request }) => {
    const res = await apiPost(request, '/auth/login', {
      phone: ADMIN_PHONE, password: ADMIN_PASSWORD,
    });
    const body = await res.json();
    adminToken = body.data?.token || ''; // Token save केला
  });

  // आता adminToken वापरता येतो सगळ्या tests मध्ये
  test('TC-ME-01: Valid token returns user', async ({ request }) => {
    const res = await request.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
  });
});
```

### Pattern 3: Browser मध्ये Login करणं
```js
// booking-flow.spec.js मधून
async function adminLogin(page) {
  // API call करून token मिळव
  const res = await page.request.post(`${API_URL}/auth/login`, {
    data: { phone: ADMIN_PHONE, password: ADMIN_PASSWORD },
  });
  const body = await res.json();
  const token = body.data?.token;

  if (token) {
    // Browser च्या localStorage मध्ये token set कर
    await page.goto('/');
    await page.evaluate(({ tok, usr }) => {
      localStorage.setItem('pojjari_token', tok);
      localStorage.setItem('pojjari_user', JSON.stringify(usr));
    }, { tok: token, usr: body.data?.user });
  }
  return token;
}

// Test मध्ये वापर
test('Logged-in user can see bookings', async ({ page }) => {
  await adminLogin(page); // Login करा
  await page.goto('/booking-history');
  await expect(page.locator('.booking-card').first()).toBeVisible();
});
```

### Pattern 4: Dynamic test data (conflict avoid)
```js
// timestamp वापरून unique phone number
const TEST_PHONE = `9${Date.now().toString().slice(-9)}`;
// प्रत्येक test run मध्ये different number — database conflict नाही
```

### Pattern 5: Conditional test
```js
test('TC-BK-02: Create booking', async ({ request }) => {
  // Data नसल्यास skip कर
  if (!adminToken || !firstPooja) return test.skip();

  // ... test code
});
```

### Pattern 6: Multiple valid status codes
```js
test('TC-OTP-01: Send OTP', async ({ request }) => {
  const res = await apiPost(request, '/auth/send-otp', { phone: ADMIN_PHONE });
  // 200 = success, 429 = rate limited — दोन्ही valid!
  expect([200, 429]).toContain(res.status());
});
```

---

## PART 8: NAMING CONVENTION — Test IDs

### Pojjari मध्ये naming pattern:
```
TC-REG-01  → Test Case - Register - 01
TC-LGN-02  → Test Case - Login - 02
TC-ME-03   → Test Case - /Me endpoint - 03
TC-OTP-04  → Test Case - OTP - 04
TC-BK-05   → Test Case - Booking - 05
TC-LGUI-06 → Test Case - Login UI - 06

Pattern: TC-[FEATURE]-[NUMBER]: [Description]
```

### चांगलं test नाव कसं लिहायचं?
```js
// ❌ BAD
test('login test', async () => {...});
test('test 1', async () => {...});

// ✅ GOOD
test('TC-LGN-01: POST /api/auth/login with valid credentials returns token', async () => {...});
test('TC-LGN-02: Login with wrong password returns 401', async () => {...});
test('TC-LGUI-04: Wrong credentials shows error message in Marathi', async () => {...});
```

---

## PART 9: TEST CATEGORIES — Pojjari मधील 17 files

### 1. auth.spec.js (40 tests)
**काय test होतं:** Register, Login, /me, OTP, Forgot Password
```js
// Pattern:
// - API tests (request fixture)
// - UI tests (page fixture)
// - Security tests (XSS, SQL injection attempt)
```

### 2. booking-flow.spec.js (29 tests)
**काय test होतं:** Booking create, view, cancel, assign pujari
```js
// Key scenarios:
// - Auth नसताना booking → 401
// - Valid booking create → 201 + booking code
// - Past date booking → 400
// - Admin pujari assign → 200
```

### 3. admin-panel.spec.js (50 tests)
**काय test होतं:** Admin CRUD operations
```js
// Key scenarios:
// - Admin dashboard accessible
// - Create/update/delete pooja
// - Manage users
// - View reports
```

### 4. api-core.spec.js (45 tests)
**काय test होतं:** Core API endpoints health check
```js
// Pattern: सगळ्या major endpoints ला hit करून
// - Status code check
// - Response structure check
// - Auth required check
```

### 5. security.spec.js (10 tests)
**काय test होतं:** Security vulnerabilities check
```js
// Key scenarios:
test('TC-SEC-01: XSS in name field is sanitized', async ({ request }) => {
  const res = await apiPost(request, '/auth/register', {
    name: '<script>alert(1)</script>',
    phone: '...',
    password: 'Test@123'
  });
  if (res.status() === 201) {
    const body = await res.json();
    expect(body.data?.user?.name).not.toContain('<script>');
  }
});

test('TC-SEC-02: SQL injection in login is handled', async ({ request }) => {
  const res = await apiPost(request, '/auth/login', {
    phone: "' OR 1=1 --",
    password: "anything"
  });
  expect(res.status()).toBe(400); // Not 200 (SQL injection worked) or 500 (crash)
});
```

### 6. performance.spec.js (9 tests)
**काय test होतं:** Page load speed
```js
test('TC-PERF-01: Home page loads in under 3 seconds', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000);
});
```

### 7. responsive.spec.js (9 tests)
**काय test होतं:** Mobile/Tablet layout
```js
test('TC-RESP-01: Mobile menu visible on small screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); // iPhone
  await page.goto('/');
  await expect(page.locator('.hamburger-menu')).toBeVisible();
});
```

---

## PART 10: COMMANDS — SOBA RUN KASA

### Basic run:
```bash
cd e2e

# सगळे tests run
npx playwright test

# Specific file
npx playwright test tests/auth.spec.js

# Specific test (name filter)
npx playwright test -g "TC-LGN-01"

# Specific describe group
npx playwright test -g "Auth API — Login"
```

### Mode options:
```bash
# Headed mode — browser visible (debugging साठी)
npx playwright test --headed

# UI mode — visual test runner (best for development)
npx playwright test --ui

# Debug mode — step by step
npx playwright test --debug tests/auth.spec.js

# Specific browser
npx playwright test --project=chromium-desktop
npx playwright test --project=mobile-chrome
```

### Reports:
```bash
# HTML report बघा
npx playwright show-report

# Report auto-open
npx playwright test --reporter=html
```

### Useful flags:
```bash
# Fail fast — पहिला failure वर बंद
npx playwright test --bail

# Retry count
npx playwright test --retries=2

# Workers (parallel)
npx playwright test --workers=4

# Timeout override
npx playwright test --timeout=30000

# Verbose output
npx playwright test --reporter=list
```

---

## PART 11: DEBUGGING

### Method 1: --headed (बघा काय होतंय)
```bash
npx playwright test --headed tests/auth.spec.js
```

### Method 2: --debug (step by step)
```bash
npx playwright test --debug tests/auth.spec.js
# Inspector window उघडतो — Next button ने पुढे जा
```

### Method 3: pause() in code
```js
test('debug test', async ({ page }) => {
  await page.goto('/login');
  await page.pause(); // इथे थांबतो — manually inspect करा
  await page.fill('input', 'value');
});
```

### Method 4: screenshot घ्या
```js
test('debug with screenshot', async ({ page }) => {
  await page.goto('/login');
  await page.screenshot({ path: 'debug-screenshot.png' });
});
```

### Method 5: console.log
```js
test('debug api response', async ({ request }) => {
  const res = await request.post('http://localhost:5000/api/auth/login', {
    data: { phone: '9307720459', password: 'Admin@123' }
  });
  const body = await res.json();
  console.log('Response:', JSON.stringify(body, null, 2)); // Print करा
  expect(res.ok()).toBeTruthy();
});
```

### Method 6: Trace viewer
```bash
# Trace file असेल तर
npx playwright show-trace playwright-report/trace.zip
```

---

## PART 12: COMPLETE TEST CASE TEMPLATE

### API Test template:
```js
const { test, expect } = require('@playwright/test');

const API_URL = 'http://localhost:5000/api';

// ── Helpers ──────────────────────────────────────────────────────────
async function apiPost(request, path, body, token = null) {
  return request.post(`${API_URL}${path}`, {
    data: body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

async function getAdminToken(request) {
  const res = await apiPost(request, '/auth/login', {
    phone: '9307720459',
    password: 'Admin@123'
  });
  const body = await res.json();
  return body.data?.token || '';
}

// ── Tests ─────────────────────────────────────────────────────────────
test.describe('Feature Name — API Tests', () => {

  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
  });

  // Happy Path (Success case)
  test('TC-XX-01: Valid request returns success', async ({ request }) => {
    const res = await apiPost(request, '/your-endpoint', {
      field1: 'value1',
      field2: 'value2'
    }, adminToken);

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeTruthy();
  });

  // Auth check
  test('TC-XX-02: Without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/protected-endpoint`);
    expect(res.status()).toBe(401);
  });

  // Validation check
  test('TC-XX-03: Missing required field returns 400', async ({ request }) => {
    const res = await apiPost(request, '/your-endpoint', {}, adminToken);
    expect(res.status()).toBe(400);
  });

  // Edge case
  test('TC-XX-04: Duplicate entry returns 409', async ({ request }) => {
    await apiPost(request, '/your-endpoint', { name: 'Test' }, adminToken);
    const res = await apiPost(request, '/your-endpoint', { name: 'Test' }, adminToken);
    expect(res.status()).toBe(409);
  });
});
```

### UI Test template:
```js
test.describe('Page Name — UI Tests', () => {

  // Helper: page load
  async function load(page, path) {
    await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(500);
  }

  // Helper: login
  async function loginAsAdmin(page) {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('pojjari_token', 'your-test-token');
    });
  }

  test('TC-UI-01: Page loads successfully', async ({ page }) => {
    await load(page, '/your-page');
    await expect(page).toHaveTitle(/Expected Title/);
  });

  test('TC-UI-02: Key elements are visible', async ({ page }) => {
    await load(page, '/your-page');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('TC-UI-03: Form submit works', async ({ page }) => {
    await load(page, '/your-page');
    await page.locator('input[name="field"]').fill('test value');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
    // Verify result
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('TC-UI-04: Error shows on invalid input', async ({ page }) => {
    await load(page, '/your-page');
    await page.locator('button[type="submit"]').click(); // Empty submit
    await page.waitForTimeout(500);
    const body = await page.textContent('body');
    expect(body).toMatch(/error|required|चुकीचा/i);
  });

  test('TC-UI-05: Navigation link works', async ({ page }) => {
    await load(page, '/your-page');
    await page.locator('a[href="/other-page"]').click();
    await expect(page).toHaveURL('/other-page');
  });
});
```

---

## PART 13: GLOBAL SETUP

### global-setup.js — All tests आधी run होतो:
```js
// e2e/global-setup.js
module.exports = async function globalSetup() {
  console.log('🔍 Checking if servers are running...');

  // Backend check
  try {
    const res = await fetch('http://localhost:5000/api/health');
    if (!res.ok) throw new Error('Backend not healthy');
    console.log('✅ Backend running on :5000');
  } catch (e) {
    console.error('❌ Backend not running! Start with: npm run dev');
    process.exit(1); // Tests बंद
  }

  // Frontend check
  try {
    const res = await fetch('http://localhost:5173');
    console.log('✅ Frontend running on :5173');
  } catch (e) {
    console.error('❌ Frontend not running! Start with: npm run dev (frontend folder)');
    process.exit(1);
  }

  console.log('🚀 All servers up — Starting tests...');
};
```

---

## PART 14: CI/CD मध्ये PLAYWRIGHT

### GitHub Actions मध्ये:
```yaml
# .github/workflows/test.yml
name: E2E Tests

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
          cd ../e2e && npm ci

      - name: Install Playwright browsers
        run: cd e2e && npx playwright install --with-deps chromium

      - name: Start Backend
        run: cd backend && npm start &
        env:
          NODE_ENV: test
          DB_HOST: localhost

      - name: Start Frontend
        run: cd frontend && npm run build && npx serve dist -p 5173 &

      - name: Wait for servers
        run: sleep 10

      - name: Run Playwright tests
        run: cd e2e && npx playwright test --project=chromium-desktop

      - name: Upload Report
        if: always()  # Test fail झाला तरी upload
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: e2e/playwright-report/
```

---

## PART 15: BEST PRACTICES

### 1. कधीही `sleep` वापरू नका (शक्यतो)
```js
// ❌ BAD — fixed wait, slow and unreliable
await page.waitForTimeout(3000);
await page.click('button');

// ✅ GOOD — element ready झाल्यावर automatically proceed
await page.click('button');
await expect(page.locator('.result')).toBeVisible(); // Auto-waits internally
```

### 2. Test isolated असायला हवेत
```js
// ❌ BAD — tests एकमेकांवर depend
test('Create user', ...);  // Token set करतो
test('Get user', ...);     // वरच्या test चा token वापरतो → order matter

// ✅ GOOD — प्रत्येक test स्वतः setup करतो
test.beforeAll(async ({ request }) => {
  adminToken = await getAdminToken(request); // स्वतःचा token
});
```

### 3. Meaningful error messages
```js
// ❌ BAD
expect(res.status()).toBe(200);

// ✅ GOOD
expect(res.status(), `Login should return 200, got ${res.status()}`).toBe(200);
```

### 4. Test ID system वापरा
```js
// प्रत्येक test ला unique ID — easy to track failures
test('TC-AUTH-LGN-01: Valid login returns 200 with token', ...)
test('TC-AUTH-LGN-02: Invalid password returns 401', ...)
```

### 5. Dynamic data वापरा
```js
// ❌ BAD — hardcoded phone might already exist in DB
const phone = '9876543210';

// ✅ GOOD — timestamp ensures uniqueness
const phone = `9${Date.now().toString().slice(-9)}`;
```

---

## PART 16: INTERVIEW QUESTIONS — Playwright

**Q1: Playwright म्हणजे काय?**
A: Microsoft ने बनवलेला open-source E2E testing framework. Chromium, Firefox, WebKit तिन्ही browsers support करतो. Node.js, Python, Java, C# मध्ये use करता येतो.

**Q2: Selenium vs Playwright vs Cypress फरक?**
| Feature | Playwright | Selenium | Cypress |
|---------|-----------|---------|---------|
| Speed | Fast (auto-wait) | Slow (manual waits) | Fast |
| Browsers | Chromium+Firefox+WebKit | All browsers | Chrome+Firefox |
| Languages | JS/Python/Java/C# | All | JS only |
| Auto-wait | ✅ Built-in | ❌ Manual sleep | ✅ |
| iframes | ✅ Easy | Complex | Limited |
| File upload | ✅ Easy | Complex | Limited |
| Multiple tabs | ✅ | ✅ | ❌ |

**Q3: `page.locator()` vs `page.$()` फरक?**
A: `locator()` = recommended, lazy evaluation, auto-retry. `$()` = old, immediate, no retry. नेहमी `locator()` वापरा.

**Q4: Auto-wait म्हणजे काय?**
A: Playwright automatically wait करतो element actionable होईपर्यंत. `click()` call केलं की element visible, enabled, stable होईपर्यंत auto-wait करतो — explicit sleep लागत नाही.

**Q5: Flaky test म्हणजे काय? कसं fix करतात?**
A: Sometimes pass, sometimes fail होणारा test. Causes:
- Network slowness → `waitForResponse()` वापर
- Animation → `waitForLoadState()` वापर
- Race condition → proper `await expect()` वापर
- Fixed `waitForTimeout()` → replace with dynamic waits

**Q6: Pojjari मध्ये 450+ tests का लिहिले?**
A: 160+ APIs आहेत, प्रत्येक API साठी:
- Happy path (valid input)
- Auth check (no token)
- Validation (missing fields)
- Edge cases (duplicate, invalid)
= 3-4 tests per API minimum.
UI tests — login page, register page, mobile view, etc.
Security tests — XSS, SQL injection attempt.

**Q7: CI मध्ये Playwright कसं run केलं?**
A: GitHub Actions YAML मध्ये:
1. Backend start → frontend build → servers ready
2. `npx playwright install chromium` (headless)
3. `npx playwright test --project=chromium-desktop`
4. Fail झाल्यावर `playwright-report` artifact upload

**Q8: `beforeAll` vs `beforeEach` फरक?**
A: `beforeAll` = describe group च्या सगळ्या tests आधी एकदाच (login = once). `beforeEach` = प्रत्येक test आधी (fresh page load).

---

## PART 17: QUICK REFERENCE CARD

```js
// ── SETUP ──────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');

// ── NAVIGATION ─────────────────────────────────────────────
await page.goto('/login');
await page.goto('/login', { waitUntil: 'domcontentloaded' });

// ── LOCATORS ───────────────────────────────────────────────
page.locator('button[type="submit"]')
page.locator('input[name="phone"]')
page.locator('.error-message')
page.locator('text=Login करा')
page.locator('button').first()
page.locator('button').filter({ hasText: 'Submit' })

// ── ACTIONS ────────────────────────────────────────────────
await locator.click()
await locator.fill('value')
await locator.press('Enter')
await locator.selectOption('option')
await locator.check()

// ── ASSERTIONS ─────────────────────────────────────────────
await expect(locator).toBeVisible()
await expect(locator).toContainText('text')
await expect(locator).toHaveValue('value')
await expect(locator).toBeEnabled()
await expect(page).toHaveURL('/dashboard')

// ── API TESTING ────────────────────────────────────────────
const res = await request.post('http://localhost:5000/api/path', {
  data: { key: 'value' },
  headers: { Authorization: `Bearer ${token}` }
});
expect(res.status()).toBe(200);
const body = await res.json();
expect(body.success).toBe(true);

// ── COMMANDS ───────────────────────────────────────────────
npx playwright test                    # Run all
npx playwright test auth.spec.js       # Single file
npx playwright test -g "TC-LGN-01"   # Single test
npx playwright test --headed           # Show browser
npx playwright test --ui              # Visual runner
npx playwright test --debug           # Debug mode
npx playwright show-report            # HTML report
```

---

> **Interview मध्ये सांग:**
> "Pojjari project मध्ये मी 17 test files मध्ये 450+ Playwright tests लिहिले आहेत.
> API testing (request fixture) + E2E UI testing (page fixture) + Security testing (XSS, SQL injection)
> + Performance testing (load time) + Responsive testing (mobile/tablet) cover केलं आहे.
> GitHub Actions CI/CD मध्ये automatic run होतात — main branch ला push झाल्यावर."
