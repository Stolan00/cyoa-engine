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
    describe('CYOA Engine Gameplay Integration', () => {
        jest.setTimeout(timeout);
    
        // No changes to beforeEach needed for now
    
        it('should load the initial game screen and allow progression', async () => {
            const title = await page.title();
            expect(title).toBe('The Simple Choice');
    
            console.log("Initial text confirmed via beforeEach.");
    
            const choiceButtonSelector = '#choice-buttons .btn';
            try {
                console.log(`Waiting for any button matching selector: "${choiceButtonSelector}"`);
                await page.waitForSelector(choiceButtonSelector, { timeout: 5000, visible: true });
                console.log(`Found a visible button. Clicking it...`);
                await page.click(choiceButtonSelector);
    
                // *** ADD DELAY HERE to allow engine to process next node ***
                console.log("Adding short delay after click for engine processing...");
                await page.waitForTimeout(200); // Increased delay (e.g., 200ms)
    
            } catch (err) {
                console.error(`Error finding or clicking the choice button: ${err}`);
                // *** CORRECTED SCREENSHOT TYPO ***
                try {
                    await page.screenshot({ path: 'initial_click_fail_screenshot.png' });
                    console.error("Screenshot taken: initial_click_fail_screenshot.png");
                } catch (screenshotErr) {
                    console.error("Failed to take screenshot during initial click failure:", screenshotErr.message)
                }
                throw new Error(`Failed to find or click a visible choice button (${choiceButtonSelector}). Error: ${err.message}`);
            }
    
            // Check for 'askName' text (implicitly checked by next test's prerequisite)
            // We assume the click triggers navigation towards 'askName'
        });
    
        it('should allow entering a name and proceed', async () => {
            // --- Prerequisite check (Simplified & Waits for Parent First) ---
            try {
                console.log("Test: 'should allow entering a name and proceed' starting.");
    
                // 1. Wait for the 'askName' text to appear (confirm navigation happened)
                await waitForTextXPath('text', 'What is your name?', 6000); // Increased timeout slightly
    
                // 2. Wait for the PARENT container #text-input to become visible
                console.log("Waiting for parent container #text-input to be visible...");
                await page.waitForSelector('#text-input', { visible: true, timeout: 5000 });
                console.log("Parent container #text-input is visible.");
    
                // 3. Wait for the actual input #textInput to be visible inside the container
                console.log("Waiting for input element #textInput to be visible...");
                await page.waitForSelector('#textInput', { visible: true, timeout: 3000 });
                console.log("#textInput is visible.");
    
            } catch(err) {
                console.error("Prerequisite failed: Could not find visible #text-input or #textInput.", err);
                // Debugging info
                try{
                     const parentExists = await page.$('#text-input');
                     const inputExists = await page.$('#textInput');
                     const parentDisplay = parentExists ? await page.$eval('#text-input', el => window.getComputedStyle(el).display) : 'parent_not_found';
                     console.error(`Debug Info: Parent exists? ${!!parentExists}, Input exists? ${!!inputExists}, Parent display: ${parentDisplay}`);
                } catch(debugErr) {
                     console.error("Could not get debug info for input elements.");
                }
                // *** CORRECTED SCREENSHOT TYPO ***
                try {
                    await page.screenshot({ path: 'prereq_fail_screenshot.png' });
                    console.error("Screenshot taken: prereq_fail_screenshot.png");
                } catch (screenshotErr) {
                     console.error("Failed to take screenshot during prerequisite failure:", screenshotErr.message)
                }
                throw new Error("Setup for 'should allow entering a name' failed definitively.");
            }
            // --- End Prerequisite check ---
    
            const nameToEnter = "Tester";
            const textInputSelector = '#textInput';
            const submitButtonSelector = '#text-submit';
    
            // --- Using page.type with delay ---
            try {
                console.log(`Clicking input to focus: ${textInputSelector}`);
                // Click is probably fine now that we know it's visible
                await page.click(textInputSelector);
                await page.waitForTimeout(50); // Small delay after click
    
                console.log(`Typing name: "${nameToEnter}" into ${textInputSelector}`);
                await page.type(textInputSelector, nameToEnter, { delay: 50 });
    
            } catch (err) {
                console.error(`Error clicking or typing into ${textInputSelector}: ${err.message}`);
                // *** CORRECTED SCREENSHOT TYPO ***
                 try {
                    await page.screenshot({ path: 'type_fail_screenshot.png' });
                    console.error("Screenshot taken: type_fail_screenshot.png");
                } catch (screenshotErr) {
                     console.error("Failed to take screenshot during type failure:", screenshotErr.message)
                }
                throw new Error(`Failed during text input interaction. Error: ${err.message}`);
            }
    
            // CHECK: Verify the value was typed correctly
            let typedValue = '';
            try {
                await page.waitForTimeout(100); // Wait after typing
                typedValue = await page.$eval(textInputSelector, el => el.value);
                console.log(`CHECK: Value in <span class="math-inline">\{textInputSelector\} after typing\: "</span>{typedValue}"`);
                expect(typedValue).toBe(nameToEnter);
            } catch (err) {
                console.error(`Error checking value of ${textInputSelector} after typing: ${err.message}`);
                 // *** CORRECTED SCREENSHOT TYPO ***
                 try {
                    await page.screenshot({ path: 'check_fail_screenshot.png' });
                    console.error("Screenshot taken: check_fail_screenshot.png");
                } catch (screenshotErr) {
                     console.error("Failed to take screenshot during check failure:", screenshotErr.message)
                }
                throw new Error(`Failed to verify text input value after typing. Error: ${err.message}`);
            }
    
            // --- Proceed with submit ---
             try {
                console.log(`Clicking submit button: ${submitButtonSelector}`);
                await page.waitForSelector(submitButtonSelector, { visible: true, timeout: 3000 });
                await page.click(submitButtonSelector);
            } catch (err) {
                console.error(`Error clicking submit button ${submitButtonSelector}: ${err.message}`);
                // *** CORRECTED SCREENSHOT TYPO ***
                 try {
                    await page.screenshot({ path: 'submit_click_fail_screenshot.png' });
                    console.error("Screenshot taken: submit_click_fail_screenshot.png");
                } catch (screenshotErr) {
                     console.error("Failed to take screenshot during submit failure:", screenshotErr.message)
                }
                throw new Error(`Failed to click submit button. Error: ${err.message}`);
            }
    
            // --- Verify next state (greeting) ---
             try {
                 const expectedGreetingText = `Hello, ${nameToEnter}!`;
                 console.log(`Waiting for greeting text containing: "${expectedGreetingText}"`);
                 // Give greeting node slightly more time too
                 await waitForTextXPath('text', expectedGreetingText, 6000);
                 console.log("Greeting text confirmed.");
             } catch (err) {
                 console.error(`Error waiting for greeting text: ${err.message}`);
                 // *** CORRECTED SCREENSHOT TYPO ***
                  try {
                    await page.screenshot({ path: 'greeting_fail_screenshot.png' });
                    console.error("Screenshot taken: greeting_fail_screenshot.png");
                } catch (screenshotErr) {
                     console.error("Failed to take screenshot during greeting failure:", screenshotErr.message)
                }
                 throw new Error(`Failed to reach greeting node. Error: ${err.message}`);
             }
    
            // --- Optional Check player.name ---
             // ... (no changes needed) ...
    
            // --- Verify choice buttons ---
             try {
                 console.log("Waiting for choice buttons to be visible...");
                 await page.waitForSelector('#choice-buttons .btn', { visible: true, timeout: 3000 });
                 const buttonsText = await page.$$eval('#choice-buttons .btn', btns => btns.map(b => b.textContent.trim()));
                 console.log("Button Texts Found:", buttonsText);
                 expect(buttonsText).toContain('Open the red door');
                 expect(buttonsText).toContain('Open the blue door');
                 expect(buttonsText.length).toBe(2);
             } catch (err) {
                 console.error(`Error verifying choice buttons on greeting node: ${err.message}`);
                 // *** CORRECTED SCREENSHOT TYPO ***
                  try {
                    await page.screenshot({ path: 'choice_buttons_fail_screenshot.png' });
                    console.error("Screenshot taken: choice_buttons_fail_screenshot.png");
                } catch (screenshotErr) {
                     console.error("Failed to take screenshot during button check failure:", screenshotErr.message)
                }
                 throw new Error(`Failed to verify choice buttons. Error: ${err.message}`);
             }
        }); // End test 'should allow entering a name and proceed'
    
    }); // End describe block

});

// Remove placeholders if adding actual tests above
describe('Placeholder Integration Tests', () => {
    it.todo('should navigate to red room');
    it.todo('should navigate to blue room and take key');
    it.todo('should show secret option with key and navigate to secret ending');
});