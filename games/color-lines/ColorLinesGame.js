/**
 * 🎨 Color Lines Game
 * Use arrow keys to select lanes and hold to color lines
 * Lines must be colored with the correct color based on their lane
 * Arrow keys: Up=Star(orange), Right=Circle(green), Down=Rectangle(blue), Left=Triangle(red)
 */

import { BaseGame } from '../BaseGame.js';
import { TutorialSystem } from '../TutorialSystem.js';

// Lane colors with their hex codes and associated images/keys
const LANE_COLORS = [
    { name: 'orange', hex: '#FFB755', rgb: [255, 183, 85], key: 'ArrowUp', icon: 'star-button.svg' },
    { name: 'green', hex: '#A3FF56', rgb: [163, 255, 86], key: 'ArrowRight', icon: 'circle-button.svg' },
    { name: 'blue', hex: '#54D8FF', rgb: [84, 216, 255], key: 'ArrowDown', icon: 'rectangle-button.svg' },
    { name: 'red', hex: '#FF3246', rgb: [255, 50, 70], key: 'ArrowLeft', icon: 'triangle-button.svg' }
];

const LANE_OPACITY = 0.15; // Transparency for lane backgrounds

export class ColorLinesGame extends BaseGame {
    constructor(gameManager) {
        super(gameManager);
        
        // Music & BPM sync
        this.soundMusic = null;
        this.musicVolume = 0.5;
        this.bpm = 160;
        this.beatDuration = 60000 / this.bpm; // 375ms per beat
        this.lastBeatTime = 0;
        this.beatCount = 0;
        this.beatsPerSpawn = 4; // Spawn a line every 4 beats (1 measure at 4/4)
        
        // Lane icons (SVG images)
        this.laneIcons = [];
        
        // Active lane (controlled by arrow keys) - null means no lane selected
        this.activeLaneIndex = null;
        this.iconSize = 80; // Size of lane icons
        this.iconX = 70; // X position of icons (centered in left area)
        
        // Lanes configuration
        this.lanes = [];
        this.laneHeight = 0;
        
        // Incoming lines
        this.incomingLines = [];
        this.lineSpeed = 5;
        this.lineSpawnTimer = 0;
        this.lineSpawnInterval = 150; // Frames between spawns (more spacing)
        this.minLineWidth = 150; // Wider lines
        this.maxLineWidth = 400; // Much wider for longer holds
        this.lineHeight = 60; // Much taller/thicker lines
        
        // Game state
        this.gamePhase = 'loading'; // loading, ready, playing, gameover
        this.lives = 3;
        this.combo = 0;
        this.maxCombo = 0;
        
        // Coloring zone - where lines can be colored
        this.colorZoneX = 200; // X position where coloring can happen
        this.colorZoneWidth = 500; // Wide zone for long lines
        
        // Difficulty progression
        this.difficultyTimer = 0;
        this.difficultyLevel = 1;
        this.baseLineSpeed = 5; // Faster base speed
        this.baseSpawnInterval = 150;
    }

    /**
     * Tutorial information
     */
    static getTutorial() {
        const content = TutorialSystem.generateMakeyMakeyTutorial({
            title: 'Color Lines',
            objective: 'Use arrow keys to select a lane and HOLD the key to color the grey bars coming from the right!',
            tip: '⬆️=Star(orange) | ➡️=Circle(green) | ⬇️=Rectangle(blue) | ⬅️=Triangle(red). Only one key active at a time!'
        });

        return {
            title: 'Color Lines',
            content: content
        };
    }

