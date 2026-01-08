/**
 * 🧱 Wall Shapes Game - Pose Wall
 * Le joueur doit reproduire la pose pour passer à travers le mur
 * Utilise ML5 BodyPose pour la détection de pose
 */

import { BaseGame } from '../BaseGame.js';
import { TutorialSystem } from '../TutorialSystem.js';

// Colors constants
const COLORS = {
    success: [74, 222, 128],
    danger: [248, 113, 113],
    warning: [251, 191, 36],
    primary: [255, 255, 255],
    skeleton: [255, 255, 255],
    wall: [60, 70, 90],
    wallEdge: [80, 90, 110],
    hole: [20, 25, 35]
};

// Predefined poses with realistic body keypoint detection
const POSE_TYPES = [
    // ===== EASY POSES (Level 1-5) =====
    {
        name: 'HANDS UP',
        description: 'Both hands straight up',
        difficulty: 1,
        checkPose: function(keypoints, p) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            
            if (!nose || !leftShoulder || !rightShoulder || nose.confidence < 0.3) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            if (leftWrist && leftWrist.confidence > 0.2) {
                if (leftWrist.y < nose.y) score += 50;
            }
            if (rightWrist && rightWrist.confidence > 0.2) {
                if (rightWrist.y < nose.y) score += 50;
            }
            return score;
        }
    },
    {
        name: 'T-POSE',
        description: 'Arms straight out',
        difficulty: 1,
        checkPose: function(keypoints, p) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            
            if (!leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            const centerY = (leftShoulder.y + rightShoulder.y) / 2;
            const centerX = (leftShoulder.x + rightShoulder.x) / 2;
            
            let score = 0;
            if (leftWrist && leftWrist.confidence > 0.2) {
                const wristHeight = p.abs(leftWrist.y - centerY);
                const wristDist = p.abs(leftWrist.x - centerX);
                if (wristHeight < shoulderDist * 0.5 && wristDist > shoulderDist * 0.8) score += 50;
            }
            if (rightWrist && rightWrist.confidence > 0.2) {
                const wristHeight = p.abs(rightWrist.y - centerY);
                const wristDist = p.abs(rightWrist.x - centerX);
                if (wristHeight < shoulderDist * 0.5 && wristDist > shoulderDist * 0.8) score += 50;
            }
            return score;
        }
    },
    {
        name: 'STAR',
        description: 'Arms and legs wide',
        difficulty: 1,
        checkPose: function(keypoints, p) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            const leftAnkle = keypoints[15];
            const rightAnkle = keypoints[16];
            
            if (!leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            const centerY = (leftShoulder.y + rightShoulder.y) / 2;
            
            let score = 0;
            if (leftWrist && leftWrist.confidence > 0.2) {
                if (leftWrist.y < centerY) score += 25;
            }
            if (rightWrist && rightWrist.confidence > 0.2) {
                if (rightWrist.y < centerY) score += 25;
            }
            if (leftAnkle && rightAnkle && leftAnkle.confidence > 0.2 && rightAnkle.confidence > 0.2) {
                const ankleDist = p.dist(leftAnkle.x, leftAnkle.y, rightAnkle.x, rightAnkle.y);
                if (ankleDist > shoulderDist * 1.2) score += 50;
            }
            return score;
        }
    },
    {
        name: 'ONE HAND UP',
        description: 'Left hand up',
        difficulty: 1,
        checkPose: function(keypoints, p) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            
            if (!nose || !leftShoulder || !rightShoulder || nose.confidence < 0.3) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            if (leftWrist && leftWrist.confidence > 0.2) {
                if (leftWrist.y < nose.y) score += 100;
            }
            return score;
        }
    },
    {
        name: 'ARMS FORWARD',
        description: 'Both arms stretched forward',
        difficulty: 1,
        checkPose: function(keypoints, p) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftElbow = keypoints[7];
            const rightElbow = keypoints[8];
            
            if (!leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            if (leftElbow && leftElbow.confidence > 0.2) score += 50;
            if (rightElbow && rightElbow.confidence > 0.2) score += 50;
            return score;
        }
    },
    {
        name: 'STANDING TALL',
        description: 'Stand straight, arms down',
        difficulty: 1,
        checkPose: function(keypoints, p) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftHip = keypoints[11];
            const rightHip = keypoints[12];
            
            if (!nose || !leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
            const hipCenterX = (leftHip.x + rightHip.x) / 2;
            
            if (p.abs(shoulderCenterX - hipCenterX) < shoulderDist * 0.5) {
                score += 100;
            }
            return score;
        }
    },
    {
        name: 'ARMS ON HIPS',
        description: 'Hands on your hips',
        difficulty: 1,
        checkPose: function(keypoints, p) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            const leftHip = keypoints[11];
            const rightHip = keypoints[12];
            
            if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            if (leftWrist && leftHip && leftWrist.confidence > 0.2 && leftHip.confidence > 0.2) {
                if (p.dist(leftWrist.x, leftWrist.y, leftHip.x, leftHip.y) < shoulderDist * 1.2) score += 50;
            }
            if (rightWrist && rightHip && rightWrist.confidence > 0.2 && rightHip.confidence > 0.2) {
                if (p.dist(rightWrist.x, rightWrist.y, rightHip.x, rightHip.y) < shoulderDist * 1.2) score += 50;
            }
            return score;
        }
    },
    {
        name: 'WIDE STANCE',
        description: 'Legs wide apart',
        difficulty: 1,
        checkPose: function(keypoints, p) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftAnkle = keypoints[15];
            const rightAnkle = keypoints[16];
            
            if (!leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            if (leftAnkle && rightAnkle && leftAnkle.confidence > 0.2 && rightAnkle.confidence > 0.2) {
                const ankleDist = p.dist(leftAnkle.x, leftAnkle.y, rightAnkle.x, rightAnkle.y);
                if (ankleDist > shoulderDist * 1.8) score += 100;
                else if (ankleDist > shoulderDist * 1.3) score += 70;
            }
            return score;
        }
    },
    
    // ===== HARD POSES (Level 6+) =====
    {
        name: 'LEFT ARM UP',
        description: 'Only left arm raised',
        difficulty: 3,
        checkPose: function(keypoints, p) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            
            if (!nose || !leftShoulder || !rightShoulder || nose.confidence < 0.3) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            if (leftWrist && leftWrist.confidence > 0.2) {
                if (leftWrist.y < nose.y) score += 60;
            }
            if (rightWrist && rightWrist.confidence > 0.2) {
                if (rightWrist.y > rightShoulder.y - shoulderDist * 0.5) score += 40;
            }
            return score;
        }
    },
    {
        name: 'RIGHT ARM UP',
        description: 'Only right arm raised',
        difficulty: 3,
        checkPose: function(keypoints, p) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            
            if (!nose || !leftShoulder || !rightShoulder || nose.confidence < 0.3) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            if (rightWrist && rightWrist.confidence > 0.2) {
                if (rightWrist.y < nose.y) score += 60;
            }
            if (leftWrist && leftWrist.confidence > 0.2) {
                if (leftWrist.y > leftShoulder.y - shoulderDist * 0.5) score += 40;
            }
            return score;
        }
    },
    {
        name: 'CROSS ARMS',
        description: 'Arms crossed over chest',
        difficulty: 3,
        checkPose: function(keypoints, p) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            
            if (!leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            const centerX = (leftShoulder.x + rightShoulder.x) / 2;
            const centerY = (leftShoulder.y + rightShoulder.y) / 2;
            
            let score = 0;
            if (leftWrist && leftWrist.confidence > 0.2) {
                if (leftWrist.x > centerX && p.abs(leftWrist.y - centerY) < shoulderDist * 1.2) {
                    score += 50;
                }
            }
            if (rightWrist && rightWrist.confidence > 0.2) {
                if (rightWrist.x < centerX && p.abs(rightWrist.y - centerY) < shoulderDist * 1.2) {
                    score += 50;
                }
            }
            return score;
        }
    },
    {
        name: 'SUPERHERO',
        description: 'One fist up, one on hip',
        difficulty: 3,
        checkPose: function(keypoints, p) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            const leftHip = keypoints[11];
            const rightHip = keypoints[12];
            
            if (!nose || !leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let armUpScore = 0;
            let armDownScore = 0;
            
            if (leftWrist && leftWrist.confidence > 0.2 && leftWrist.y < nose.y) {
                armUpScore = 50;
                if (rightWrist && rightHip && rightWrist.confidence > 0.2 && rightHip.confidence > 0.2) {
                    if (p.dist(rightWrist.x, rightWrist.y, rightHip.x, rightHip.y) < shoulderDist * 1.0) {
                        armDownScore = 50;
                    }
                }
            } else if (rightWrist && rightWrist.confidence > 0.2 && rightWrist.y < nose.y) {
                armUpScore = 50;
                if (leftWrist && leftHip && leftWrist.confidence > 0.2 && leftHip.confidence > 0.2) {
                    if (p.dist(leftWrist.x, leftWrist.y, leftHip.x, leftHip.y) < shoulderDist * 1.0) {
                        armDownScore = 50;
                    }
                }
            }
            return armUpScore + armDownScore;
        }
    }
];

