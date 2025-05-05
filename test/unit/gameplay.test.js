// test/integration/gameplay.test.js
/**
 * Integration tests for CYOA Engine gameplay
 * Using Jest + Puppeteer to test real browser interactions
 */

const timeout = 30000;

describe('CYOA Engine Gameplay', () => {
  // Set longer timeout for browser tests
  jest.setTimeout(timeout);

  beforeAll(async () => {
    // Navigate to the application
    await page.goto('http://localhost:8080');
  });

  it('should load the initial game screen', async () => {
    // Check that the title is set correctly
    const title = await page.title();
    expect(title).toContain('The Simple Choice');

    // Check that the intro text is displayed
    const textContent = await page.$eval('#text', el => el.textContent);
    expect(textContent).toContain('Welcome! This is a tiny demonstration.');
  });

  it('should allow player to enter name and continue', async () => {
    // Click the Next button to proceed
    await page.click('.btn');

    // Wait for the name input to appear
    await page.waitForSelector('#textInput:not([style*="display: none"])');

    // Enter a player name
    await page.type('#textInput', 'TestPlayer');
    
    // Submit the name
    await page.click('#text-submit');

    // Check that the greeting includes the player name
    const greetingText = await page.$eval('#text', el => el.textContent);
    expect(greetingText).toContain('Hello, TestPlayer!');
    expect(greetingText).toContain('You find yourself in a room with two doors.');
  });

  it('should navigate to the red room and back', async () => {
    // Click the "Open the red door" option
    const buttons = await page.$$('.btn');
    await buttons[0].click();

    // Verify we're in the red room
    let roomText = await page.$eval('#text', el => el.textContent);
    expect(roomText).toContain('You enter a room that is entirely red');
    
    // Go back to the main room
    const backOptions = await page.$$('.btn');
    await backOptions[0].click();
    
    // Verify we're back at the greeting
    const mainRoomText = await page.$eval('#text', el => el.textContent);
    expect(mainRoomText).toContain('Hello, TestPlayer!');
    expect(mainRoomText).toContain('You find yourself in a room with two doors');
  });

  it('should navigate to the blue room and acquire a key', async () => {
    // Click the "Open the blue door" option
    const buttons = await page.$$('.btn');
    await buttons[1].click();

    // Verify we're in the blue room and found a key
    const blueRoomText = await page.$eval('#text', el => el.textContent);
    expect(blueRoomText).toContain('You enter a room that is entirely blue');
    expect(blueRoomText).toContain('You find a small key');
    
    // Take the key and go back
    await page.click('.btn');
    
    // Verify we're back at the greeting
    const mainRoomText = await page.$eval('#text', el => el.textContent);
    expect(mainRoomText).toContain('Hello, TestPlayer!');
  });

  it('should now show the secret option in the red room', async () => {
    // Go back to the red room
    const buttons = await page.$$('.btn');
    await buttons[0].click();
    
    // Verify we're in the red room
    const redRoomText = await page.$eval('#text', el => el.textContent);
    expect(redRoomText).toContain('You enter a room that is entirely red');
    
    // Now check for the secret option that should be visible since we have the key
    const options = await page.$$('.btn');
    expect(options.length).toBe(2); // Should have two options now
    
    // Get text of the second button (the secret option)
    const secretButtonText = await page.$eval('.btn:nth-child(2)', el => el.textContent);
    expect(secretButtonText).toContain('Check for secrets');
  });

  it('should complete the game by finding the secret exit', async () => {
    // Click the secret option
    const buttons = await page.$$('.btn');
    await buttons[1].click();
    
    // Verify we reached the secret ending
    const endingText = await page.$eval('#text', el => el.textContent);
    expect(endingText).toContain('Congratulations, TestPlayer!');
    expect(endingText).toContain('You found the secret exit!');
    
    // Verify there's a Play Again button
    const playAgainButton = await page.$eval('.btn', el => el.textContent);
    expect(playAgainButton).toContain('Play Again?');
  });
});

// test/integration/navigation.test.js
/**
 * Integration tests for navigation features in CYOA Engine
 */