    /**
     * Game initialization
     */
    async init() {
        console.log('🎨 ColorLinesGame - Initialization');
        
        return new Promise((resolve) => {
            const sketch = (p) => {
                p.preload = () => {
                    // Load lane icons (SVG images)
                    this.laneIcons = [];
                    for (let i = 0; i < LANE_COLORS.length; i++) {
                        const icon = p.loadImage(`./games/color-lines/image/${LANE_COLORS[i].icon}`);
                        this.laneIcons.push(icon);
                    }
                    
                    // Load music
                    this.soundMusic = p.loadSound('./sound/ost lines.mp3');
                };
                
                p.setup = () => {
                    // Create canvas
                    this.canvas = p.createCanvas(p.windowWidth, p.windowHeight);
                    this.canvas.parent('game-container');
                    
                    // Calculate lane dimensions
                    this.laneHeight = p.height / 4;
                    this.setupLanes(p);
                    
                    // Game is ready immediately (no webcam needed)
                    this.gamePhase = 'ready';
                    console.log('✅ ColorLinesGame ready - Use arrow keys');
                    
                    resolve();
                };

                p.draw = () => {
                    this.update(p);
                };

                p.keyPressed = () => {
                    this.onKeyPressed(p.key);
                };
                
                p.keyReleased = () => {
                    this.onKeyReleased(p.key);
                };
            };

            window.p5Instance = new p5(sketch);
        });
    }

    /**
     * Setup the 4 lanes
     */
    setupLanes(p) {
        this.lanes = [];
        for (let i = 0; i < 4; i++) {
            this.lanes.push({
                index: i,
                y: i * this.laneHeight,
                height: this.laneHeight,
                centerY: i * this.laneHeight + this.laneHeight / 2,
                color: LANE_COLORS[i],
                key: LANE_COLORS[i].key
            });
        }
    }

    /**
     * Get lane index from arrow key
     */
    getLaneIndexFromKey(key) {
        for (let i = 0; i < LANE_COLORS.length; i++) {
            if (LANE_COLORS[i].key === key) {
                return i;
            }
        }
        return null;
    }

    /**
     * Start the game
     */
    start() {
        super.start();
        console.log('▶️ ColorLinesGame - Starting');
        
        // Reset game state
        this.score = 0;
        this.lives = 3;
        this.combo = 0;
        this.maxCombo = 0;
        this.incomingLines = [];
        this.lineSpawnTimer = 0;
        this.difficultyTimer = 0;
        this.difficultyLevel = 1;
        this.lineSpeed = 5;
        this.lineSpawnInterval = 150;
        this.activeLaneIndex = null;
        this.gamePhase = 'playing';
        
        // BPM sync initialization
        this.beatCount = 0;
        this.lastBeatTime = performance.now();
        
        // Start music
        if (this.soundMusic && !this.soundMusic.isPlaying()) {
            this.soundMusic.setVolume(this.musicVolume);
            this.soundMusic.loop();
            console.log('🎵 Music started at 160 BPM');
        }
        
        // Don't spawn immediately - wait for beat sync
        this.lineSpawnTimer = 0;
    }

    /**
     * Main update loop
     */
    update(p) {
        if (!this.isRunning) return;
        
        // Draw background
        this.drawBackground(p);
        
        // Draw lanes
        this.drawLanes(p);
        
        // Draw lane icons
        this.drawLaneIcons(p);
        
        // Update and draw incoming lines
        if (this.gamePhase === 'playing') {
            this.updateLines(p);
            this.updateDifficulty();
        }
        this.drawLines(p);
        
        // Draw coloring zone
        this.drawColorZone(p);
        
        // Draw active lane indicator
        this.drawActiveLaneIndicator(p);
        
        // Draw HUD
        this.drawHUD(p);
        
        // Check game over
        if (this.lives <= 0 && this.gamePhase === 'playing') {
            this.gamePhase = 'gameover';
            setTimeout(() => {
                this.end('completed', this.score);
            }, 1500);
        }
    }

    /**
     * Draw lane icons (SVGs) at the left of each lane
     */
    drawLaneIcons(p) {
        for (let i = 0; i < this.lanes.length; i++) {
            const lane = this.lanes[i];
            const icon = this.laneIcons[i];
            
            if (icon) {
                const isActive = this.activeLaneIndex === i;
                
                // Draw glow if active
                if (isActive) {
                    p.tint(lane.color.rgb[0], lane.color.rgb[1], lane.color.rgb[2], 150);
                    p.image(icon, this.iconX - this.iconSize/2 - 5, lane.centerY - this.iconSize/2 - 5, this.iconSize + 10, this.iconSize + 10);
                }
                
                // Draw icon with color tint if active
                if (isActive) {
                    p.tint(255, 255, 255);
                } else {
                    p.tint(150, 150, 150, 180);
                }
                p.image(icon, this.iconX - this.iconSize/2, lane.centerY - this.iconSize/2, this.iconSize, this.iconSize);
                p.noTint();
            }
        }
    }