export class WallShapesGame extends BaseGame {
    constructor(gameManager) {
        super(gameManager);
        
        // ML5 BodyPose
        this.bodyPose = null;
        this.poses = [];
        this.videoCapture = null;
        this.connections = null;
        this.poseReady = false;
        this.previewGraphics = null;
        
        // Game state
        this.gamePhase = 'loading'; // loading, ready, playing, gameover
        this.level = 1;
        this.lives = 3;
        this.lastLevelScore = 0;
        
        // Game world
        this.wallSpeed = 2.5;
        this.wallSpawnTimer = 0;
        this.wallSpawnInterval = 120;
        this.lastPoseName = '';
        this.totalWallsSpawned = 0;
        
        // Walls
        this.activeWalls = [];
        
        // Feedback
        this.feedbackText = '';
        this.feedbackColor = null;
        this.feedbackTimer = 0;
    }

    /**
     * Informations du tutoriel
     */
    static getTutorial() {
        const content = TutorialSystem.generateML5Tutorial({
            title: 'Pose Wall',
            objective: 'Reproduis la pose affichée sur le mur avant qu\'il n\'arrive pour passer à travers !',
            tip: 'Assure-toi d\'avoir un bon éclairage et suffisamment de recul pour que tout ton corps soit visible.'
        });

        return {
            title: 'Pose Wall',
            content: content
        };
    }

