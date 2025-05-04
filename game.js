// Replace the existing 'disk' constant in your HTML or game.js file with this:

const disk = () => ({
    startingNode: "intro", 

    title: "The Simple Choice", 

    characters: {}, 

    player: {
        name: "Wanderer" 
    },

    inventory: {},

    initGame: () => {
        console.log("Simple Choice Game Initialized!");

        state = {}; 
    },


    textNodes: () => new Map([

        ["intro", () => ({
            id: "intro",
            text: "Welcome! This is a tiny demonstration.\n\nPress __Next__ (or Enter/Space) to continue.",
            hideBackButton: true, 
            choices: [{
                
                nextText: "askName" 
            }]
        })],

        ["askName", () => ({
            id: "askName",
            text: "What is your name?",
            input: true, 
            nextText: "greeting", 
            afterEnter: () => {
                if (textInput.value.trim()) { 
                  player.name = textInput.value.trim();
                }
                 console.log(`Player name set to: ${player.name}`);
            }
        })],

        ["greeting", () => ({
            id: "greeting",

            text: `Hello, **${player.name}**! You find yourself in a room with two doors.\nOne is *red*, the other is *blue*.`,
            choices: [
                {
                    text: "Open the red door",
                    nextText: "redRoom",
                    setState: { choseRed: true } 
                },
                {
                    text: "Open the blue door",
                    nextText: "blueRoom",
                    setState: { choseBlue: true } 
                }
            ]
        })],

        ["redRoom", () => ({
            id: "redRoom",
            text: "You enter a room that is entirely red. It feels warm.\nThere's nothing else here.",
            choices: [
                {
                    text: "Go back",
                    nextText: "greeting"
                },
                {
                  text: "Check for secrets (requires key)",
                  requiredState: (currentState) => currentState.hasKey === true,
                  nextText: "secretEnding"
                }
            ]
        })],

        ["blueRoom", () => ({
            id: "blueRoom",
            text: "You enter a room that is entirely blue. It feels cool.\nYou find a small **key**!",
            choices: [
                {
                    text: "Take the key and go back",
                    setState: { hasKey: true },
                }
            ]
        })],

       ["secretEnding", () => ({
            id: "secretEnding",
            text: `Using the key you found in the blue room, you unlock a hidden panel in the red room!\n\n**Congratulations, ${player.name}!** You found the secret exit!`,
            choices: [
                {
                    text: "Play Again?",
                    nextText: "restart"
                }
            ]
        })]

    ]) 
}); 