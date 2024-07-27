//-----------------------------------------------------------------------
const textElement          = document.querySelector('#text')
const choiceButtonsElement = document.querySelector('#choice-buttons')
const textInputElement     = document.querySelector('#text-input');
const textInput            = document.querySelector('#textInput');
const textSubmitButton     = document.querySelector('#text-submit');
const navigationHistory    = [];

let state = {};

let gameDisk;

let textNodes;

let currentChoiceIndex = -1;
let currentChoices = [];

// Support for optional objects in game disks.
let characters;
let genderPronouns;
let player;
let inventory;
//-----------------------------------------------------------------------
let startGame = (diskFile) => {
    gameDisk = diskFile();

    setTitle();

    initializeGame();

    loadText();

    showTextNode(gameDisk.startingNode);
}
//-----------------------------------------------------------------------
function setTitle() {
    if (gameDisk.title) document.getElementById('dynamicTitle').textContent = gameDisk.title;
    else document.getElementById('dynamicTitle').textContent = "cyoa-engine";
}
//-----------------------------------------------------------------------
function initializeGame() {
    navigationHistory.length = 0; //clear nav history on start
    textInput.value = null; //dont know if its worth it to instantiate every time i need it or not (probably not)

    //this probably needs to go in its own function along with the other listeners
    textInput.addEventListener('input', function() {
        const baseHeight = 40; // this should probably query the CSS for the base height rather than being explicitly set to 40
                                //that said i could also just fix it so using height 'auto' doesnt set it to 56px with a single line of text anymore (probably some other css property is causing the error)
        this.style.height = baseHeight + 'px'; // Reset to base height before recalculating
    
        // Calculate the desired height based on scrollHeight, but ensure it's not less than the base height
        const newHeight = Math.max(this.scrollHeight, baseHeight);
        this.style.height = newHeight + 'px';
        console.log(this.style.height);
    });
    
    initializeVariables();

    gameDisk.initGame();
}
//-----------------------------------------------------------------------
function initializeVariables() {
    characters     = gameDisk.characters;
    genderPronouns = gameDisk.genderPronouns;
    player         = gameDisk.player;
    inventory      = gameDisk.inventory;
}
//-----------------------------------------------------------------------
let loadText = () => {
    if ( !gameDisk ) return;

    textNodes = gameDisk.textNodes();

    console.log('Text Loaded');
}
//-----------------------------------------------------------------------
// Support for keyboard navigation when selecting choices
function updateChoiceHighlight(index) {
    const buttons = document.querySelectorAll('.btn');

    if (!buttons.length) return;

    // remove hover from all buttons
    buttons.forEach(button => {
        button.classList.remove('hover');
    });
    
    // hover current
    if (index >= 0 && index < buttons.length) 
        buttons[index].classList.add('hover');
}
//-----------------------------------------------------------------------
// Deselects all choices
function resetChoiceIndex() {
    currentChoiceIndex = -1;
    updateChoiceHighlight();
}
//-----------------------------------------------------------------------
function changeChoiceIndex(change) {
    if (!currentChoices.length) return;

    const noChoiceActive = currentChoiceIndex === -1;

    const changeDirection = (change > 0 ? "RIGHT" : "LEFT");
    
    if ( noChoiceActive )
        currentChoiceIndex = changeDirection === "RIGHT" ? -1 : 0;

    // Wrap around
    currentChoiceIndex = (currentChoiceIndex + change + currentChoices.length) % currentChoices.length;

    updateChoiceHighlight(currentChoiceIndex);
}
//-----------------------------------------------------------------------
function selectCurrentChoice() {
    const buttons = document.querySelectorAll('.btn');

    if ( !buttons.length || currentChoiceIndex < 0 || currentChoiceIndex >= buttons.length ) return;

    buttons[currentChoiceIndex].click(); 
}
//-----------------------------------------------------------------------
// For when no choice is active but we need to go to the next page 
function advanceToNextNode() { 
    let currentTextNode = null;        

    if (navigationHistory.length < 0) return;

    const textNodeFunction = textNodes.get(navigationHistory[navigationHistory.length - 1]);

    if (textNodeFunction) {
        currentTextNode = textNodeFunction();
        
        if (currentTextNode.choices != null && currentTextNode.choices.length)
            selectChoice(currentTextNode.choices[0]); // Select the first choice
                                                      // Note: if 'choices' element does not exist in textNode, engine will create a default button with the text ("Next")
    }
    else console.log("NOTHING HAPPENED");
}
//-----------------------------------------------------------------------
// Keyboard listener for keydown on the entire document
document.addEventListener('keydown', function(event) {
    const textInputActive = document.activeElement === textInput; // check for textbox selected

    if (textInputActive) return;

    const noChoiceActive = currentChoiceIndex === -1;
    const left = -1, right = 1;

    switch (event.key) {
        case 'Enter': //next page or select choice
        case ' ':
            if ( noChoiceActive ) {
                event.preventDefault();
                advanceToNextNode();
            } 
            else selectCurrentChoice();

            break;

        case 'ArrowLeft': 
        case 'a':
        case 'A':
            changeChoiceIndex(right);
            break;

        case 'ArrowRight':
        case 'd':
        case 'D':
            changeChoiceIndex(left);
            break;

        // will maybe add up and down in the grid at some point

        case 'Backspace': // Previous page
            event.preventDefault();
            goBack();
            break;

        case 'Escape': // Erase highlight
            resetChoiceIndex();
            
        default: break;
    }

    // Adding event listener for the "Back" button
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', goBack);
    }
});
//-----------------------------------------------------------------------
document.addEventListener('click', function(event) {
    if (!event.target.closest('.btn')) { //make sure we didn't click a button
        resetChoiceIndex();
    }
});
//-----------------------------------------------------------------------  
function applyFadeInAnimation(element) {
    // remove fade in
    element.classList.remove('fade-in');

    // trigger reflow to restart the animation
    void element.offsetWidth;

    //restart animation
    element.classList.add('fade-in');
}
//-----------------------------------------------------------------------
let showTextNode = (textNodeIndex) => { // Using let for easy overriding by user
    if(textNodeIndex === "restart") return startGame();

    let textNodeFunction = textNodes.get(textNodeIndex);
    let textNode = textNodeFunction ? textNodeFunction() : null;

    console.log("Showing text node:", textNodeIndex);
    console.log("Current navigation history:", navigationHistory);

    window.scrollTo(0, 0);
    
    if (navigationHistory[navigationHistory.length - 1] !== textNodeIndex) { // if node isnt already in history stack (works but dont like it)
        navigationHistory.push(textNodeIndex); //add it 
    }

    currentChoices = textNode ? textNode.choices : [];

    applyFadeInAnimation(textElement);

    toggleBackButton(textNode.hideBackButton);

    let formattedText = formatText(textNode.text);

    console.log("State: ", state);
    
    renderText(formattedText);

    if (textNode.input) {
        handleTextInput(textNode);
    } 
    else {
        showChoiceButtons(textNode);
    }
}
//-----------------------------------------------------------------------
function toggleBackButton(shouldHide) {
    const backButton = document.getElementById('back-button');
    backButton.style.display = shouldHide ? 'none' : 'block';
}
//-----------------------------------------------------------------------
function renderText(text) {
    textElement.innerHTML = text;
}
//-----------------------------------------------------------------------
// Read special characters and convert them to HTML tags
// string, string, string -> string
// source: text-engine by okaybenji on github
let addStyleTags = (str, char, tagName) => {
    let odd = true;

    while (str.includes(char)) {
      const tag = odd ? `<${tagName}>` : `</${tagName}>`;
      str = str.replace(char, tag);
      odd = !odd;
    }
  
    return str;
  };