    /**
     * Initialisation du jeu
     */
    async init() {
        console.log('🧱 WallShapesGame - Initialisation');
        
        return new Promise((resolve, reject) => {
            const sketch = (p) => {
                p.preload = () => {
                    // Charger BodyPose dans preload
                    this.bodyPose = ml5.bodyPose('MoveNet', {
                        modelType: 'SINGLEPOSE_LIGHTNING',
                        enableSmoothing: true,
                        flipped: false
                    });
                };
                
                p.setup = () => {
                    // Création du canvas
                    this.canvas = p.createCanvas(800, 600);
                    this.canvas.parent('game-container');
                    
                    this.previewGraphics = p.createGraphics(200, 150);
                    p.textFont('Inter, system-ui, sans-serif');
                    this.connections = this.bodyPose.getSkeleton();
                    
                    // Initialisation de la webcam
                    this.videoCapture = p.createCapture(p.VIDEO, (stream) => {
                        if (stream) {
                            this.onCameraReady(p);
                        }
                    });
                    this.videoCapture.size(800, 600);
                    this.videoCapture.hide();
                    
                    // Fallback si pas de stream après 2 secondes
                    setTimeout(() => {
                        if (this.gamePhase === 'loading') {
                            console.log('Camera timeout, trying to start anyway...');
                            this.onCameraReady(p);
                        }
                    }, 2000);
                    
                    resolve();
                };

                p.draw = () => {
                    this.update(p);
                };

                p.keyPressed = () => {
                    this.onKeyPressed(p.key);
                };
            };

            window.p5Instance = new p5(sketch);
        });
    }

    /**
     * Camera ready callback
     */
    onCameraReady(p) {
        this.bodyPose.detectStart(this.videoCapture, (results) => {
            this.poses = results;
            if (this.poses.length > 0 && !this.poseReady) {
                this.poseReady = true;
                console.log('✅ Pose détectée - Prêt à jouer');
            }
        });
        this.gamePhase = 'ready';
        console.log('✅ BodyPose détection démarrée');
    }

    /**
     * Démarrage du jeu
     */
    start() {
        super.start();
        console.log('▶️ WallShapesGame - Démarrage');
        
        // Reset game state
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.lastLevelScore = 0;
        this.wallSpeed = 2.5;
        this.wallSpawnInterval = 120;
        this.activeWalls = [];
        this.wallSpawnTimer = 100; // Commence à 100 pour spawner le premier mur rapidement
        this.lastPoseName = '';
        this.totalWallsSpawned = 0;
        this.gamePhase = 'playing';
        
        console.log('🧱 État initial:', {
            isRunning: this.isRunning,
            gamePhase: this.gamePhase,
            wallSpawnTimer: this.wallSpawnTimer
        });
    }

    /**
     * Mise à jour du jeu
     */
    update(p) {
        // Dessiner l'environnement
        this.drawEnvironment(p);
        
        let playerPose = this.poses.length > 0 ? this.poses[0] : null;
        
        if (playerPose && this.gamePhase === 'playing') {
            this.drawStickman(p, playerPose);
        }
        
        if (this.gamePhase === 'playing' && this.isRunning) {
            this.wallSpawnTimer++;
            if (this.wallSpawnTimer >= this.wallSpawnInterval) {
                this.spawnWall(p);
                this.wallSpawnTimer = 0;
            }
            
            // Sort walls by distance
            this.activeWalls.sort((a, b) => b.z - a.z);
            
            // Update and draw walls
            for (let i = this.activeWalls.length - 1; i >= 0; i--) {
                let wall = this.activeWalls[i];
                wall.update(this.wallSpeed);
                wall.draw(p, playerPose);
                
                if (wall.isAtPlayer() && !wall.scored) {
                    wall.scored = true;
                    const isMatch = wall.checkBodyMatch(p, playerPose);
                    if (isMatch) {
                        const points = Math.floor(wall.matchScore);
                        this.addScore(points);
                        
                        if (wall.matchScore >= 95) {
                            this.showFeedback(p, 'PERFECT! +' + points, p.color(...COLORS.success));
                        } else {
                            this.showFeedback(p, 'GOOD! +' + points, p.color(...COLORS.warning));
                        }
                    } else {
                        this.lives--;
                        this.showFeedback(p, 'MISS', p.color(...COLORS.danger));
                        if (this.lives <= 0) {
                            this.gameOver();
                        }
                    }
                }
                
                if (wall.hasPassed()) {
                    this.activeWalls.splice(i, 1);
                }
            }
            
            // Level up
            if (this.score >= this.lastLevelScore + 400) {
                this.levelUp(p);
            }
            
            this.drawWallIndicator(p);
        }
        
        // Draw feedback
        this.drawFeedback(p);
        
        // Draw webcam preview
        if (this.videoCapture) {
            this.drawWebcamPreview(p, playerPose);
        }
        
        // Draw HUD
        this.drawHUD(p);
    }