    /**
     * Draw active lane indicator
     */
    drawActiveLaneIndicator(p) {
        if (this.activeLaneIndex === null) return;
        
        const lane = this.lanes[this.activeLaneIndex];
        const c = lane.color.rgb;
        
        // Draw a glowing bar indicator on the left
        p.noStroke();
        p.fill(c[0], c[1], c[2], 100);
        p.rect(this.iconX + this.iconSize/2 + 10, lane.y + 10, 20, lane.height - 20, 5);
        
        p.fill(c[0], c[1], c[2]);
        p.rect(this.iconX + this.iconSize/2 + 15, lane.y + 15, 10, lane.height - 30, 3);
    }

    /**
     * Update incoming lines (spawn and move)
     */
    updateLines(p) {
        // BPM-synced spawning
        const currentTime = performance.now();
        const timeSinceLastBeat = currentTime - this.lastBeatTime;
        
        // Check if a new beat has occurred
        if (timeSinceLastBeat >= this.beatDuration) {
            this.lastBeatTime = currentTime - (timeSinceLastBeat % this.beatDuration); // Keep in sync
            this.beatCount++;
            
            // Spawn a line every N beats (synced to music)
            if (this.beatCount % this.beatsPerSpawn === 0) {
                this.spawnLine(p);
                console.log(`🎵 Beat ${this.beatCount} - Spawning line!`);
            }
        }
        
        // Move lines and handle drawing
        for (let i = this.incomingLines.length - 1; i >= 0; i--) {
            const line = this.incomingLines[i];
            line.x -= this.lineSpeed;
            
            // Reset isBeingDrawn each frame
            line.isBeingDrawn = false;
            
            // Check if line is in the coloring zone
            const lineStartX = line.x;
            const lineEndX = line.x + line.width;
            const zoneStartX = this.colorZoneX - this.colorZoneWidth / 2;
            const zoneEndX = this.colorZoneX + this.colorZoneWidth / 2;
            
            // Line overlaps with zone
            const inZone = lineEndX > zoneStartX && lineStartX < zoneEndX;
            
            // If an arrow key is held (activeLaneIndex is set) and line is in zone
            if (this.activeLaneIndex !== null && inZone && !line.colored) {
                if (line.laneIndex === this.activeLaneIndex) {
                    // Correct lane - fill the line progressively
                    // Fill speed slightly faster than line speed for better feel
                    line.isBeingDrawn = true;
                    line.fillProgress += this.lineSpeed * 1.15;
                    line.coloredWith = this.lanes[this.activeLaneIndex].color.rgb;
                    
                    // Check if fully colored
                    if (line.fillProgress >= line.width) {
                        line.fillProgress = line.width;
                        line.colored = true;
                        
                        // Add points with combo multiplier
                        this.combo++;
                        if (this.combo > this.maxCombo) {
                            this.maxCombo = this.combo;
                        }
                        const points = Math.round(10 * (line.width / 100) * this.combo);
                        this.addScore(points);
                        console.log(`✅ Line colored! +${points} points (combo x${this.combo})`);
                    }
                } else if (!line.wrongLane) {
                    // Wrong lane - mark it and penalize
                    line.wrongLane = true;
                    line.coloredWith = [80, 80, 80];
                    this.lives--;
                    this.combo = 0;
                    console.log('❌ Wrong lane! Lives remaining:', this.lives);
                }
            }
            
            // Check if line passed without being fully colored
            if (line.x + line.width < 0) {
                if (!line.colored && !line.wrongLane) {
                    // Missed a line or didn't complete it
                    this.lives--;
                    this.combo = 0;
                    console.log('❌ Line missed! Lives remaining:', this.lives);
                }
                this.incomingLines.splice(i, 1);
            }
        }
    }