//-----------------------------------------------------------------------
// Handles processing for text box input
function handleTextInput(textNode) {
    choiceButtonsElement.style.display = 'none';
    textInputElement.style.display = 'block';
    textInput.value = '';
    textInput.focus();

    const submitText = () => {
        const textValue = textInput.value;

        if (typeof textNode.afterEnter === 'function') textNode.afterEnter();

        showTextNode(textNode.nextText); // next node after you click submit

        // clean up event listeners
        textSubmitButton.removeEventListener('click', submitText);
        textInput.removeEventListener('keydown', handleEnterKey);

        return textValue;
    };

    const handleEnterKey = (event) => {
        if (event.key === 'Enter') {
            submitText();
        }
    };

    // add click listener
    textSubmitButton.addEventListener('click', submitText);

    // add keydown listener
    textInput.addEventListener('keydown', handleEnterKey);
}
//-----------------------------------------------------------------------
function showChoiceButtons(textNode) {
    choiceButtonsElement.style.display = 'grid';

    textInputElement.style.display = 'none';

    const singleChoice = textNode.choices.length === 1;

    choiceButtonsElement.style.gridTemplateColumns = singleChoice ? "auto" : "repeat(2, auto)";

    clearChoiceButtons();

    textNode.choices.forEach(choice => {
        createChoiceButton(choice);
    });

    resetChoiceIndex();
}
//-----------------------------------------------------------------------
function clearChoiceButtons() {
    while (choiceButtonsElement.firstChild) {
        choiceButtonsElement.removeChild(choiceButtonsElement.firstChild);
    }
}
//-----------------------------------------------------------------------
function createChoiceButton(choice) {
    const button = document.createElement('button');

    button.innerText = (choice.text ? choice.text : "Next"); //default text is Next

    button.classList.add('btn');
    button.addEventListener('click', () => selectChoice(choice));
    choiceButtonsElement.appendChild(button);
}
//----------------------------------------------------------------------- 
function showChoice(choice) {
    return choice.requiredState == null || choice.requiredState(state) //this checks if player has right state to show the option
}
//-----------------------------------------------------------------------
function removeChoiceButtonListeners() {
    const buttons = choiceButtonsElement.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.remove();
        }
    );
}
//-----------------------------------------------------------------------
function selectChoice(choice) {
    const nextTextNodeId = choice.nextText;

    if (nextTextNodeId === "start") return startGame();
    
    state = Object.assign(state, choice.setState);

    if(choice.afterSelect) choice.afterSelect();

    removeChoiceButtonListeners(); //cleanup listeners

    showTextNode(nextTextNodeId);
}
//-----------------------------------------------------------------------
// support for markdown-like tags in text. Curently supports underline, bold, italic, and strikethrough. Also supports replacing newline characters with <br> tags.
// also supports intuitive writing system for player/npc gender pronouns, see documentation
// styletags sourced from text-engine by okaybenji on github
function formatText(str) {
    str = addStyleTags(str, '__', 'u');
    str = addStyleTags(str, '**', 'b');
    str = addStyleTags(str, '*', 'i');
    str = addStyleTags(str, '~~', 'strike');
    
    // maintain line breaks
    while (str.includes('\n')) {
    str = str.replace('\n', '<br>');
    }

    //replace pronoun tags
    str = replacePronouns(str);

    return str;
}
//-----------------------------------------------------------------------
function replacePronouns(text) {
    return text.replace(/\[([^\]]+)\]/g, (match, placeholder) => {
        let pronounMapping, gender, pronoun;

        const key = placeholder;

        const isNPC = key.includes(".") && (key.match(/\./g) || []).length === 1; //an NPC's pronoun tag should contain only a single dot
        
        if ( isNPC ) {
            const [name, charPronoun] = key.split(".");
            
            if (characters[name]) gender = characters[name].gender;

            pronounMapping = genderPronouns[charPronoun.toLowerCase()]
            pronoun = charPronoun;
        }

        else { //not an NPC, default to player gender
            pronounMapping = genderPronouns[key.toLowerCase()];

            if (player.gender) gender = player.gender;

            else if (characters["player"].gender) gender = characters["player"].gender

            pronoun = placeholder;
        }

        // If there's a custom pronoun mapping for this key and gender, use it; otherwise, keep the placeholder
        if (pronounMapping && pronounMapping[gender]) { //eg if "[He]" is present in text and in the pronoun mapping, and "male" is present in the mapping list
            let replacement = pronounMapping[gender];
            
            // Check if the original placeholder was uppercase and adjust the replacement accordingly
            if (pronoun[0] === pronoun[0].toUpperCase()) {
                // Capitalize the first letter of the replacement if the placeholder was capitalized
                replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
            }
            return replacement;

        }
        else {
            // If no mapping found, return the original placeholder (with brackets)
            return match;
        }
    });
}
//-----------------------------------------------------------------------
function goBack() {
    //console.log("Initial navigation history (before goBack):", navigationHistory);

    if (navigationHistory.length < 1) return startGame();

    const currentTextNodeId = navigationHistory.pop();

    let previousTextNodeId = navigationHistory.pop(); //node before current

    console.log("Going back to:", previousTextNodeId);
    console.log("Navigation history (after goBack):", navigationHistory);
    
    showTextNode(previousTextNodeId);
}
