import * as THREE from 'three';
import Charecter from "./Charecter";

// Animation settings to control how animations behave
const animationSettings = {
    idle: { repeatForever: true, transitionDuration: 0.5 },
    idle_n: { repeatForever: true, transitionDuration: 0.5 },
    idle_s: { repeatForever: true, transitionDuration: 0.5 },
    walk: { repeatForever: true, transitionDuration: 0.5 },
    greeting: { repeatTimes: 1, transitionDuration: 0.5 },
    focus: { repeatTimes: 1, transitionDuration: 0.5 },
    ask: { repeatTimes: 1, transitionDuration: 0.5 },
    talking1: { repeatForever: true, transitionDuration: 0.5 },
    talking2: { repeatForever: true, transitionDuration: 0.5 },
    yawn: { repeatTimes: 1, transitionDuration: 0.5 },
    dance: { repeatForever: true, transitionDuration: 0.5 },
};

export default class Timmy extends Charecter {
    constructor(w = 350, h = 250) {
        const width = w === 'v' ? window.innerWidth : w;
        const height = h === 'v' ? window.innerHeight : h;

        super(width, height, './models/timmy.glb');
    }

    async init() {
        await this.modelLoad();
        this.camera.position.set(-1.4, 0.4, 1.5);
        this.createAnimationControls();

        // Add listener for when animations finish
        this.mixer.addEventListener('finished', () => {
            if (this.playIdleNext) {
                this.playRandomIdleAnimation();
            }
        });
        this.playRandomIdleAnimation();

    }

    clickCallback = (intersect) => {
        //this.playAnimation('greeting');
        this.playAnimationsInSequence(['greeting', 'ask']);
        this.playIdleNext = true;       
    }

    // Play a random idle animation
    playRandomIdleAnimation() {
        const idleAnimations = ['idle', 'idle_n', 'idle_s'];
        const randomIdle = idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
        this.playAnimation(randomIdle);
    }

    // Play an animation with its settings
    playAnimation(animationName) {
        if (this.actions[animationName]) {
            const currentAction = this.actions[animationName];
            const animationSetting = animationSettings[animationName] || { repeatForever: false, repeatTimes: 1 };

            console.log(`Attempting to play animation: ${animationName}`);
            this.crossFadeTo(currentAction, animationSetting);
        } else {
            console.warn(`Animation "${animationName}" not found! Defaulting to idle.`);
            this.playRandomIdleAnimation(); // Default to idle if the animation isn't found
        }
    }

    // Method to crossfade between animations
    crossFadeTo(newAction, animationSetting) {
        const currentAction = this.mixer._activeAction;

        if (currentAction !== newAction) {
            // Fade out the current action if it exists
            if (currentAction) {
                currentAction.fadeOut(animationSetting.transitionDuration);
            }

            // Fade in the new action
            newAction.reset().fadeIn(animationSetting.transitionDuration).play();

            // Set up the new action's looping behavior
            if (animationSetting.repeatForever) {
                newAction.loop = THREE.LoopRepeat; // Set to repeat indefinitely
                newAction.clampWhenFinished = false; // Do not clamp
                this.playIdleNext = false; //
            } else if (animationSetting.repeatTimes) {
                newAction.loop = THREE.LoopOnce; // Play once
                this.playIdleNext = true; //
                this.setupRepeatNTimes(newAction, animationSetting.repeatTimes);
            } else {
                newAction.loop = THREE.LoopOnce; // Play once
                this.playIdleNext = true; //
                newAction.clampWhenFinished = true; // Ensure the action clamps when finished
            }

            // Ensure to handle the onFinished event to go to idle
            newAction.onFinished = () => {
                if (animationSetting.repeatTimes) {
                    this.playRandomIdleAnimation(); // Play idle animation when done
                }
            };

            // Set the new action as the active action
            this.mixer._activeAction = newAction;
        }
    }

    // Method to handle repeating an animation a specified number of times
    setupRepeatNTimes(action, repeatCount) {
        let count = 0;
        action.onFinished = () => {
            count++;
            if (count < repeatCount) {
                action.reset().play(); // Play again if not reached count
            } else {
                this.playRandomIdleAnimation(); // Play idle animation when done
            }
        };
    }

     // NEW: Method to play multiple animations in sequence with manual checks
    playAnimationsInSequence(animationNames) {
        let index = 0;
        let currentAction = null;

        const playNext = () => {
            if (index < animationNames.length) {
                const animationName = animationNames[index];
                index++;
                
                this.playAnimation(animationName);
                currentAction = this.actions[animationName];
            } else {
                this.playRandomIdleAnimation(); // Return to idle when done
            }
        };

        // Start by playing the first animation
        playNext();

        // Check when each animation finishes by updating the mixer
        this.mixer.addEventListener('loop', (event) => {
            if (currentAction && event.action === currentAction && currentAction.time === currentAction.getClip().duration) {
                playNext(); // When the current animation finishes, play the next one
            }
        });
    }
}