describe('CYOA Engine Navigation Features', () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    await page.goto('http://localhost:8080');
  });

  it('should support keyboard navigation', async () => {
    // Go to the greeting screen
    await page.click('.btn'); // Click Next from intro
    await page.waitForSelector('#textInput:not([style*="display: none"])');
    await page.type('#textInput', 'KeyboardUser');
    await page.click('#text-submit');
    
    // Use arrow keys for navigation
    await page.keyboard.press('ArrowRight');
    
    // Verify a choice is highlighted (has 'hover' class)
    const hasHighlightedChoice = await page.evaluate(() => {
      const buttons = document.querySelectorAll('.btn');
      return Array.from(buttons).some(button => button.classList.contains('hover'));
    });
    expect(hasHighlightedChoice).toBe(true);
    
    // Select the choice with Enter key
    await page.keyboard.press('Enter');
    
    // Verify we navigated to the red room
    const redRoomText = await page.$eval('#text', el => el.textContent);
    expect(redRoomText).toContain('You enter a room that is entirely red');
  });

  it('should support back button navigation', async () => {
    // Click the visible back button
    await page.click('#back-button');
    
    // Verify we're back at the greeting screen
    const mainRoomText = await page.$eval('#text', el => el.textContent);
    expect(mainRoomText).toContain('You find yourself in a room with two doors');
    
    // Use keyboard backspace for back navigation
    await page.click('.btn'); // Go back to red room
    const redRoomText = await page.$eval('#text', el => el.textContent);
    expect(redRoomText).toContain('You enter a room that is entirely red');
    
    await page.keyboard.press('Backspace');
    
    // Verify we're back at the greeting screen again
    const mainRoomText2 = await page.$eval('#text', el => el.textContent);
    expect(mainRoomText2).toContain('You find yourself in a room with two doors');
  });
});

// test/integration/state.test.js
/**
 * Integration tests for state management in CYOA Engine
 */

describe('CYOA Engine State Management', () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    await page.goto('http://localhost:8080');
  });

  it('should remember state changes between rooms', async () => {
    // Start a new game
    await page.evaluate(() => {
      startGame(disk);
    });
    
    // Go through initial screens
    await page.click('.btn');
    await page.waitForSelector('#textInput:not([style*="display: none"])');
    await page.type('#textInput', 'StateUser');
    await page.click('#text-submit');
    
    // Go to blue room and get key
    const blueOption = await page.$$('.btn');
    await blueOption[1].click();
    await page.click('.btn'); // Take key
    
    // Go to red room
    const redOption = await page.$$('.btn');
    await redOption[0].click();
    
    // Verify secret option shows up
    const options = await page.$$('.btn');
    expect(options.length).toBe(2);
    
    // Go back to blue room to check if it remembers we have the key
    await page.click('#back-button');
    const doorOptions = await page.$$('.btn');
    await doorOptions[1].click();
    
    // Verify blue room text has changed to indicate we already have the key
    const blueRoomText = await page.$eval('#text', el => el.textContent);
    expect(blueRoomText).toContain('You already took the small key');
  });
});

// test/integration/textInput.test.js
/**
 * Integration tests for text input in CYOA Engine
 */

describe('CYOA Engine Text Input', () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    await page.goto('http://localhost:8080');
  });

  it('should process input and use it in later text', async () => {
    // Start a new game
    await page.evaluate(() => {
      startGame(disk);
    });
    
    // Go to name input screen
    await page.click('.btn');
    
    // Test the text input field
    await page.waitForSelector('#textInput:not([style*="display: none"])');
    await page.type('#textInput', 'CustomPlayerName');
    
    // Submit text with Enter key instead of clicking button
    await page.keyboard.press('Enter');
    
    // Verify the input was processed
    const greetingText = await page.$eval('#text', el => el.textContent);
    expect(greetingText).toContain('Hello, CustomPlayerName!');
    
    // Continue to the end to check for name persistence
    await page.click('.btn'); // Go to blue room
    await page.click('.btn'); // Take key
    await page.click('.btn'); // Go to red room
    
    // Click the secret option
    const secretOption = await page.$$('.btn');
    await secretOption[1].click();
    
    // Check that the name is used in the ending text
    const endingText = await page.$eval('#text', el => el.textContent);
    expect(endingText).toContain('Congratulations, CustomPlayerName!');
  });
});

// test/integration/restart.test.js
/**
 * Integration tests for game restart functionality
 */

describe('CYOA Engine Restart Functionality', () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    await page.goto('http://localhost:8080');
  });

  it('should restart the game when selecting the Play Again option', async () => {
    // Start and play through the game quickly to reach the ending
    await page.click('.btn'); // Intro -> Name
    await page.waitForSelector('#textInput:not([style*="display: none"])');
    await page.type('#textInput', 'RestartUser');
    await page.click('#text-submit'); // Name -> Greeting
    await page.click('.btn:nth-child(2)'); // Greeting -> Blue Room
    await page.click('.btn'); // Blue Room -> Greeting with key
    await page.click('.btn:nth-child(1)'); // Greeting -> Red Room
    
    // Click the secret option that should be available
    const secretOption = await page.$$('.btn');
    await secretOption[1].click(); // Red Room -> Secret Ending
    
    // Click Play Again
    await page.click('.btn');
    
    // Verify we're back at the intro
    const introText = await page.$eval('#text', el => el.textContent);
    expect(introText).toContain('Welcome! This is a tiny demonstration');
    
    // Verify state was reset (check console.log output)
    const consoleOutput = await page.evaluate(() => {
      return JSON.stringify(state);
    });
    expect(consoleOutput).toBe('{}');
  });
});