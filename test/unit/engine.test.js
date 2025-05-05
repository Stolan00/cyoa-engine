// test/unit/engine.test.js
/**
 * Unit tests for core engine functionality
 */

// Mock DOM elements
document.body.innerHTML = `
<div id="text"></div>
<div id="choice-buttons"></div>
<div id="text-input" style="display: none;">
  <textarea id="textInput"></textarea>
  <button id="text-submit">Submit</button>
</div>
<button id="back-button">Back</button>
`;

// Import or mock your engine functions
// For testing purposes, we'll create mocks that match your existing functions

// Mock global variables from engine.js
global.textElement = document.querySelector('#text');
global.choiceButtonsElement = document.querySelector('#choice-buttons');
global.textInputElement = document.querySelector('#text-input');
global.textInput = document.querySelector('#textInput');
global.textSubmitButton = document.querySelector('#text-submit');
global.navigationHistory = [];
global.state = {};
global.characters = {};
global.genderPronouns = {};
global.player = {};
global.inventory = {};

// Import engine functions directly or mock them
const {
  formatText,
  replacePronouns,
  addStyleTags,
  showTextNode,
  selectChoice,
  goBack,
  showChoice
} = require('../../src/engine.js');

// Mock disk for testing
const mockDisk = () => ({
  startingNode: "intro",
  title: "Test Game",
  characters: {
    "sarah": { gender: "female" },
    "john": { gender: "male" }
  },
  player: {
    name: "TestPlayer",
    gender: "male"
  },
  genderPronouns: {
    "he": { "male": "he", "female": "she" },
    "him": { "male": "him", "female": "her" },
    "his": { "male": "his", "female": "her" }
  },
  inventory: {},
  initGame: jest.fn(),
  textNodes: () => new Map([
    ["intro", () => ({
      id: "intro",
      text: "Test intro text",
      choices: [
        { text: "Option 1", nextText: "node1" },
        { text: "Option 2", nextText: "node2" }
      ]
    })],
    ["node1", () => ({
      id: "node1",
      text: "Test node 1",
      choices: [
        { text: "Back to intro", nextText: "intro" }
      ]
    })],
    ["node2", () => ({
      id: "node2",
      text: "Test node 2 with condition",
      choices: [
        { 
          text: "Secret option", 
          requiredState: (currentState) => currentState.hasKey === true,
          nextText: "secret" 
        },
        { text: "Back to intro", nextText: "intro" }
      ]
    })]
  ])
});

// Tests for formatting functions
describe('Text Formatting', () => {
  test('addStyleTags correctly converts markdown patterns to HTML tags', () => {
    expect(addStyleTags('This is **bold**', '**', 'b')).toBe('This is <b>bold</b>');
    expect(addStyleTags('This is *italic*', '*', 'i')).toBe('This is <i>italic</i>');
    expect(addStyleTags('This is __underlined__', '__', 'u')).toBe('This is <u>underlined</u>');
    expect(addStyleTags('This is ~~strikethrough~~', '~~', 'strike')).toBe('This is <strike>strikethrough</strike>');
  });

  test('formatText handles complex text with multiple formatting tags', () => {
    const input = "This is **bold**, *italic*, and __underlined__ text with ~~strikethrough~~.\nThis is a new line.";
    const expected = "This is <b>bold</b>, <i>italic</i>, and <u>underlined</u> text with <strike>strikethrough</strike>.<br>This is a new line.";
    expect(formatText(input)).toBe(expected);
  });

  test('formatText handles line breaks', () => {
    const input = "Line 1\nLine 2\nLine 3";
    const expected = "Line 1<br>Line 2<br>Line 3";
    expect(formatText(input)).toBe(expected);
  });
});

// Tests for pronoun replacement system
describe('Pronoun Replacement', () => {
  beforeEach(() => {
    // Setup test environment
    global.characters = {
      "sarah": { gender: "female" },
      "john": { gender: "male" }
    };
    
    global.genderPronouns = {
      "he": { "male": "he", "female": "she" },
      "him": { "male": "him", "female": "her" },
      "his": { "male": "his", "female": "her" }
    };
    
    global.player = { gender: "male", name: "TestPlayer" };
  });

  test('replacePronouns handles character pronouns correctly', () => {
    expect(replacePronouns("[sarah.he] went to the store")).toBe("she went to the store");
    expect(replacePronouns("[john.he] took [john.his] dog for a walk")).toBe("he took his dog for a walk");
  });

  test('replacePronouns handles player pronouns correctly', () => {
    expect(replacePronouns("[he] went to the store")).toBe("he went to the store");
    player.gender = "female";
    expect(replacePronouns("[he] went to the store")).toBe("she went to the store");
  });

  test('replacePronouns preserves capitalization', () => {
    expect(replacePronouns("Then [Sarah.he] walked home")).toBe("Then she walked home");
    expect(replacePronouns("[He] is tall")).toBe("He is tall");
  });

  test('replacePronouns ignores unrecognized patterns', () => {
    expect(replacePronouns("This [doesn't match] any pattern")).toBe("This [doesn't match] any pattern");
  });
});

// Tests for choice selection and state management
describe('Choice Selection and State Management', () => {
  beforeEach(() => {
    // Reset state between tests
    global.state = {};
    global.navigationHistory = [];
  });

  test('showChoice displays choices based on required state', () => {
    const choiceWithNoRequirement = { text: "Option 1", nextText: "node1" };
    const choiceWithRequirement = { 
      text: "Option 2", 
      requiredState: (currentState) => currentState.hasKey === true,
      nextText: "node2" 
    };

    // Without required state
    expect(showChoice(choiceWithNoRequirement)).toBe(true);
    expect(showChoice(choiceWithRequirement)).toBe(false);

    // With required state
    global.state = { hasKey: true };
    expect(showChoice(choiceWithRequirement)).toBe(true);
  });

  test('selectChoice updates state correctly', () => {
    // Mock DOM functions
    document.querySelector = jest.fn();
    choiceButtonsElement.querySelectorAll = jest.fn().mockReturnValue([]);
    
    const choice = {
      text: "Take key",
      nextText: "node1",
      setState: { hasKey: true }
    };

    selectChoice(choice);
    expect(global.state).toEqual({ hasKey: true });
  });

  test('selectChoice calls afterSelect function if provided', () => {
    // Setup
    const afterSelectMock = jest.fn();
    choiceButtonsElement.querySelectorAll = jest.fn().mockReturnValue([]);
    
    const choice = {
      text: "Option with callback",
      nextText: "node1",
      afterSelect: afterSelectMock
    };

    selectChoice(choice);
    expect(afterSelectMock).toHaveBeenCalled();
  });
});

// Tests for navigation history
describe('Navigation History', () => {
  beforeEach(() => {
    global.navigationHistory = [];
  });

  test('showTextNode adds node to navigation history', () => {
    // We need to mock functions that would be called by showTextNode
    global.applyFadeInAnimation = jest.fn();
    global.toggleBackButton = jest.fn();
    global.formatText = jest.fn().mockReturnValue("Formatted text");
    global.renderText = jest.fn();
    global.showChoiceButtons = jest.fn();
    global.textNodes = new Map([
      ["testNode", () => ({
        id: "testNode",
        text: "Test node",
        choices: []
      })]
    ]);

    showTextNode("testNode");
    expect(navigationHistory).toContain("testNode");
  });

  test('goBack navigates to previous node in history', () => {
    // Setup
    global.navigationHistory = ["intro", "node1"];
    global.showTextNode = jest.fn();

    goBack();
    expect(showTextNode).toHaveBeenCalledWith("intro");
    expect(navigationHistory).toEqual([]);
  });
});