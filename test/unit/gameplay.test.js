// gameplay.test.js
const timeout = 30000;

// --- Helper Functions (getButtonByText, waitForTextXPath, waitForButton) ---
// Included Helper Function (Using $$eval)
const getButtonByText = async (text) => {
    const targetText = text.trim().toLowerCase();
    // console.log(`[getButtonByText] Searching for button with text "${targetText}" using $$eval...`);
    const matchingButtonIndex = await page.$$eval('.btn', (browserButtons, searchText) => {
        for (let i = 0; i < browserButtons.length; i++) { const btn = browserButtons[i]; const btnText = btn.innerText; if (btnText && btnText.trim().toLowerCase() === searchText) { return i; } } return -1;
    }, targetText);
    if (matchingButtonIndex !== -1) { const buttons = await page.$$('.btn'); if (buttons[matchingButtonIndex]) { /* console.log(`[getButtonByText] Found button "${text}" at index ${matchingButtonIndex}.`); */ return buttons[matchingButtonIndex]; } else { console.error(`[getButtonByText] Index ${matchingButtonIndex} was found by $$eval, but element handle array changed before re-fetch.`); return null; } } else { return null; }
};
// Included Helper Function
async function waitForTextXPath(selectorId, textSubstring, timeoutMs = 5000) {
    const xpath = `//div[@id='${selectorId}' and contains(., "${textSubstring}")]`;
    try { if (!page || typeof page.waitForSelector !== 'function') { throw new Error("Puppeteer 'page' object or 'waitForSelector' method is not available."); } await page.waitForSelector(`xpath/${xpath}`, { timeout: timeoutMs }); console.log(`[waitForTextXPath] Found text "${textSubstring}" in #${selectorId}`); } catch (err) { let currentText = 'SELECTOR/PAGE ERROR'; if (page && typeof page.$eval === 'function') { try { currentText = await page.$eval(`#${selectorId}`, el => el.textContent); } catch (evalErr) { if(page && typeof page.$ === 'function') { const selectorExists = await page.$(`#${selectorId}`); currentText = selectorExists ? `Could not evaluate #${selectorId}` : `SELECTOR #${selectorId} NOT FOUND`; } else { currentText = `SELECTOR #${selectorId} evaluation failed and page.$ not available.`; } } } else { currentText = `Error occurred and 'page' object not available for $eval check.`; } const errorMessage = `Timeout or error waiting for text "${textSubstring}" in #${selectorId}. Current text: "${currentText || '(empty)'}". Original Error: ${err.message}`; console.error(`[waitForTextXPath] Error: ${errorMessage}`); throw new Error(errorMessage); }
}
// Included Helper Function
async function waitForButton(buttonText, timeoutMs = 5000) { /* ... No changes needed ... */ console.log(`[waitForButton] Waiting for button with text "${buttonText}"...`); const startTime = Date.now(); while (Date.now() - startTime < timeoutMs) { const button = await getButtonByText(buttonText); if (button) { console.log(`[waitForButton] Found button "${buttonText}".`); return button; } if (page && typeof page.waitForTimeout === 'function') { await page.waitForTimeout(100); } else { await new Promise(resolve => setTimeout(resolve, 100)); } } const timeoutError = new Error(`Timeout waiting for button with text "${buttonText}" to appear.`); console.error(`[waitForButton] ${timeoutError.message}`); throw timeoutError; }