    /**
     * Dessiner l'environnement
     */
    drawEnvironment(p) {
        p.background(15, 18, 25);
        
        p.noStroke();
        for (let i = 0; i < 5; i++) {
            let alpha = 20 - i * 4;
            p.fill(40, 60, 100, alpha);
            p.ellipse(p.width/2, p.height * 0.45, 600 + i * 100, 30 + i * 10);
        }
        
        this.drawPlatform(p);
    }

    /**
     * Dessiner la plateforme
     */
    drawPlatform(p) {
        p.push();
        
        const horizonY = p.height * 0.45;
        const bottomY = p.height;
        const farW = 120;
        const nearW = 700;
        
        p.noStroke();
        p.fill(50, 55, 65);
        p.beginShape();
        p.vertex(p.width/2 - farW/2, horizonY);
        p.vertex(p.width/2 + farW/2, horizonY);
        p.vertex(p.width/2 + nearW/2, bottomY);
        p.vertex(p.width/2 - nearW/2, bottomY);
        p.endShape(p.CLOSE);
        
        p.stroke(80, 90, 110);
        p.strokeWeight(3);
        p.line(p.width/2 - farW/2, horizonY, p.width/2 - nearW/2, bottomY);
        p.line(p.width/2 + farW/2, horizonY, p.width/2 + nearW/2, bottomY);
        
        p.stroke(180, 180, 100, 150);
        p.strokeWeight(4);
        for (let i = 0; i < 12; i++) {
            let t1 = i / 12;
            let t2 = (i + 0.4) / 12;
            let y1 = p.lerp(horizonY, bottomY, t1);
            let y2 = p.lerp(horizonY, bottomY, t2);
            p.line(p.width/2, y1, p.width/2, y2);
        }
        
        p.stroke(60, 65, 75, 80);
        p.strokeWeight(1);
        for (let i = 1; i < 10; i++) {
            let t = Math.pow(i / 10, 1.5);
            let y = p.lerp(horizonY, bottomY, t);
            let w = p.lerp(farW, nearW, t);
            p.line(p.width/2 - w/2, y, p.width/2 + w/2, y);
        }
        
        p.pop();
    }