    /**
     * Spawn a new incoming line
     */
    spawnLine(p) {
        // Choose a random lane
        const laneIndex = Math.floor(p.random(4));
        const lane = this.lanes[laneIndex];
        
        // Random width for variety
        const width = p.random(this.minLineWidth, this.maxLineWidth);
        
        this.incomingLines.push({
            x: p.width + 10,
            y: lane.centerY - this.lineHeight / 2,
            laneIndex: laneIndex,
            colored: false,
            coloredWith: null,
            width: width,
            height: this.lineHeight,
            // Fill progress tracking for hold-to-draw mechanic
            fillProgress: 0, // 0 to width (how much is colored)
            isBeingDrawn: false,
            wrongLane: false
        });
    }

    /**
     * Update difficulty over time (progressive increase)
     */
    updateDifficulty() {
        this.difficultyTimer++;
        
        const timeInSeconds = this.difficultyTimer / 60;
        
        // Speed: starts at 5, increases faster over time, max 14
        // Accelerated: increases by ~0.5 every 5 seconds (was 0.3)
        this.lineSpeed = Math.min(14, this.baseLineSpeed + (timeInSeconds / 8));
        
        // Spawn interval: starts at 150 frames (~2.5s), decreases faster, min 50 frames
        // Accelerated: decreases by 3 per second (was 1.5)
        this.lineSpawnInterval = Math.max(50, this.baseSpawnInterval - (timeInSeconds * 3));
        
        // Update difficulty level for display (every 6 seconds instead of 10)
        const newLevel = Math.floor(timeInSeconds / 6) + 1;
        if (newLevel > this.difficultyLevel) {
            this.difficultyLevel = newLevel;
            console.log(`📈 Level ${this.difficultyLevel} | Speed: ${this.lineSpeed.toFixed(1)} | Interval: ${Math.round(this.lineSpawnInterval)}`);
        }
    }

    /**
     * Draw the black background
     */
    drawBackground(p) {
        p.background(0);
    }

    /**
     * Draw the 4 colored lanes
     */
    drawLanes(p) {
        for (const lane of this.lanes) {
            // Draw lane background with low opacity
            p.noStroke();
            const c = lane.color.rgb;
            // Highlight active lane
            const isActive = this.activeLaneIndex === lane.index;
            const opacity = isActive ? LANE_OPACITY * 2 : LANE_OPACITY;
            p.fill(c[0], c[1], c[2], 255 * opacity);
            p.rect(this.iconX + this.iconSize, lane.y, p.width - this.iconX - this.iconSize, lane.height);
            
            // Draw lane center line (subtle)
            p.stroke(c[0], c[1], c[2], isActive ? 150 : 80);
            p.strokeWeight(isActive ? 3 : 2);
            p.line(this.iconX + this.iconSize + 20, lane.centerY, p.width, lane.centerY);
        }
        
        // Draw lane separators
        p.stroke(50);
        p.strokeWeight(1);
        for (let i = 1; i < 4; i++) {
            p.line(this.iconX + this.iconSize, i * this.laneHeight, p.width, i * this.laneHeight);
        }
    }

    /**
     * Draw the coloring zone indicator
     */
    drawColorZone(p) {
        // Vertical zone where coloring happens
        p.noFill();
        p.stroke(255, 255, 255, 50);
        p.strokeWeight(2);
        p.rect(this.colorZoneX - this.colorZoneWidth / 2, 0, this.colorZoneWidth, p.height);
        
        // Small indicators
        p.fill(255, 100);
        p.noStroke();
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(12);
        p.text('ZONE', this.colorZoneX, 10);
    }

