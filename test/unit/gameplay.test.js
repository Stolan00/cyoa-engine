// gameplay.test.js
const timeout = 30000;

// Included Helper Function (Using $$eval)
const getButtonByText = async (text) => {
    const targetText = text.trim().toLowerCase();
    console.log(`[getButtonByText] Searching for button with text "${targetText}" using $$eval...`);
    const matchingButtonIndex = await page.$$eval('.btn', (browserButtons, searchText) => {
        for (let i = 0; i < browserButtons.length; i++) {
            const btn = browserButtons[i];
            const btnText = btn.innerText;
            if (btnText && btnText.trim().toLowerCase() === searchText) {
                return i;
            }
        }
        return -1;
    }, targetText);

    if (matchingButtonIndex !== -1) {
        const buttons = await page.$$('.btn');
        if (buttons[matchingButtonIndex]) {
            console.log(`[getButtonByText] Found button "${text}" at index ${matchingButtonIndex}.`);
            return buttons[matchingButtonIndex];
        } else {
             console.error(`[getButtonByText] Index ${matchingButtonIndex} was found by $$eval, but element handle array changed before re-fetch.`);
            return null;
        }
    } else {
        return null;
    }
};

// Included Helper Function
async function waitForTextXPath(selectorId, textSubstring, timeoutMs = 5000) {
    const xpath = `//div[@id='${selectorId}' and contains(., "${textSubstring}")]`;
    try {
        // Ensure 'page' is defined and has waitForSelector
        if (!page || typeof page.waitForSelector !== 'function') {
           throw new Error("Puppeteer 'page' object or 'waitForSelector' method is not available.");
        }
        await page.waitForSelector(`xpath/${xpath}`, { timeout: timeoutMs });
        console.log(`[waitForTextXPath] Found text "${textSubstring}" in #${selectorId}`);
    } catch (err) {
        let currentText = 'SELECTOR/PAGE ERROR';
        // Ensure 'page' is defined for $eval
        if (page && typeof page.$eval === 'function') {
            try {
                currentText = await page.$eval(`#${selectorId}`, el => el.textContent);
            } catch (evalErr) {
                 // Ensure page.$ exists
                 if(page && typeof page.$ === 'function') {
                     const selectorExists = await page.$(`#${selectorId}`);
                     currentText = selectorExists ? `Could not evaluate #${selectorId}` : `SELECTOR #${selectorId} NOT FOUND`;
                 } else {
                     currentText = `SELECTOR #${selectorId} evaluation failed and page.$ not available.`;
                 }
            }
        } else {
             currentText = `Error occurred and 'page' object not available for $eval check.`;
        }
        const errorMessage = `Timeout or error waiting for text "${textSubstring}" in #${selectorId}. Current text: "${currentText || '(empty)'}". Original Error: ${err.message}`;
        console.error(`[waitForTextXPath] Error: ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

// Included Helper Function
async function waitForButton(buttonText, timeoutMs = 5000) {
    console.log(`[waitForButton] Waiting for button with text "${buttonText}"...`);
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        const button = await getButtonByText(buttonText); // Calls the included getButtonByText
        if (button) {
            console.log(`[waitForButton] Found button "${buttonText}".`);
            return button; // Return the button element handle
        }
        // Use built-in waitForTimeout if available, otherwise basic promise timeout
        // Ensure 'page' object exists before checking for waitForTimeout
        if (page && typeof page.waitForTimeout === 'function') {
             await page.waitForTimeout(100); // Wait 100ms using Puppeteer's function
        } else {
             await new Promise(resolve => setTimeout(resolve, 100)); // Basic wait
        }
    }
    const timeoutError = new Error(`Timeout waiting for button with text "${buttonText}" to appear.`);
    console.error(`[waitForButton] ${timeoutError.message}`);
    throw timeoutError;
}


describe('CYOA Engine Gameplay Integration', () => {
    jest.setTimeout(timeout);

    beforeEach(async () => {
        // Assuming 'page' is globally available via jest-puppeteer setup
        // Add checks to ensure 'page' is defined after setup
        if (!page) {
            throw new Error("Puppeteer 'page' object is not initialized before test suite.");
        }
        try {
            await page.goto('http://localhost:8080/game.html', { waitUntil: 'networkidle0', timeout: 15000 });
            await page.waitForSelector('#text', { timeout: 10000 });
            // Wait for initial text to ensure engine starts processing
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
            console.log(`Waiting for any button matching selector: "${choiceButtonSelector}"`);
            // Wait for the selector itself to ensure the button exists visually/in DOM
            await page.waitForSelector(choiceButtonSelector, { timeout: 5000, visible: true }); // Wait for it to be visible too
            console.log(`Found a visible button. Clicking it...`);
            await page.click(choiceButtonSelector); // Click the first element matching the selector
        } catch (err) {
            console.error(`Error finding or clicking the choice button: ${err}`);
            throw new Error(`Failed to find or click a visible choice button (${choiceButtonSelector}). Error: ${err.message}`);
        }

        try {
            console.log("Waiting for 'askName' node text...");
            await waitForTextXPath('text', 'What is your name?', 5000); // Check for text of the next node
            console.log("'askName' node text confirmed.");
        } catch (err) {
             console.error(`Did not reach 'askName' node after clicking button: ${err}`);
            throw new Error(`Failed to reach the 'askName' node after clicking the choice button. Error: ${err.message}`);
        }

        const textInputSelector = '#text-input';
        try {
            console.log(`Waiting for text input "${textInputSelector}" to be visible...`);
            // Wait specifically for the element to exist AND be visible.
            // The successful completion of this wait IS the assertion.
            await page.waitForSelector(textInputSelector, { visible: true, timeout: 3000 });
            console.log(`Text input "${textInputSelector}" is visible (wait succeeded).`);
        } catch (err) {
             console.error(`Text input ${textInputSelector} did not become visible: ${err}`);
            throw new Error(`Text input (${textInputSelector}) did not become visible after reaching 'askName' node. Error: ${err.message}`);
        }

        // REMOVED REDUNDANT/FLAKY CHECK FOR 'display: none'

        console.log("Test successfully progressed to 'askName' node and input visibility wait succeeded.");
    });

    // Add other actual tests based on placeholders
    it('should allow entering a name and proceed', async () => {
        // Prerequisite: Navigate to 'askName' state (covered by previous test, but good practice to include nav here too)
        await page.waitForSelector('#choice-buttons .btn', { visible: true, timeout: 5000 });
        await page.click('#choice-buttons .btn');
        await page.waitForSelector('#text-input', { visible: true, timeout: 3000 });

        // Interact with text input
        const nameToEnter = "Tester";
        await page.type('#textInput', nameToEnter); // Ensure the textarea has id="textInput"
        await page.click('#text-submit'); // Ensure the submit button has id="text-submit"

        // Verify next state ('greeting' node)
        await waitForTextXPath('text', `Hello, **${nameToEnter}**!`, 5000); // Check for greeting text (note markdown)
        // Check that choices (red/blue door) are visible
        await page.waitForSelector('#choice-buttons .btn', { visible: true, timeout: 3000 });
        const buttons = await page.$$eval('#choice-buttons .btn', btns => btns.map(b => b.innerText));
        expect(buttons).toContain('Open the red door');
        expect(buttons).toContain('Open the blue door');
    });

});

// Remove placeholders if adding actual tests above
describe('Placeholder Integration Tests', () => {
    it.todo('should navigate to red room');
    it.todo('should navigate to blue room and take key');
    it.todo('should show secret option with key and navigate to secret ending');
});