describe('CYOA Engine Gameplay Integration', () => {
    jest.setTimeout(timeout);

    beforeEach(async () => {
        if (!page) { throw new Error("Puppeteer 'page' object is not initialized before test suite."); }
        try {
            await page.goto('http://localhost:8080/game.html', { waitUntil: 'networkidle0', timeout: 15000 });
            await page.waitForSelector('#text', { timeout: 10000 });
            await waitForTextXPath('text', 'Welcome! This is a tiny demonstration.', 10000);
        } catch (err) {
            console.error('[Test Setup] Error in beforeEach:', err);
            throw err;
        }
    });

    it('should load the initial game screen and allow progression', async () => {
        const title = await page.title();
        expect(title).toBe('The Simple Choice');
        console.log("Initial text confirmed via beforeEach.");
        const choiceButtonSelector = '#choice-buttons .btn';
        try {
            console.log(`Waiting for button in initial screen...`);
            await page.waitForSelector(choiceButtonSelector, { timeout: 5000, visible: true });
            console.log(`Clicking initial button...`);
            await page.click(choiceButtonSelector);
             // Delay to allow engine to process and display 'askName' node
            await page.waitForTimeout(250);
        } catch (err) {
            console.error(`Error finding or clicking the initial choice button: ${err}`);
            throw new Error(`Failed during initial screen progression. Error: ${err.message}`);
        }
    });

    // *** Testing the CONSEQUENCE of entering name ***
    it('should allow entering a name and proceed to personalized greeting', async () => {
        // --- Prerequisite: Ensure we are on the 'askName' screen ---
        try {
            console.log("Test: 'allow entering name...' starting. Verifying 'askName' state.");
            await waitForTextXPath('text', 'What is your name?', 6000);
            console.log("Waiting for parent container #text-input to be visible...");
            await page.waitForSelector('#text-input', { visible: true, timeout: 5000 });
            console.log("Parent container #text-input is visible.");
            console.log("Waiting for input element #textInput to be visible and interactable...");
            // Use waitForSelector, page.type() has its own waits but this adds explicitness
            await page.waitForSelector('#textInput', { visible: true, timeout: 5000 });
            console.log("#textInput is visible. Prerequisites passed.");
        } catch(err) {
            console.error("Prerequisite failed: Could not confirm 'askName' screen state.", err);
            // Add page screenshot or HTML dump for debugging if needed
            // await page.screenshot({ path: 'error_prereq_screenshot.png' });
            // const html = await page.content();
            // console.error("Page HTML:", html.substring(0, 500) + "..."); // Log snippet
            throw new Error("Setup for name entry test failed.");
        }
        // --- End Prerequisite check ---
    
        const nameToEnter = "Tester";
        const textInputSelector = '#textInput';
        const submitButtonSelector = '#text-submit';
    
        // --- Interaction: Use page.type() ---
        try {
            console.log(`Typing name "${nameToEnter}" into ${textInputSelector}...`);
            await page.type(textInputSelector, nameToEnter); // <-- THE FIX
            console.log(`Successfully typed into ${textInputSelector}.`);
    
            // Optional: Verify the value was set (less critical now, focus on consequences)
            // const inputValue = await page.$eval(textInputSelector, el => el.value);
            // expect(inputValue).toBe(nameToEnter);
            // console.log(`Input value confirmed via $eval: "${inputValue}"`);
    
        } catch (err) {
            console.error(`Error during page.type operation for ${textInputSelector}: ${err.message}`);
             // Add page screenshot or HTML dump for debugging if needed
            // await page.screenshot({ path: 'error_type_screenshot.png' });
            // const html = await page.content();
            // console.error("Page HTML:", html.substring(0, 500) + "..."); // Log snippet
            throw new Error(`Interaction failed during page.type operation. Error: ${err.message}`);
        }
        // --- END Interaction ---
    
        // --- Proceed with submit ---
        try {
            console.log(`Waiting for submit button ${submitButtonSelector} to be visible...`);
            await page.waitForSelector(submitButtonSelector, { visible: true, timeout: 3000 });
            console.log(`Clicking submit button ${submitButtonSelector}...`);
            await page.click(submitButtonSelector);
            // Wait for navigation and rendering of the next node
            console.log("Submit clicked. Waiting for next node processing...");
            // Using waitForTextXPath is better than arbitrary timeout
            // await page.waitForTimeout(300); // Remove this if using waitForTextXPath below
        } catch (err) {
            console.error(`Error clicking submit button ${submitButtonSelector}: ${err.message}`);
            // Add page screenshot or HTML dump for debugging if needed
            // await page.screenshot({ path: 'error_submit_screenshot.png' });
            throw new Error(`Failed to click submit button. Error: ${err.message}`);
        }
    
        // --- Verify CONSEQUENCES on the 'greeting' node ---
        // 1. Check Greeting Text Content
        try {
            const expectedGreetingText = `Hello, ${nameToEnter}!`; // Check for interpolation
            console.log(`Verifying greeting text contains: "${expectedGreetingText}"`);
            await waitForTextXPath('text', expectedGreetingText, 6000); // Use helper to wait for text
            console.log("Personalized greeting text confirmed.");
        } catch (err) {
            console.error(`Error waiting for correct personalized greeting text: ${err.message}`);
            let actualText = 'N/A'; try { actualText = await page.$eval('#text', el => el.innerText); } catch(e){ console.error("Could not get actual text content for debugging."); };
            console.error(`Actual text content found: "${actualText}"`);
             // Add page screenshot or HTML dump for debugging if needed
            // await page.screenshot({ path: 'error_greeting_text_screenshot.png' });
            throw new Error(`Failed to display correct greeting text. Error: ${err.message}`);
        }
    
        // 2. Check Engine State (player.name variable) - Keep this as is
        try {
            console.log("Verifying 'player.name' variable in browser context...");
            const playerNameInBrowser = await page.evaluate(() => {
                return (typeof player !== 'undefined' && player && player.name) ? player.name : 'PLAYER_VAR_NOT_FOUND_OR_NO_NAME';
            });
            console.log(`Value of 'player.name' in browser: "${playerNameInBrowser}"`);
            expect(playerNameInBrowser).toBe(nameToEnter);
            console.log("'player.name' variable correctly updated.");
        } catch (err) {
            console.error(`Error checking 'player.name' state or value mismatch: ${err.message}`);
            throw new Error(`Engine state 'player.name' was not updated correctly. Error: ${err.message}`);
        }
    
        // 3. Check Buttons on Greeting Node - Keep this as is
        try {
            console.log("Verifying choice buttons on greeting node...");
            await page.waitForSelector('#choice-buttons .btn', { visible: true, timeout: 3000 });
            const buttonsText = await page.$$eval('#choice-buttons .btn', btns => btns.map(b => b.textContent.trim()));
            console.log("Greeting node buttons found:", buttonsText);
            expect(buttonsText).toContain('Open the red door');
            expect(buttonsText).toContain('Open the blue door');
            expect(buttonsText.length).toBe(2);
            console.log("Choice buttons on greeting node are correct.");
        } catch (err) {
            console.error(`Error verifying choice buttons on greeting node: ${err.message}`);
            throw new Error(`Failed to verify choice buttons on greeting node. Error: ${err.message}`);
        }
        // --- END Verification of Consequences ---
    
        console.log("Test 'should allow entering a name and proceed' PASSED by verifying consequences.");
    
    }); // End test

}); // End describe block

// --- Placeholder tests ---
describe('Placeholder Integration Tests', () => {
    it.todo('should navigate to red room');
    it.todo('should navigate to blue room and take key');
    it.todo('should show secret option with key and navigate to secret ending');
});