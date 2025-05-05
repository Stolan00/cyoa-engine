// jest.setup.js
// This file is used to set up the test environment

// Create mock for DOM element that would be returned by page.$$ and similar methods
class MockElementHandle {
    constructor(element) {
      this.element = element;
      this.click = jest.fn().mockResolvedValue(undefined);
      this.type = jest.fn().mockResolvedValue(undefined);
      this.hover = jest.fn().mockResolvedValue(undefined);
    }
  }
  
  // Create more comprehensive mock for Puppeteer's page object
  global.page = {
    goto: jest.fn().mockResolvedValue(undefined),
    click: jest.fn().mockResolvedValue(undefined),
    type: jest.fn().mockResolvedValue(undefined),
    waitForSelector: jest.fn().mockResolvedValue(new MockElementHandle({})),
    evaluate: jest.fn().mockImplementation((fn) => fn()),
    
    // Add Puppeteer's CSS selector methods
    $: jest.fn().mockImplementation((selector) => {
      const element = document.querySelector(selector);
      return element ? new MockElementHandle(element) : null;
    }),
    
    $$: jest.fn().mockImplementation((selector) => {
      const elements = Array.from(document.querySelectorAll(selector));
      return elements.map(element => new MockElementHandle(element));
    }),
    
    // Additional Puppeteer methods if needed
    waitForNavigation: jest.fn().mockResolvedValue(undefined),
    waitForTimeout: jest.fn().mockResolvedValue(undefined)
  };
  
  // Set up DOM elements that your tests expect
  document.body.innerHTML = `
  <div id="text"></div>
  <div id="choice-buttons"></div>
  <div id="text-input" style="display: none;">
    <textarea id="textInput"></textarea>
    <button id="text-submit">Submit</button>
  </div>
  <button id="back-button">Back</button>
  `;
  
  // Add some buttons for tests that check for .btn class
  const choiceButtons = document.querySelector('#choice-buttons');
  choiceButtons.innerHTML = `
    <button class="btn">Option 1</button>
    <button class="btn">Option 2</button>
    <button class="btn">Option 3</button>
  `;
  
  // Mock any global functions from your engine that might be called by tests
  global.applyFadeInAnimation = jest.fn();
  global.toggleBackButton = jest.fn();
  global.renderText = jest.fn();
  global.showChoiceButtons = jest.fn();
  
  // Initialize global variables your engine expects
  global.navigationHistory = [];
  global.state = {};
  global.characters = {};
  global.genderPronouns = {};
  global.player = {};
  global.inventory = {};

// Add these to your jest.setup.js
page.$eval = jest.fn().mockImplementation((selector, pageFunction) => {
    const element = document.querySelector(selector);
    return pageFunction(element);
  });
  
  page.$$eval = jest.fn().mockImplementation((selector, pageFunction) => {
    const elements = Array.from(document.querySelectorAll(selector));
    return pageFunction(elements);
  });
  
  page.evaluate = jest.fn().mockImplementation((fn) => fn());
  
  page.keyboard = {
    press: jest.fn().mockResolvedValue(undefined),
    type: jest.fn().mockResolvedValue(undefined)
  };
  
  page.title = jest.fn().mockResolvedValue('The Simple Choice');