    /**
     * Dessiner le stickman du joueur
     */
    drawStickman(p, pose) {
        if (!pose || !this.connections) return;
        
        p.push();
        
        const scaleX = 0.8;
        const scaleY = 0.8;
        const offsetX = p.width * 0.1;
        const offsetY = p.height * 0.05;
        
        const getPos = (keypoint) => {
            if (!keypoint || keypoint.confidence < 0.1) return null;
            return {
                x: (p.width - keypoint.x) * scaleX + offsetX,
                y: keypoint.y * scaleY + offsetY
            };
        };
        
        const nose = getPos(pose.keypoints[0]);
        const leftShoulder = getPos(pose.keypoints[5]);
        const rightShoulder = getPos(pose.keypoints[6]);
        const leftElbow = getPos(pose.keypoints[7]);
        const rightElbow = getPos(pose.keypoints[8]);
        const leftWrist = getPos(pose.keypoints[9]);
        const rightWrist = getPos(pose.keypoints[10]);
        const leftHip = getPos(pose.keypoints[11]);
        const rightHip = getPos(pose.keypoints[12]);
        const leftKnee = getPos(pose.keypoints[13]);
        const rightKnee = getPos(pose.keypoints[14]);
        const leftAnkle = getPos(pose.keypoints[15]);
        const rightAnkle = getPos(pose.keypoints[16]);
        
        p.strokeCap(p.ROUND);
        p.strokeJoin(p.ROUND);
        
        const bodyColor = p.color(255, 255, 255);
        const limbWidth = 22;
        const torsoWidth = 28;
        
        p.stroke(bodyColor);
        p.noFill();
        
        // Torso
        if (leftShoulder && rightShoulder && leftHip && rightHip) {
            p.strokeWeight(torsoWidth);
            p.fill(bodyColor);
            p.noStroke();
            p.beginShape();
            p.vertex(leftShoulder.x, leftShoulder.y);
            p.vertex(rightShoulder.x, rightShoulder.y);
            p.vertex(rightHip.x, rightHip.y);
            p.vertex(leftHip.x, leftHip.y);
            p.endShape(p.CLOSE);
            
            p.stroke(bodyColor);
            p.strokeWeight(limbWidth);
            p.line(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            p.line(leftHip.x, leftHip.y, rightHip.x, rightHip.y);
            p.line(leftShoulder.x, leftShoulder.y, leftHip.x, leftHip.y);
            p.line(rightShoulder.x, rightShoulder.y, rightHip.x, rightHip.y);
        }
        
        // Arms
        p.stroke(bodyColor);
        p.strokeWeight(limbWidth);
        if (leftShoulder && leftElbow) p.line(leftShoulder.x, leftShoulder.y, leftElbow.x, leftElbow.y);
        if (leftElbow && leftWrist) p.line(leftElbow.x, leftElbow.y, leftWrist.x, leftWrist.y);
        if (rightShoulder && rightElbow) p.line(rightShoulder.x, rightShoulder.y, rightElbow.x, rightElbow.y);
        if (rightElbow && rightWrist) p.line(rightElbow.x, rightElbow.y, rightWrist.x, rightWrist.y);
        
        // Legs
        if (leftHip && leftKnee) p.line(leftHip.x, leftHip.y, leftKnee.x, leftKnee.y);
        if (leftKnee && leftAnkle) p.line(leftKnee.x, leftKnee.y, leftAnkle.x, leftAnkle.y);
        if (rightHip && rightKnee) p.line(rightHip.x, rightHip.y, rightKnee.x, rightKnee.y);
        if (rightKnee && rightAnkle) p.line(rightKnee.x, rightKnee.y, rightAnkle.x, rightAnkle.y);
        
        // Joints
        p.fill(bodyColor);
        p.noStroke();
        if (leftWrist) p.circle(leftWrist.x, leftWrist.y, limbWidth);
        if (rightWrist) p.circle(rightWrist.x, rightWrist.y, limbWidth);
        if (leftAnkle) p.circle(leftAnkle.x, leftAnkle.y, limbWidth);
        if (rightAnkle) p.circle(rightAnkle.x, rightAnkle.y, limbWidth);
        
        if (leftElbow) p.circle(leftElbow.x, leftElbow.y, limbWidth * 0.8);
        if (rightElbow) p.circle(rightElbow.x, rightElbow.y, limbWidth * 0.8);
        if (leftKnee) p.circle(leftKnee.x, leftKnee.y, limbWidth * 0.8);
        if (rightKnee) p.circle(rightKnee.x, rightKnee.y, limbWidth * 0.8);
        if (leftShoulder) p.circle(leftShoulder.x, leftShoulder.y, limbWidth * 0.8);
        if (rightShoulder) p.circle(rightShoulder.x, rightShoulder.y, limbWidth * 0.8);
        if (leftHip) p.circle(leftHip.x, leftHip.y, limbWidth * 0.8);
        if (rightHip) p.circle(rightHip.x, rightHip.y, limbWidth * 0.8);
        
        // Head
        if (nose) {
            p.fill(bodyColor);
            p.noStroke();
            p.circle(nose.x, nose.y - 10, 50);
        }
        
        // Neck
        if (nose && leftShoulder && rightShoulder) {
            const neckX = (leftShoulder.x + rightShoulder.x) / 2;
            const neckY = (leftShoulder.y + rightShoulder.y) / 2;
            p.stroke(bodyColor);
            p.strokeWeight(limbWidth);
            p.line(nose.x, nose.y + 10, neckX, neckY);
        }
        
        p.pop();
    }

    /**
     * Spawn a new wall
     */
    spawnWall(p) {
        console.log('🧱 spawnWall appelé, activeWalls.length:', this.activeWalls.length);
        
        if (this.activeWalls.length === 0) {
            let availablePoses = [];
            
            if (this.level <= 2) {
                availablePoses = POSE_TYPES.filter(pose => pose.difficulty === 1);
            } else if (this.level <= 4) {
                availablePoses = POSE_TYPES;
            } else {
                availablePoses = POSE_TYPES;
            }
            
            // Remove STANDING TALL after first 2 walls
            if (this.totalWallsSpawned >= 2) {
                availablePoses = availablePoses.filter(pose => pose.name !== 'STANDING TALL');
            }
            
            // Anti-repetition
            if (this.lastPoseName && availablePoses.length > 1) {
                availablePoses = availablePoses.filter(pose => pose.name !== this.lastPoseName);
            }
            
            const poseType = p.random(availablePoses);
            this.lastPoseName = poseType.name;
            this.totalWallsSpawned++;
            
            const wall = new PoseWall(poseType, 400, p);
            this.activeWalls.push(wall);
            
            console.log('🧱 Nouveau mur créé:', poseType.name, 'Total walls:', this.activeWalls.length);
        }
    }

    /**
     * Dessiner l'aperçu webcam
     */
    drawWebcamPreview(p, pose) {
        const previewW = 240;
        const previewH = 180;
        const previewX = 15;
        const previewY = p.height - previewH - 15;
        
        this.previewGraphics.clear();
        this.previewGraphics.background(20, 20, 25);
        
        this.previewGraphics.push();
        this.previewGraphics.translate(previewW, 0);
        this.previewGraphics.scale(-1, 1);
        if (this.videoCapture && this.videoCapture.elt && this.videoCapture.elt.readyState >= 2) {
            this.previewGraphics.image(this.videoCapture, 0, 0, previewW, previewH);
        }
        this.previewGraphics.pop();
        
        // Draw skeleton overlay
        if (pose && this.connections) {
            this.previewGraphics.stroke(74, 222, 128, 220);
            this.previewGraphics.strokeWeight(3);
            this.previewGraphics.strokeCap(p.ROUND);
            
            const scaleX = previewW / 800;
            const scaleY = previewH / 600;
            
            for (let connection of this.connections) {
                let pointA = pose.keypoints[connection[0]];
                let pointB = pose.keypoints[connection[1]];
                
                if (pointA.confidence > 0.1 && pointB.confidence > 0.1) {
                    let ax = previewW - (pointA.x * scaleX);
                    let ay = pointA.y * scaleY;
                    let bx = previewW - (pointB.x * scaleX);
                    let by = pointB.y * scaleY;
                    this.previewGraphics.line(ax, ay, bx, by);
                }
            }
            
            this.previewGraphics.fill(255, 255, 255);
            this.previewGraphics.stroke(74, 222, 128);
            this.previewGraphics.strokeWeight(2);
            for (let keypoint of pose.keypoints) {
                if (keypoint.confidence > 0.1) {
                    let x = previewW - (keypoint.x * scaleX);
                    let y = keypoint.y * scaleY;
                    this.previewGraphics.circle(x, y, 8);
                }
            }
        }
        
        // Draw the preview on main canvas
        p.push();
        p.image(this.previewGraphics, previewX, previewY);
        
        p.noFill();
        p.stroke(100, 200, 255, 180);
        p.strokeWeight(2);
        p.rect(previewX, previewY, previewW, previewH, 8);
        
        p.fill(100, 200, 255, 200);
        p.noStroke();
        p.textSize(11);
        p.textAlign(p.LEFT);
        p.textStyle(p.BOLD);
        p.text('WEBCAM PREVIEW', previewX + 10, previewY + 20);
        p.textStyle(p.NORMAL);
        p.pop();
    }

    /**
     * Dessiner l'indicateur de progression du mur
     */
    drawWallIndicator(p) {
        if (this.activeWalls.length > 0) {
            let nearestWall = this.activeWalls.find(w => !w.scored);
            if (!nearestWall) return;
            
            let progress = p.map(nearestWall.z, 400, 60, 0, p.width - 280);
            
            p.push();
            p.noStroke();
            
            p.fill(30, 30, 40);
            p.rect(240, p.height - 50, p.width - 280, 4, 2);
            
            const matchScore = nearestWall.matchScore || 0;
            if (matchScore >= 75) {
                p.fill(...COLORS.success);
            } else if (matchScore >= 50) {
                p.fill(255, 200, 100);
            } else {
                p.fill(100, 100, 120);
            }
            p.rect(240, p.height - 50, progress, 4, 2);
            
            p.fill(255, 255, 255, 120);
            p.textAlign(p.RIGHT);
            p.textSize(11);
            p.text(nearestWall.poseType.name + ' ' + p.floor(matchScore) + '%', p.width - 30, p.height - 44);
            p.pop();
        }
    }

    /**
     * Dessiner le HUD
     */
    drawHUD(p) {
        p.push();
        p.fill(255);
        p.noStroke();
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(16);
        
        // Score
        p.fill(74, 222, 128);
        p.text('Score: ' + this.score, 20, 20);
        
        // Level
        p.fill(251, 191, 36);
        p.text('Level: ' + this.level, 20, 45);
        
        // Lives
        p.fill(248, 113, 113);
        p.text('Lives: ' + this.lives, 20, 70);
        
        p.pop();
    }

    /**
     * Afficher un feedback
     */
    showFeedback(p, text, col) {
        this.feedbackText = text;
        this.feedbackColor = col;
        this.feedbackTimer = 50;
    }

    /**
     * Dessiner le feedback
     */
    drawFeedback(p) {
        if (this.feedbackTimer > 0) {
            p.push();
            p.textAlign(p.CENTER, p.CENTER);
            
            let alpha = p.map(this.feedbackTimer, 50, 0, 255, 0);
            let size = p.map(this.feedbackTimer, 50, 0, 40, 50);
            let yOffset = p.map(this.feedbackTimer, 50, 0, 0, -20);
            
            p.textSize(size);
            p.textStyle(p.BOLD);
            p.fill(p.red(this.feedbackColor), p.green(this.feedbackColor), p.blue(this.feedbackColor), alpha);
            p.noStroke();
            p.text(this.feedbackText, p.width/2, p.height/3 + yOffset);
            p.textStyle(p.NORMAL);
            p.pop();
            this.feedbackTimer--;
        }
    }

    /**
     * Level up
     */
    levelUp(p) {
        this.level++;
        this.lastLevelScore = this.score;
        this.wallSpeed = p.min(4.0, 2.5 + (this.level - 1) * 0.15);
        this.wallSpawnInterval = p.max(80, 120 - (this.level - 1) * 5);
        this.showFeedback(p, 'LEVEL ' + this.level, p.color(...COLORS.warning));
    }

    /**
     * Game over
     */
    gameOver() {
        this.gamePhase = 'gameover';
        console.log(`💀 Game Over - Score: ${this.score}`);
        this.end('completed', this.score);
    }

    /**
     * Gestion des inputs
     */
    onKeyPressed(key) {
        if (key === ' ' && this.gamePhase === 'ready') {
            this.start();
        }
        if (key === 'r' && this.gamePhase === 'gameover') {
            this.start();
        }
    }

    /**
     * Nettoyage des ressources
     */
    cleanup() {
        console.log('🧹 WallShapesGame - Nettoyage');
        
        try {
            // Arrêter la détection ML5
            if (this.bodyPose) {
                this.bodyPose.detectStop();
                this.bodyPose = null;
            }
            
            // Arrêter la webcam
            if (this.videoCapture) {
                this.videoCapture.remove();
                this.videoCapture = null;
            }
            
            // Supprimer le graphics buffer
            if (this.previewGraphics) {
                this.previewGraphics.remove();
                this.previewGraphics = null;
            }
        } catch (error) {
            console.warn('⚠️ Erreur lors du nettoyage WallShapesGame:', error);
        }
        
        super.cleanup();
    }
}

/**
 * Classe PoseWall - Un mur avec une pose à reproduire
 */
class PoseWall {
    constructor(poseType, z, p) {
        this.poseType = poseType;
        this.z = z;
        this.maxZ = z;
        this.scored = false;
        this.matchScore = 0;
        this.passingThrough = false;
        this.passPhase = 0;
        this.p = p;
    }
    
