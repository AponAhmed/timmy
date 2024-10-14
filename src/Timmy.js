import * as THREE from 'three';
import Charecter from "./Charecter";

// Animation settings to control how animations behave
const animationSettings = {
    idle: { repeate: true, transitionDuration: 0.5 },
    idle_n: { repeate: true, transitionDuration: 0.5 },
    idle_s: { repeate: true, transitionDuration: 0.5 },
    walk: { repeate: true, transitionDuration: 0.5 },
    greeting: { repeate: false, transitionDuration: .2},
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

        super(width, height, './models/timmy.glb');
        this.lastPlayed = ''; // Track the last played animation
    }

    async init() {
        await this.modelLoad();
        this.camera.position.set(-1.4, 0.4, 1.5);
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

    // Play an animation with its settings
    playAnimation(animationName) {
        if (this.actions[animationName]) {
            const currentAction = this.actions[animationName];
            const animationSetting = animationSettings[animationName] || { repeate: false };
            this.crossFadeTo(currentAction, animationSetting);
            this.lastPlayed = animationName; // Update lastPlayed when an animation starts
        } else {
            console.warn(`Animation "${animationName}" not found! Defaulting to idle.`);
            //this.playRandomIdleAnimation();
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
        newAction.clampWhenFinished = true; // Do  clamp
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