    /**
     * Draw all incoming lines
     */
    drawLines(p) {
        for (const line of this.incomingLines) {
            p.rectMode(p.CORNER);
            
            // Draw outer glow/shadow for visibility
            p.noStroke();
            p.fill(0, 0, 0, 100);
            p.rect(line.x + 4, line.y + 4, line.width, line.height, 12);
            
            // Draw the grey background of the line with border
            p.fill(100);
            p.stroke(150);
            p.strokeWeight(3);
            p.rect(line.x, line.y, line.width, line.height, 12);
            
            // Inner darker area
            p.noStroke();
            p.fill(60);
            p.rect(line.x + 6, line.y + 6, line.width - 12, line.height - 12, 8);
            
            // Draw the filled/colored portion
            if (line.fillProgress > 0 && line.coloredWith) {
                const c = line.coloredWith;
                
                // Colored fill with glow effect
                p.fill(c[0], c[1], c[2], 150);
                const fillWidth = Math.min(line.fillProgress, line.width);
                p.rect(line.x, line.y, fillWidth, line.height, 12, 0, 0, 12);
                
                // Brighter inner color
                p.fill(c[0], c[1], c[2]);
                p.rect(line.x + 6, line.y + 6, Math.max(0, fillWidth - 12), line.height - 12, 8, 0, 0, 8);
            }
            
            // Draw outline when being drawn
            if (line.isBeingDrawn) {
                p.noFill();
                p.stroke(255);
                p.strokeWeight(4);
                p.rect(line.x, line.y, line.width, line.height, 12);
            }
            
            // Draw progress indicator
            if (line.fillProgress > 0 && !line.colored && !line.wrongLane) {
                const percentage = Math.round((line.fillProgress / line.width) * 100);
                // Text shadow for visibility
                p.fill(0, 0, 0, 180);
                p.noStroke();
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(22);
                p.text(percentage + '%', line.x + line.width / 2 + 2, line.y + line.height / 2 + 2);
                // Main text
                p.fill(255);
                p.text(percentage + '%', line.x + line.width / 2, line.y + line.height / 2);
            }
            
            // Draw "COMPLETE" or checkmark when fully colored
            if (line.colored && !line.wrongLane) {
                p.fill(255);
                p.noStroke();
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(24);
                p.text('✓', line.x + line.width / 2, line.y + line.height / 2);
            }
        }
    }
    /**
     * Draw the HUD (only game over message, no overlay during gameplay)
     */
    drawHUD(p) {
        // Game over message only
        if (this.gamePhase === 'gameover') {
            p.fill(0, 0, 0, 180);
            p.rect(0, 0, p.width, p.height);
            
            p.textAlign(p.CENTER, p.CENTER);
            p.fill(255);
            p.textSize(48);
            p.text('GAME OVER', p.width / 2, p.height / 2 - 30);
            p.textSize(32);
            p.text(`Final Score: ${this.score}`, p.width / 2, p.height / 2 + 30);
            if (this.maxCombo > 1) {
                p.textSize(24);
                p.fill(200);
                p.text(`Best Combo: x${this.maxCombo}`, p.width / 2, p.height / 2 + 70);
            }
        }
    }

    /**
     * Handle key presses - arrow keys control lane selection
     * Only one lane can be active at a time (last pressed wins)
     */
    onKeyPressed(key) {
        super.onKeyPressed(key);
        
        if (this.gamePhase !== 'playing') return;
        
        // Check if it's an arrow key
        const laneIndex = this.getLaneIndexFromKey(key);
        if (laneIndex !== null) {
            // Set this lane as active (last pressed wins)
            this.activeLaneIndex = laneIndex;
        }
    }

    /**
     * Handle key releases - deactivate lane only if it's the currently active one
     */
    onKeyReleased(key) {
        const laneIndex = this.getLaneIndexFromKey(key);
        if (laneIndex !== null && this.activeLaneIndex === laneIndex) {
            // Only deactivate if this is the currently active lane
            this.activeLaneIndex = null;
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        console.log('🧹 ColorLinesGame - Cleanup');
        
        // Stop music
        if (this.soundMusic && this.soundMusic.isPlaying()) {
            this.soundMusic.stop();
            console.log('🔇 Music stopped');
        }
        
        // Reset state
        this.activeLaneIndex = null;
        
        // Call parent cleanup
        super.cleanup();
    }
}