    update(speed) {
        this.z -= speed;
        if (this.z <= 80 && this.z > -100) {
            this.passingThrough = true;
            this.passPhase = (80 - this.z) / 180;
        }
    }
    
    checkBodyMatch(p, pose) {
        if (!pose || !pose.keypoints) {
            this.matchScore = 0;
            return false;
        }
        
        this.matchScore = this.poseType.checkPose(pose.keypoints, p);
        return this.matchScore >= 75;
    }
    
    draw(p, playerPose) {
        const isMatched = this.checkBodyMatch(p, playerPose);
        
        if (this.passingThrough) {
            this.drawPassingWall(p);
            return;
        }
        
        const progress = 1 - (this.z / this.maxZ);
        const scale = p.lerp(0.3, 1.0, progress);
        
        p.push();
        p.translate(p.width / 2, p.height / 2 - 20);
        
        const w = 650 * scale;
        const h = 420 * scale;
        
        // Wall shadow
        p.noStroke();
        p.fill(0, 0, 0, 80);
        p.rect(-w/2 + 8, -h/2 + 8, w, h, 10);
        
        // Main wall
        if (isMatched) {
            p.fill(74, 222, 128, 200);
        } else {
            p.fill(COLORS.wall[0], COLORS.wall[1], COLORS.wall[2]);
        }
        p.stroke(COLORS.wallEdge[0], COLORS.wallEdge[1], COLORS.wallEdge[2]);
        p.strokeWeight(3);
        p.rect(-w/2, -h/2, w, h, 10);
        
        // Draw pose visual
        this.drawPoseVisual(p, scale, isMatched);
        
        // Pose name
        p.noStroke();
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(22 * scale);
        p.textStyle(p.BOLD);
        p.text(this.poseType.name, 0, -h/2 - 30 * scale);
        p.textStyle(p.NORMAL);
        p.textSize(14 * scale);
        p.fill(200);
        p.text(this.poseType.description, 0, -h/2 - 8 * scale);
        
        // Difficulty
        const diffStars = '★'.repeat(this.poseType.difficulty) + '☆'.repeat(3 - this.poseType.difficulty);
        p.textSize(12 * scale);
        p.fill(255, 200, 100);
        p.text(diffStars, 0, h/2 + 40 * scale);
        
        // Score indicator
        if (this.matchScore > 0) {
            p.fill(255, 255, 100);
            p.textSize(16 * scale);
            p.text(p.floor(this.matchScore) + '%', 0, h/2 + 22 * scale);
        }
        
        p.pop();
    }
    
