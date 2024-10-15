import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'; // Import the GUI library for animation control

export default class Character {
    constructor(width = 350, height = 250, modelPath) {
        this.mixer = null;
        this.character = null;
        this.actions = {};

        this.containerSetup(width, height);
        this.modelPath = modelPath;

        this.GlLoader = new GLTFLoader();

        // Initialize DRACOLoader and set the decoder path
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/'); // Set path to DRACO decoder
        this.GlLoader.setDRACOLoader(dracoLoader); // Attach DRACOLoader to GLTFLoader



        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setSize(width, height);

        // Set the tone mapping to ACES Filmic and exposure to -1.2
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = Math.pow(1, .5); // Use Math.pow(2, value) for exposure

        this.lightSetup();
        this.appendDom();
        // Add click event listener
        this.addClickEvent();
    }

    containerSetup(width, height) {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            left: 0px;
            bottom: 0px;
            width: ${width}px;
            height: ${height}px;
        `;
        document.body.appendChild(this.container);
    }

    appendDom() {
        this.container.appendChild(this.renderer.domElement);
    }

    lightSetup() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Increased intensity
        this.scene.add(ambientLight);

        const light = new THREE.DirectionalLight(0xffffff, 2);
        light.position.set(1, 2, 5); // Position light to ensure it illuminates the model
        light.target.position.set(0, 0, 0);
        this.scene.add(light);
        this.scene.add(light.target);
    }

    setupAnimations(animations) {
        this.mixer = new THREE.AnimationMixer(this.character);
        animations.forEach((animation) => {
            const action = this.mixer.clipAction(animation);
            if (animation.name === 'idle') {
                action.play();
            }
            action.setLoop(THREE.LoopOnce); // Ensure the animation repeats
            action.clampWhenFinished = false; // Keep the last frame when the animation finishes
            action.enabled = true; // Enable the action
            this.actions[animation.name] = action;
        });
    }

    async modelLoad() {
        try {
            this.model = await this.loadModel(this.modelPath);
            this.character = this.model.scene;

            if (this.character) {
                this.setupCharacter(this.character);
                this.scene.add(this.character);
                if (this.model.animations && this.model.animations.length > 0) {
                    this.setupAnimations(this.model.animations);
                }
            } else {
                console.error('Failed to load the model.');
            }
        } catch (error) {
            console.error('An error happened while loading the model:', error);
        }
        this.animate(this.scene, this.camera, this.renderer);
    }

    loadModel(modelPath) {
        return new Promise((resolve, reject) => {
            this.GlLoader.load(modelPath, resolve, undefined, reject);
        });
    }

    setupCharacter(character) {
        const rendererHeight = this.renderer.domElement.height;
        const targetHeight = (rendererHeight / 10) * 7; // Height will be 7/10th of the renderer height

        // Assuming the original height of the character is normalized or can be scaled
        const boundingBox = new THREE.Box3().setFromObject(character);
        const size = boundingBox.getSize(new THREE.Vector3());
        const currentHeight = size.y;

        const scale = (targetHeight / currentHeight) / 200; // Calculate the scale factor

        character.traverse((child) => {
            if (child.isMesh) {
                child.geometry.computeBoundingBox();
                child.material.transparent = true;
            }
        });

        // Optionally adjust the position to fit the new scale
        character.position.set(-3, -1.1, -1); // Adjust Y value to move character higher if needed
        // this.character.scale.set(1, 1, 1); // Adjust scale if needed
        // this.character.position.set(0, 0, 0); // Adjust position if needed

        // this.camera.position.set(0, 0, 0); // X, Y, Z
        // this.camera.lookAt(this.character.position); // Point camera at the character
    }

    animate(scene, camera, renderer) {
        const clock = new THREE.Clock(); // Use the clock to track time

        const animate = () => {
            requestAnimationFrame(animate);

            const delta = clock.getDelta(); // Get the time passed since the last frame
            if (this.mixer) {
                this.mixer.update(delta * .75); // Use the real delta for smoother updates
            }

            renderer.render(scene, camera);
        };
        animate();
    }




    createAnimationControls() {
        const gui = new GUI(); // Create a GUI for animation controls
        const animationFolder = gui.addFolder('Animations');

        Object.keys(this.actions).forEach((actionName) => {
            animationFolder.add({ play: () => this.playAnimation(actionName) }, 'play').name(actionName);
        });
        animationFolder.open(); // Open the folder by default
    }

    playAnimation(animationName) {
        if (this.actions[animationName]) {
            const currentAction = this.actions[animationName];

            // If another action is playing, smoothly crossfade to the new one
            for (const action of Object.values(this.actions)) {
                if (action === currentAction) {
                    action.reset().fadeIn(0.5).play(); // Smooth fade-in to the selected animation
                } else {
                    action.fadeOut(0.5); // Smooth fade-out for other animations
                }
            }
        }
    }

    // New method to add click event on the character
    addClickEvent() {
        // Create a raycaster and a mouse vector
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onMouseClick = (event) => {
            // Calculate mouse position in normalized device coordinates
            mouse.x = ((event.clientX - this.container.offsetLeft) / this.container.clientWidth) * 2 - 1;
            mouse.y = - ((event.clientY - this.container.offsetTop) / this.container.clientHeight) * 2 + 1;


            // Update the raycaster with the camera and mouse position
            raycaster.setFromCamera(mouse, this.camera);

            // Check if the character model exists and is loaded
            if (this.character) {
                // Traverse through all the children to ensure the raycaster checks every mesh
                this.character.traverse((child) => {
                    if (child.isMesh) {
                        // Calculate objects intersecting the ray
                        const intersects = raycaster.intersectObject(child, true); // true for recursive checking
                        if (intersects.length > 0) {
                            if (this.clickCallback) {
                                this.clickCallback(intersects); // Call the callback function with the intersects array if provided in the constructor
                            }
                        }
                    }
                });
            } else {
                console.warn('Character model not loaded or is null.');
            }
        };

        // Add the event listener to the document
        window.addEventListener('click', onMouseClick);
    }

}
