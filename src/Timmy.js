import * as THREE from 'three';
import Charecter from "./Charecter";
import Chat from './Chat';

// Animation settings to control how animations behave
const animationSettings = {
    idle: { repeate: true, transitionDuration: 0.5 },
    idle_n: { repeate: true, transitionDuration: 0.5 },
    idle_s: { repeate: true, transitionDuration: 0.5 },
    walk: { repeate: true, transitionDuration: 0.5 },
    greeting: { repeate: false, transitionDuration: .2 },
    focus: { repeate: false, transitionDuration: 0.5 },
    ask: { repeate: false, transitionDuration: 0.5 },
    talking1: { repeate: false, transitionDuration: 0.5 },
    talking2: { repeate: false, transitionDuration: 0.5 },
    yawn: { repeate: false, transitionDuration: 0.5 },
    dance: { repeate: true, transitionDuration: 0.5 },
};

const idleAnimations = ['idle', 'idle_s', 'idle_n'];
const talkingAnimations = ['talking1', 'talking2'];


export default class Timmy extends Charecter {
    constructor(w = 350, h = 250) {
        const width = w === 'v' ? window.innerWidth : w;
        const height = h === 'v' ? window.innerHeight : h;
        super(width, height, './timmy.glb');
        this.chat = new Chat();
        this.chat.setCallbacks({ wait: this.botWait, response: this.BotResponse });
        this.container.appendChild(this.chat.chatContainer.element);
        this.lastPlayed = ''; // Track the last played animation
    }

    BotResponse = (data) => {
        const animation = data.response;
        // Check if the response exists in animationSettings
        if (animation in animationSettings) {
            // Play the animation using the response key
            this.playAnimation(animation);
        } else {
            setTimeout(() => {
                this.chat.addMessage(data.response, 'bot');
                this.playAnimation(this.getRandomAnimation(talkingAnimations));
            }, 1000);
        }

    }

    botWait = () => {
        this.playAnimationsInSequence(['focus']);
        console.log('waiting for Response');
    }


    async init() {
        await this.modelLoad();
        let camXpos = -2.5;
        if (this.width <= 500) {
            camXpos -= 1;
        }
        this.camera.position.set(camXpos, 0.4, 1.5);
        this.createAnimationControls();

        // Add listener for when animations finish
        this.mixer.addEventListener('finished', () => {
            this.playNext(); // Call playNext when animation finishes
        });
        // Add listener for the 'loop' event


        this.playRandomIdleAnimation();
    }

    clickCallback = (intersect) => {
        this.playAnimationsInSequence(['greeting', 'ask']);
    }

    // Play a random idle animation
    playRandomIdleAnimation() {
        const randomIdle = idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
        this.playAnimation(randomIdle);
    }

    getRandomAnimation(state) {
        return state[Math.floor(Math.random() * state.length)];
    }

    IsIdle() {
        return idleAnimations.includes(this.lastPlayed);
    }

    addMessageWithAnimation(animationName) {
        if (animationName === 'greeting') {
            setTimeout(() => {
                this.chat.addMessage("Hello there!", "bot");
            }, 2000)
        }
        if (animationName === 'ask') {
            this.chat.addMessage("How may I help you ?", "bot");
        }
        if (animationName === 'yawn') {
            this.chat.addMessage("Ooo .. Yaaaaawwwwwn ! ", "bot");
        }

    }
    // Play an animation with its settings
    playAnimation(animationName) {
        if (this.actions[animationName]) {
            const currentAction = this.actions[animationName];
            const animationSetting = animationSettings[animationName] || { repeate: false };
            this.crossFadeTo(currentAction, animationSetting);
            this.addMessageWithAnimation(animationName);
            this.lastPlayed = animationName; // Update lastPlayed when an animation starts
        } else {
            console.warn(`Animation "${animationName}" not found! Defaulting to idle.`);
            this.playRandomIdleAnimation();
        }
    }

    // Method to crossfade between animations
    crossFadeTo(newAction, animationSetting) {
        const currentAction = this.mixer._activeAction;

        // Fade out the current action if it exists
        if (currentAction) {
            currentAction.fadeOut(animationSetting.transitionDuration);
        }
        newAction.loop = THREE.LoopOnce; // Play once
        newAction.clampWhenFinished = true; // Do clamp
        // Fade in the new action
        newAction.reset().fadeIn(animationSetting.transitionDuration).play();
        // Set the new action as the active action
        this.mixer._activeAction = newAction;
    }

    // NEW: Method to play multiple animations in sequence
    playAnimationsInSequence(animationNames) {
        this.animationNamesQueue = [...animationNames]; // Store the animation sequence
        this.playNext(); // Start with the first animation
    }

    // NEW: Play the next animation based on the last played animation
    playNext() {
        // If animation is not repeatable, play next animation in the sequence
        if (this.animationNamesQueue && this.animationNamesQueue.length > 0) {
            const nextAnimation = this.animationNamesQueue.shift();
            this.playAnimation(nextAnimation);
        } else {
            let currentAnimation = this.lastPlayed;
            if (this.IsIdle()) {
                currentAnimation = this.getRandomAnimation(idleAnimations);
            } else if (talkingAnimations.includes(this.lastPlayed)) {
                currentAnimation = this.getRandomAnimation(talkingAnimations);
            }

            const animationSetting = animationSettings[currentAnimation] || { repeate: false };

            if (animationSetting.repeate) {
                // If animation is repeatable, reset and play again
                this.crossFadeTo(this.actions[currentAnimation], animationSetting);
                this.lastPlayed = currentAnimation; // Update lastPlayed when an animation starts          
            } else {

                currentAnimation = this.getRandomAnimation(idleAnimations);
                this.playAnimation(currentAnimation);
            }
        }
    }
}