    drawPoseVisual(p, scale, isMatched) {
        p.push();
        
        const s = 60 * scale;
        const headSize = 35 * scale;
        const limbWidth = 10 * scale;
        
        let col;
        if (isMatched) {
            col = p.color(255, 255, 255);
            p.stroke(30, 30, 30);
            p.strokeWeight(limbWidth + 4);
        } else {
            col = p.color(100, 200, 255);
            p.stroke(100, 200, 255);
            p.strokeWeight(limbWidth);
        }
        p.fill(col);
        
        const name = this.poseType.name;
        
        const drawStickman = (headY, torsoY, armStyle, legStyle) => {
            if (isMatched) {
                p.stroke(30, 30, 30);
                p.strokeWeight(limbWidth + 4);
                p.line(0, headY + headSize/2, 0, torsoY);
                this.drawArmsAndLegs(p, headY, torsoY, armStyle, legStyle, s, headSize);
                
                p.stroke(255, 255, 255);
                p.strokeWeight(limbWidth);
                p.line(0, headY + headSize/2, 0, torsoY);
                this.drawArmsAndLegs(p, headY, torsoY, armStyle, legStyle, s, headSize);
                
                p.stroke(30, 30, 30);
                p.strokeWeight(4);
                p.fill(255, 255, 255);
                p.circle(0, headY, headSize);
            } else {
                p.noStroke();
                p.fill(col);
                p.circle(0, headY, headSize);
                p.stroke(col);
                p.strokeWeight(limbWidth);
                p.line(0, headY + headSize/2, 0, torsoY);
                this.drawArmsAndLegs(p, headY, torsoY, armStyle, legStyle, s, headSize);
            }
        };
        
        // Draw each pose
        if (name === 'HANDS UP') {
            drawStickman(-s*1.6, s*0.2, 'up', 'together');
        } else if (name === 'T-POSE') {
            drawStickman(-s*1.6, s*0.2, 't-pose', 'together');
        } else if (name === 'STAR') {
            drawStickman(-s*1.6, s*0.2, 'star', 'wide');
        } else if (name === 'ONE HAND UP') {
            drawStickman(-s*1.6, s*0.2, 'left-up', 'together');
        } else if (name === 'ARMS FORWARD') {
            drawStickman(-s*1.6, s*0.2, 'forward', 'together');
        } else if (name === 'STANDING TALL') {
            drawStickman(-s*1.6, s*0.2, 'down', 'together');
        } else if (name === 'ARMS ON HIPS') {
            drawStickman(-s*1.6, s*0.2, 'on-hips', 'together');
        } else if (name === 'WIDE STANCE') {
            drawStickman(-s*1.6, s*0.2, 'down', 'wide');
        } else if (name === 'LEFT ARM UP') {
            drawStickman(-s*1.6, s*0.2, 'left-up', 'together');
        } else if (name === 'RIGHT ARM UP') {
            drawStickman(-s*1.6, s*0.2, 'right-up', 'together');
        } else if (name === 'CROSS ARMS') {
            drawStickman(-s*1.6, s*0.2, 'crossed', 'together');
        } else if (name === 'SUPERHERO') {
            drawStickman(-s*1.6, s*0.2, 'hero', 'together');
        }
        
        p.pop();
    }
    
