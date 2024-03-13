//-----------------------------------------------------------------------
const textElement = document.getElementById('text')
const choiceButtonsElement = document.getElementById('choice-buttons')
const nameInputElement = document.getElementById('name-input');
const nameInput = document.getElementById('name');
const nameSubmitButton = document.getElementById('name-submit');
const navigationHistory = [];

let state = {};

let gameDisk;
let textNodes;

let currentChoiceIndex = -1;
let currentChoices = [];
//-----------------------------------------------------------------------
let startGame = (diskFile) => {
    gameDisk = diskFile();

    initializeGame(gameDisk);

    loadText(gameDisk);

    showTextNode(gameDisk.startingNode);
}
//-----------------------------------------------------------------------
function initializeGame(gameDisk) {
    navigationHistory.length = 0; //clear nav history on start

    gameDisk.initGame();
}
//-----------------------------------------------------------------------
let loadText = (gameDisk) => {
    if ( !gameDisk ) return;

    textNodes = gameDisk.textNodes();

    console.log('Text Loaded');
}

//-----------------------------------------------------------------------
// keyboard navigation
function updateChoiceHighlight(index) {
    const buttons = document.querySelectorAll('.btn');

    if (buttons.length === 0) return;

    // remove hover from all buttons
    buttons.forEach(button => {
        button.classList.remove('hover');
    });
    
    // hover current
    if (index >= 0 && index < buttons.length) {
        buttons[index].classList.add('hover');
    }
}
//-----------------------------------------------------------------------
function resetChoiceIndex() {
    currentChoiceIndex = -1;
    updateChoiceHighlight();
}
//-----------------------------------------------------------------------
function changeChoiceIndex(change) {
    if (!currentChoices.length) return;

    const change_direction = (change > 0 ? "RIGHT" : "LEFT");
    
    if (currentChoiceIndex === -1) { //if no choice is active
    currentChoiceIndex = change_direction === "RIGHT" ? -1 : 0;
    }

    // wrap around
    currentChoiceIndex = (currentChoiceIndex + change + currentChoices.length) % currentChoices.length;

    updateChoiceHighlight(currentChoiceIndex);
}
//-----------------------------------------------------------------------
function selectCurrentChoice() {
    const buttons = document.querySelectorAll('.btn');
    if (!buttons.length || currentChoiceIndex < 0 || currentChoiceIndex >= buttons.length) return;

    buttons[currentChoiceIndex].click(); 
}

//-----------------------------------------------------------------------
function advanceToNextNode() { //for when no choice is active but we need to go to the next page 
    let currentTextNode = null;        

    if (navigationHistory.length < 0) return;

    const textNodeFunction = textNodes.get(navigationHistory[navigationHistory.length - 1]);

    if (textNodeFunction) {
        currentTextNode = textNodeFunction();

        
        if (currentTextNode.choices != null && currentTextNode.choices.length)
            selectChoice(currentTextNode.choices[0]); //first choice
        else 
        {
            //why is this here? isnt there always a choice? why do we need the else branch?
            showTextNode(currentTextNode.nextText);
        }
    }
    else console.log("NOTHING HAPPENED");
}
//-----------------------------------------------------------------------
// keyboard listener for keydown on the entire document
document.addEventListener('keydown', function(event) {
    const textInputActive = document.activeElement === nameInput; // check for textbox selected

    if (textInputActive) return;

    switch (event.key) {
        case 'Enter': //next page or select choice
        case ' ':
            if (currentChoiceIndex === -1) {
                event.preventDefault();
                advanceToNextNode();
            } else {
                selectCurrentChoice();
            }
            break;

        case 'ArrowLeft': //move choice index left
        case 'a':
        case 'A':
            changeChoiceIndex(1); // left
            break;

        case 'ArrowRight': //move choice index right
        case 'd':
        case 'D':
            changeChoiceIndex(-1); // right
            break;

        // will maybe add up and down in the grid at some point

        case 'Backspace': //previous page
            event.preventDefault();
            goBack();
            break;

        case 'Escape': //erase annoying highlight
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
let showTextNode = (textNodeIndex) => { //using let for easy overriding by user
//function showTextNode(textNodeIndex) {

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
        handleTextInput(textNode.nextText);
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
function handleTextInput(nextText) {
    choiceButtonsElement.style.display = 'none';
    nameInputElement.style.display = 'block';
    nameInput.focus();

    const submitName = () => {
        const playerName = nameInput.value;
        state.playerName = playerName;
        showTextNode(nextText); // next node after you click submit

        // clean up event listeners
        nameSubmitButton.removeEventListener('click', submitName);
        nameInput.removeEventListener('keydown', handleEnterKey);
    };

    const handleEnterKey = (event) => {
        if (event.key === 'Enter') {
            submitName();
        }
    };

    // add click listener
    nameSubmitButton.addEventListener('click', submitName);

    // add keydown listener
    nameInput.addEventListener('keydown', handleEnterKey);
}
//-----------------------------------------------------------------------
function showChoiceButtons(textNode) {
    choiceButtonsElement.style.display = 'grid';

    nameInputElement.style.display = 'none';

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

    removeChoiceButtonListeners(); //cleanup listeners

    showTextNode(nextTextNodeId);
}
//-----------------------------------------------------------------------
// support for markdown-like tags in text. Curently supports underline, bold, italic, and strikethrough. Also supports replacing newline characters with <br> tags.
// source: text-engine by okaybenji on github
function formatText(str) {
    str = addStyleTags(str, '__', 'u');
    str = addStyleTags(str, '**', 'b');
    str = addStyleTags(str, '*', 'i');
    str = addStyleTags(str, '~~', 'strike');
    
    // maintain line breaks
    while (str.includes('\n')) {
    str = str.replace('\n', '<br>');
    }

    return str;
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