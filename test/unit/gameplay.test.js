// gameplay.test.js
const timeout = 30000;

const getButtonByText = async (text) => {
    const buttons = await page.$$('.btn');
    for (const button of buttons) {
        const buttonText = await page.evaluate(el => el.innerText, button);
        if (buttonText && buttonText.trim().toLowerCase() === text.trim().toLowerCase()) {
            return button;
        }
    }
    console.error(`[getButtonByText] Button with text "${text}" not found.`);
    return null;
};

async function waitForTextXPath(selectorId, textSubstring, timeoutMs = 5000) {
    const xpath = `//div[@id='${selectorId}' and contains(., "${textSubstring}")]`;
    try {
        await page.waitForSelector(`xpath/${xpath}`, { timeout: timeoutMs });
        console.log(`[waitForTextXPath] Found text "${textSubstring}" in #${selectorId}`);
    } catch (err) {
        let currentText = 'SELECTOR/PAGE ERROR';
        try {
            currentText = await page.$eval(`#${selectorId}`, el => el.textContent);
        } catch (evalErr) {
             const selectorExists = await page.$(`#${selectorId}`);
             currentText = selectorExists ? `Could not evaluate #${selectorId}` : `SELECTOR #${selectorId} NOT FOUND`;
        }
        const errorMessage = `Timeout or error waiting for text "${textSubstring}" in #${selectorId}. Current text: "${currentText || '(empty)'}". Original Error: ${err.message}`;
        console.error(`[waitForTextXPath] Error: ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

describe('CYOA Engine Gameplay Integration', () => {
    jest.setTimeout(timeout);

    beforeEach(async () => {
        try {
            await page.goto('http://localhost:8080/game.html', { waitUntil: 'networkidle0', timeout: 15000 });
            await page.waitForSelector('#text', { timeout: 10000 });
            await waitForTextXPath('text', 'Welcome! This is a tiny demonstration.', 10000);
        } catch (err) {
            console.error('[Test Setup] Error in beforeEach:', err);
            try { await page.screenshot({ path: 'error_screenshot_beforeEach.png' }); } catch (e) { console.error("Failed to take screenshot:", e);}
            throw err;
        }
    });

    it('should load the initial game screen correctly', async () => {
        const title = await page.title();
        expect(title).toBe('The Simple Choice');

        try {
            await page.waitForFunction(
                (selector, expectedSubstring) => {
                    const element = document.querySelector(selector);
                    return element && element.innerHTML.includes(expectedSubstring);
                },
                { timeout: 5000 },
                '#text',
                '<u>Next</u>'
            );
            console.log("waitForFunction confirmed #text contains '<u>Next</u>'");
        } catch (err) {
            // --- FIX: Correct error handling for $eval ---
            let currentHTML = 'Error retrieving HTML'; // Default message
            try {
                // Try to get HTML inside a separate try/catch
                currentHTML = await page.$eval('#text', el => el.innerHTML);
            } catch (evalError) {
                // Log specific eval error if it happens
                console.error(`Error during page.$eval in catch block: ${evalError.message}`);
                currentHTML = `Could not get #text HTML (${evalError.message})`;
            }
            console.error(`waitForFunction failed. Current #text HTML: ${currentHTML}`);
            // Throw the original waitForFunction error, potentially enriched
            throw new Error(`Timeout or error waiting for #text innerHTML to contain "<u>Next</u>". Current HTML: "${currentHTML}". Original error: ${err.message}`);
        }

        const textContentHTML = await page.$eval('#text', el => el.innerHTML);
        expect(textContentHTML).toContain('<u>Next</u>');

        const backButtonDisplay = await page.$eval('#back-button', el => window.getComputedStyle(el).display);
        expect(backButtonDisplay).toBe('none');

        const nextButton = await getButtonByText('Next');
        expect(nextButton).not.toBeNull();
    });

    // ... other integration tests ...
});

describe('Placeholder Integration Tests', () => {
    // ... keep todos ...
});