    drawArmsAndLegs(p, headY, torsoY, armStyle, legStyle, s, headSize) {
        // Draw arms
        if (armStyle === 'up') {
            p.line(0, headY + headSize/2 + s*0.2, -s*0.3, headY - s*0.5);
            p.line(0, headY + headSize/2 + s*0.2, s*0.3, headY - s*0.5);
        } else if (armStyle === 't-pose') {
            p.line(-s*1.3, torsoY - s*0.8, s*1.3, torsoY - s*0.8);
        } else if (armStyle === 'star') {
            p.line(0, headY + headSize/2 + s*0.3, -s*0.9, headY - s*0.3);
            p.line(0, headY + headSize/2 + s*0.3, s*0.9, headY - s*0.3);
        } else if (armStyle === 'left-up') {
            p.line(0, headY + headSize/2 + s*0.2, -s*0.4, headY - s*0.5);
            p.line(0, headY + headSize/2 + s*0.4, s*0.6, headY + s*0.2);
        } else if (armStyle === 'right-up') {
            p.line(0, headY + headSize/2 + s*0.2, s*0.4, headY - s*0.5);
            p.line(0, headY + headSize/2 + s*0.4, -s*0.6, headY + s*0.2);
        } else if (armStyle === 'down') {
            p.line(0, headY + headSize/2 + s*0.4, -s*0.7, torsoY);
            p.line(0, headY + headSize/2 + s*0.4, s*0.7, torsoY);
        } else if (armStyle === 'crossed') {
            p.line(0, headY + headSize/2 + s*0.3, s*0.4, torsoY - s*0.3);
            p.line(0, headY + headSize/2 + s*0.3, -s*0.4, torsoY - s*0.3);
        } else if (armStyle === 'hero') {
            p.line(0, headY + headSize/2 + s*0.2, s*0.4, headY - s*0.5);
            p.line(0, headY + headSize/2 + s*0.4, -s*0.5, torsoY - s*0.2);
        } else if (armStyle === 'forward') {
            p.line(0, headY + headSize/2 + s*0.3, -s*0.6, headY + s*0.6);
            p.line(0, headY + headSize/2 + s*0.3, s*0.6, headY + s*0.6);
        } else if (armStyle === 'on-hips') {
            p.line(0, headY + headSize/2 + s*0.4, -s*0.6, torsoY - s*0.2);
            p.line(0, headY + headSize/2 + s*0.4, s*0.6, torsoY - s*0.2);
        }
        
        // Draw legs
        if (legStyle === 'together') {
            p.line(0, torsoY, -s*0.15, torsoY + s*1.1);
            p.line(0, torsoY, s*0.15, torsoY + s*1.1);
        } else if (legStyle === 'wide') {
            p.line(0, torsoY, -s*0.9, torsoY + s*1.1);
            p.line(0, torsoY, s*0.9, torsoY + s*1.1);
        }
    }
    
    drawPassingWall(p) {
        p.push();
        p.translate(p.width / 2, p.height / 2 - 20);
        
        const w = 650;
        const h = 420;
        const splitAmount = this.passPhase * 400;
        const alpha = p.map(this.passPhase, 0, 1, 255, 0);
        
        p.push();
        p.translate(-splitAmount, 0);
        p.noStroke();
        p.fill(COLORS.wall[0], COLORS.wall[1], COLORS.wall[2], alpha);
        p.rect(-w/2, -h/2, w/2 - 30, h, 10);
        p.pop();
        
        p.push();
        p.translate(splitAmount, 0);
        p.noStroke();
        p.fill(COLORS.wall[0], COLORS.wall[1], COLORS.wall[2], alpha);
        p.rect(30, -h/2, w/2 - 30, h, 10);
        p.pop();
        
        p.pop();
    }
    
    isAtPlayer() {
        return this.z <= 80 && this.z > 60 && !this.scored;
    }
    
    hasPassed() {
        return this.z <= -100;
    }
}
