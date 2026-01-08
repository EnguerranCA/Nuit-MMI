// ===== POSE WALL GAME =====
// Match your body shape to the hole in the wall!

// Video and ML5 BodyPose
let video;
let bodyPose;
let poses = [];
let connections;
let poseReady = false;
let previewGraphics;
let cameraInitialized = false;

// Game state
let gameState = 'loading';
let score = 0;
let level = 1;
let lives = 3;
let lastLevelScore = 0;

// Game world
let wallSpeed = 2.5;
let wallSpawnTimer = 0;
let wallSpawnInterval = 120;
let lastPoseName = ''; // Anti-répétition
let totalWallsSpawned = 0; // Compteur pour STANDING TALL

// Colors
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
// difficulty: 1=Easy, 3=Hard (removed difficulty 2 - problematic poses)
const POSE_TYPES = [
    // ===== EASY POSES (Level 1-5) =====
    {
        name: 'HANDS UP',
        description: 'Both hands straight up',
        difficulty: 1,
        checkPose: function(keypoints) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            
            if (!nose || !leftShoulder || !rightShoulder || nose.confidence < 0.3) return 0;
            
            const shoulderDist = dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            
            // Both wrists above nose
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
        checkPose: function(keypoints) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            
            if (!leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            const centerY = (leftShoulder.y + rightShoulder.y) / 2;
            
            let score = 0;
            
            // Arms extended horizontally - MORE STRICT detection
            // Wrists must be far from body center AND at shoulder height
            const centerX = (leftShoulder.x + rightShoulder.x) / 2;
            
            if (leftWrist && leftWrist.confidence > 0.2) {
                const wristHeight = abs(leftWrist.y - centerY);
                const wristDist = abs(leftWrist.x - centerX);
                // Must be at shoulder level AND far from center
                if (wristHeight < shoulderDist * 0.5 && wristDist > shoulderDist * 0.8) score += 50;
            }
            if (rightWrist && rightWrist.confidence > 0.2) {
                const wristHeight = abs(rightWrist.y - centerY);
                const wristDist = abs(rightWrist.x - centerX);
                if (wristHeight < shoulderDist * 0.5 && wristDist > shoulderDist * 0.8) score += 50;
            }
            
            return score;
        }
    },
    {
        name: 'STAR',
        description: 'Arms and legs wide',
        difficulty: 1,
        checkPose: function(keypoints) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            const leftAnkle = keypoints[15];
            const rightAnkle = keypoints[16];
            
            if (!leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            const centerY = (leftShoulder.y + rightShoulder.y) / 2;
            
            let score = 0;
            
            // Arms up and wide
            if (leftWrist && leftWrist.confidence > 0.2) {
                if (leftWrist.y < centerY) score += 25;
            }
            if (rightWrist && rightWrist.confidence > 0.2) {
                if (rightWrist.y < centerY) score += 25;
            }
            
            // Legs wide apart
            if (leftAnkle && rightAnkle && leftAnkle.confidence > 0.2 && rightAnkle.confidence > 0.2) {
                const ankleDist = dist(leftAnkle.x, leftAnkle.y, rightAnkle.x, rightAnkle.y);
                if (ankleDist > shoulderDist * 1.2) score += 50;
            }
            
            return score;
        }
    },
    {
        name: 'ONE HAND UP',
        description: 'Left hand up',
        difficulty: 1,
        checkPose: function(keypoints) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            
            if (!nose || !leftShoulder || !rightShoulder || nose.confidence < 0.3) return 0;
            
            const shoulderDist = dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            
            // Left wrist above nose
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
        checkPose: function(keypoints) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftElbow = keypoints[7];
            const rightElbow = keypoints[8];
            
            if (!leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            
            // Elbows visible (arms bent forward)
            if (leftElbow && leftElbow.confidence > 0.2) score += 50;
            if (rightElbow && rightElbow.confidence > 0.2) score += 50;
            
            return score;
        }
    },
    {
        name: 'STANDING TALL',
        description: 'Stand straight, arms down',
        difficulty: 1,
        checkPose: function(keypoints) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftHip = keypoints[11];
            const rightHip = keypoints[12];
            
            if (!nose || !leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;
            
            const shoulderDist = dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            
            // Shoulders and hips aligned vertically
            const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
            const hipCenterX = (leftHip.x + rightHip.x) / 2;
            
            if (abs(shoulderCenterX - hipCenterX) < shoulderDist * 0.5) {
                score += 100;
            }
            
            return score;
        }
    },
    {
        name: 'ARMS ON HIPS',
        description: 'Hands on your hips',
        difficulty: 1,
        checkPose: function(keypoints) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            const leftHip = keypoints[11];
            const rightHip = keypoints[12];
            
            if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;
            
            const shoulderDist = dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            
            // Both wrists near hips
            if (leftWrist && leftHip && leftWrist.confidence > 0.2 && leftHip.confidence > 0.2) {
                if (dist(leftWrist.x, leftWrist.y, leftHip.x, leftHip.y) < shoulderDist * 1.2) score += 50;
            }
            if (rightWrist && rightHip && rightWrist.confidence > 0.2 && rightHip.confidence > 0.2) {
                if (dist(rightWrist.x, rightWrist.y, rightHip.x, rightHip.y) < shoulderDist * 1.2) score += 50;
            }
            
            return score;
        }
    },
    {
        name: 'WIDE STANCE',
        description: 'Legs wide apart',
        difficulty: 1,
        checkPose: function(keypoints) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftAnkle = keypoints[15];
            const rightAnkle = keypoints[16];
            
            if (!leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            
            // Legs wide apart
            if (leftAnkle && rightAnkle && leftAnkle.confidence > 0.2 && rightAnkle.confidence > 0.2) {
                const ankleDist = dist(leftAnkle.x, leftAnkle.y, rightAnkle.x, rightAnkle.y);
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
        checkPose: function(keypoints) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            
            if (!nose || !leftShoulder || !rightShoulder || nose.confidence < 0.3) return 0;
            
            const shoulderDist = dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            
            // Left wrist above nose
            if (leftWrist && leftWrist.confidence > 0.2) {
                if (leftWrist.y < nose.y) score += 60;
            }
            
            // Right wrist down
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
        checkPose: function(keypoints) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            
            if (!nose || !leftShoulder || !rightShoulder || nose.confidence < 0.3) return 0;
            
            const shoulderDist = dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            
            // Right wrist above nose
            if (rightWrist && rightWrist.confidence > 0.2) {
                if (rightWrist.y < nose.y) score += 60;
            }
            
            // Left wrist down
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
        checkPose: function(keypoints) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            
            if (!leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            const centerX = (leftShoulder.x + rightShoulder.x) / 2;
            const centerY = (leftShoulder.y + rightShoulder.y) / 2;
            
            let score = 0;
            
            // Wrists crossed in front of chest
            if (leftWrist && leftWrist.confidence > 0.2) {
                if (leftWrist.x > centerX && abs(leftWrist.y - centerY) < shoulderDist * 1.2) {
                    score += 50;
                }
            }
            if (rightWrist && rightWrist.confidence > 0.2) {
                if (rightWrist.x < centerX && abs(rightWrist.y - centerY) < shoulderDist * 1.2) {
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
        checkPose: function(keypoints) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            const leftHip = keypoints[11];
            const rightHip = keypoints[12];
            
            if (!nose || !leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let armUpScore = 0;
            let armDownScore = 0;
            
            // Check for one arm up
            if (leftWrist && leftWrist.confidence > 0.2 && leftWrist.y < nose.y) {
                armUpScore = 50;
                // Check right arm on hip
                if (rightWrist && rightHip && rightWrist.confidence > 0.2 && rightHip.confidence > 0.2) {
                    if (dist(rightWrist.x, rightWrist.y, rightHip.x, rightHip.y) < shoulderDist * 1.0) {
                        armDownScore = 50;
                    }
                }
            } else if (rightWrist && rightWrist.confidence > 0.2 && rightWrist.y < nose.y) {
                armUpScore = 50;
                // Check left arm on hip
                if (leftWrist && leftHip && leftWrist.confidence > 0.2 && leftHip.confidence > 0.2) {
                    if (dist(leftWrist.x, leftWrist.y, leftHip.x, leftHip.y) < shoulderDist * 1.0) {
                        armDownScore = 50;
                    }
                }
            }
            
            return armUpScore + armDownScore;
        }
    }
];

// Wall class with new detection system
class PoseWall {
    constructor(poseType, z) {
        this.poseType = poseType;
        this.z = z;
        this.maxZ = z;
        this.scored = false;
        this.matchScore = 0;
        this.passingThrough = false;
        this.passPhase = 0;
    }
    
    update(speed) {
        this.z -= speed;
        if (this.z <= 80 && this.z > -100) {
            this.passingThrough = true;
            this.passPhase = map(this.z, 80, -100, 0, 1);
        }
    }
    
    checkBodyMatch(pose) {
        if (!pose || !pose.keypoints) {
            this.matchScore = 0;
            return false;
        }
        
        // Use the pose's custom check function
        this.matchScore = this.poseType.checkPose(pose.keypoints);
        
        // Match threshold: 75/100 for more tolerance
        return this.matchScore >= 75;
    }
    
    draw(playerPose) {
        const isMatched = this.checkBodyMatch(playerPose);
        
        if (this.passingThrough) {
            this.drawPassingWall();
            return;
        }
        
        const progress = 1 - (this.z / this.maxZ);
        const scale = lerp(0.3, 1.0, progress);
        
        push();
        translate(width / 2, height / 2 - 20);
        
        const w = 650 * scale;
        const h = 420 * scale;
        
        // Wall shadow
        noStroke();
        fill(0, 0, 0, 80);
        rect(-w/2 + 8, -h/2 + 8, w, h, 10);
        
        // Main wall - color based on match
        if (isMatched) {
            fill(74, 222, 128, 200);
        } else {
            fill(COLORS.wall[0], COLORS.wall[1], COLORS.wall[2]);
        }
        stroke(COLORS.wallEdge[0], COLORS.wallEdge[1], COLORS.wallEdge[2]);
        strokeWeight(3);
        rect(-w/2, -h/2, w, h, 10);
        
        // Draw simple visual representation
        this.drawPoseVisual(scale, isMatched);
        
        // Pose name label
        noStroke();
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(22 * scale);
        textStyle(BOLD);
        text(this.poseType.name, 0, -h/2 - 30 * scale);
        textStyle(NORMAL);
        textSize(14 * scale);
        fill(200);
        text(this.poseType.description, 0, -h/2 - 8 * scale);
        
        // Difficulty indicator
        const diffStars = '★'.repeat(this.poseType.difficulty) + '☆'.repeat(3 - this.poseType.difficulty);
        textSize(12 * scale);
        fill(255, 200, 100);
        text(diffStars, 0, h/2 + 40 * scale);
        
        // Score indicator
        if (this.matchScore > 0) {
            fill(255, 255, 100);
            textSize(16 * scale);
            text(floor(this.matchScore) + '%', 0, h/2 + 22 * scale);
        }
        
        pop();
    }
    
    drawPoseVisual(scale, isMatched) {
        // Draw simplified stick figure showing the required pose
        push();
        
        const s = 60 * scale;
        const headSize = 35 * scale;
        const limbWidth = 10 * scale;
        
        // IMPROVED: When matched, use white with dark outline so pose stays visible on green
        let col;
        if (isMatched) {
            // White stickman with dark outline for visibility on green background
            col = color(255, 255, 255);
            stroke(30, 30, 30);
            strokeWeight(limbWidth + 4);
        } else {
            col = color(100, 200, 255);
            stroke(100, 200, 255);
            strokeWeight(limbWidth);
        }
        fill(col);
        
        const name = this.poseType.name;
        
        // Helper function to draw basic stick figure
        const drawStickman = (headY, torsoY, armStyle, legStyle) => {
            // Draw outline first if matched
            if (isMatched) {
                stroke(30, 30, 30);
                strokeWeight(limbWidth + 4);
                line(0, headY + headSize/2, 0, torsoY);
                drawArmsAndLegs(headY, torsoY, armStyle, legStyle, s);
                
                // Then draw white on top
                stroke(255, 255, 255);
                strokeWeight(limbWidth);
                line(0, headY + headSize/2, 0, torsoY);
                drawArmsAndLegs(headY, torsoY, armStyle, legStyle, s);
                
                // Head with outline
                stroke(30, 30, 30);
                strokeWeight(4);
                fill(255, 255, 255);
                circle(0, headY, headSize);
            } else {
                noStroke();
                fill(col);
                circle(0, headY, headSize);
                stroke(col);
                strokeWeight(limbWidth);
                line(0, headY + headSize/2, 0, torsoY);
                drawArmsAndLegs(headY, torsoY, armStyle, legStyle, s);
            }
        };
        
        // Separate function for arms and legs
        const drawArmsAndLegs = (headY, torsoY, armStyle, legStyle, s) => {
            
            // Draw arms based on style
            if (armStyle === 'up') {
                line(0, headY + headSize/2 + s*0.2, -s*0.3, headY - s*0.5);
                line(0, headY + headSize/2 + s*0.2, s*0.3, headY - s*0.5);
            } else if (armStyle === 't-pose') {
                line(-s*1.3, torsoY - s*0.8, s*1.3, torsoY - s*0.8);
            } else if (armStyle === 'star') {
                line(0, headY + headSize/2 + s*0.3, -s*0.9, headY - s*0.3);
                line(0, headY + headSize/2 + s*0.3, s*0.9, headY - s*0.3);
            } else if (armStyle === 'left-up') {
                line(0, headY + headSize/2 + s*0.2, -s*0.4, headY - s*0.5);
                line(0, headY + headSize/2 + s*0.4, s*0.6, headY + s*0.2);
            } else if (armStyle === 'right-up') {
                line(0, headY + headSize/2 + s*0.2, s*0.4, headY - s*0.5);
                line(0, headY + headSize/2 + s*0.4, -s*0.6, headY + s*0.2);
            } else if (armStyle === 'down') {
                line(0, headY + headSize/2 + s*0.4, -s*0.7, torsoY);
                line(0, headY + headSize/2 + s*0.4, s*0.7, torsoY);
            } else if (armStyle === 'crossed') {
                line(0, headY + headSize/2 + s*0.3, s*0.4, torsoY - s*0.3);
                line(0, headY + headSize/2 + s*0.3, -s*0.4, torsoY - s*0.3);
            } else if (armStyle === 'hero') {
                line(0, headY + headSize/2 + s*0.2, s*0.4, headY - s*0.5);
                line(0, headY + headSize/2 + s*0.4, -s*0.5, torsoY - s*0.2);
            } else if (armStyle === 'y-pose') {
                line(0, headY + headSize/2 + s*0.2, -s*0.8, headY - s*0.5);
                line(0, headY + headSize/2 + s*0.2, s*0.8, headY - s*0.5);
            } else if (armStyle === 'forward') {
                line(0, headY + headSize/2 + s*0.3, -s*0.6, headY + s*0.6);
                line(0, headY + headSize/2 + s*0.3, s*0.6, headY + s*0.6);
            } else if (armStyle === 'on-hips') {
                line(0, headY + headSize/2 + s*0.4, -s*0.6, torsoY - s*0.2);
                line(0, headY + headSize/2 + s*0.4, s*0.6, torsoY - s*0.2);
            }
            
            // Draw legs based on style
            if (legStyle === 'together') {
                line(0, torsoY, -s*0.15, torsoY + s*1.1);
                line(0, torsoY, s*0.15, torsoY + s*1.1);
            } else if (legStyle === 'wide') {
                line(0, torsoY, -s*0.9, torsoY + s*1.1);
                line(0, torsoY, s*0.9, torsoY + s*1.1);
            } else if (legStyle === 'bent') {
                line(0, torsoY - s*0.2, -s*0.4, torsoY + s*0.6);
                line(0, torsoY - s*0.2, s*0.4, torsoY + s*0.6);
            } else if (legStyle === 'diagonal') {
                line(0, torsoY, -s*0.15, torsoY + s*1.1);
                line(0, torsoY, s*0.9, torsoY + s*0.8);
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
        
        pop();
    }
    
    drawPassingWall() {
        push();
        translate(width / 2, height / 2 - 20);
        
        const w = 650;
        const h = 420;
        const splitAmount = this.passPhase * 400;
        const alpha = map(this.passPhase, 0, 1, 255, 0);
        
        push();
        translate(-splitAmount, 0);
        noStroke();
        fill(COLORS.wall[0], COLORS.wall[1], COLORS.wall[2], alpha);
        rect(-w/2, -h/2, w/2 - 30, h, 10);
        pop();
        
        push();
        translate(splitAmount, 0);
        noStroke();
        fill(COLORS.wall[0], COLORS.wall[1], COLORS.wall[2], alpha);
        rect(30, -h/2, w/2 - 30, h, 10);
        pop();
        
        pop();
    }
    
    isAtPlayer() {
        return this.z <= 80 && this.z > 60 && !this.scored;
    }
    
    hasPassed() {
        return this.z <= -100;
    }
}

let activeWalls = [];

function preload() {
    bodyPose = ml5.bodyPose('MoveNet', {
        modelType: 'SINGLEPOSE_LIGHTNING',
        enableSmoothing: true,
        flipped: false
    });
}

function setup() {
    let canvas = createCanvas(800, 600);
    canvas.parent('canvas-container');
    
    previewGraphics = createGraphics(200, 150);
    textFont('Inter, system-ui, sans-serif');
    connections = bodyPose.getSkeleton();
    
    document.getElementById('camera-btn').onclick = requestCamera;
    document.getElementById('start-btn').onclick = startGame;
    
    // Try to init camera automatically
    initCamera();
}

function initCamera() {
    updateStatus('Initializing camera...');
    document.getElementById('pose-status').textContent = 'Starting camera...';
    
    // Try to create capture directly
    try {
        video = createCapture(VIDEO, function(stream) {
            if (stream) {
                onCameraReady();
            }
        });
        video.size(800, 600);
        video.hide();
        
        // Fallback: if no stream after 2 seconds, show button
        setTimeout(function() {
            if (!cameraInitialized) {
                document.getElementById('pose-status').textContent = 'Camera access needed';
                document.getElementById('camera-btn').classList.remove('hidden');
                updateStatus('Click button to enable camera');
            }
        }, 2000);
    } catch(err) {
        console.error('Camera init error:', err);
        document.getElementById('pose-status').textContent = 'Camera access needed';
        document.getElementById('camera-btn').classList.remove('hidden');
        updateStatus('Click button to enable camera');
    }
}

function requestCamera() {
    updateStatus('Requesting camera access...');
    document.getElementById('camera-btn').textContent = 'Requesting...';
    document.getElementById('camera-btn').disabled = true;
    document.getElementById('pose-status').textContent = 'Requesting permission...';
    
    // Force browser prompt
    if (video) {
        video.remove();
        video = null;
    }
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function(stream) {
            stream.getTracks().forEach(track => track.stop());
            video = createCapture(VIDEO);
            video.size(800, 600);
            video.hide();
            setTimeout(function() {
                onCameraReady();
            }, 500);
        })
        .catch(function(err) {
            console.error('Camera access denied:', err);
            updateStatus('Camera access denied');
            document.getElementById('pose-status').textContent = 'Camera denied. Please allow camera access.';
            document.getElementById('camera-btn').textContent = 'Try Again';
            document.getElementById('camera-btn').disabled = false;
        });
}

function onCameraReady() {
    cameraInitialized = true;
    bodyPose.detectStart(video, gotPoses);
    document.getElementById('camera-btn').classList.add('hidden');
    document.getElementById('pose-status').textContent = 'Camera ready. Detecting pose...';
    updateStatus('Camera active. Waiting for pose...');
    gameState = 'ready';
}

function gotPoses(results) {
    poses = results;
    if (poses.length > 0 && !poseReady) {
        poseReady = true;
        document.getElementById('pose-status').textContent = 'Pose detected! Ready to play.';
        document.getElementById('pose-status').classList.add('ready');
        document.getElementById('start-btn').classList.remove('hidden');
        updateStatus('Ready to play!');
    }
}

function startGame() {
    if (gameState === 'ready' || gameState === 'gameover') {
        score = 0;
        level = 1;
        lives = 3;
        lastLevelScore = 0;
        wallSpeed = 2.5;
        wallSpawnInterval = 120;
        activeWalls = [];
        wallSpawnTimer = 0;
        lastPoseName = ''; // Reset anti-repetition
        totalWallsSpawned = 0; // Reset wall counter
        gameState = 'playing';
        
        document.getElementById('instructions').classList.add('hidden');
        const gameOverScreen = document.querySelector('.game-over');
        if (gameOverScreen) gameOverScreen.remove();
        
        updateUI();
        updateStatus('Match the pose');
    }
}

function draw() {
    drawEnvironment();
    
    let playerPose = poses.length > 0 ? poses[0] : null;
    
    if (playerPose && gameState === 'playing') {
        drawStickman(playerPose);
    }
    
    if (gameState === 'playing') {
        wallSpawnTimer++;
        if (wallSpawnTimer >= wallSpawnInterval) {
            spawnWall();
            wallSpawnTimer = 0;
        }
        
        activeWalls.sort((a, b) => b.z - a.z);
        
        for (let i = activeWalls.length - 1; i >= 0; i--) {
            let wall = activeWalls[i];
            wall.update(wallSpeed);
            wall.draw(playerPose);
            
            if (wall.isAtPlayer() && !wall.scored) {
                wall.scored = true;
                const isMatch = wall.checkBodyMatch(playerPose);
                if (isMatch) {
                    // Score basé sur la précision (matchScore 75-100 = 75-100 points)
                    const points = Math.floor(wall.matchScore);
                    score += points;
                    
                    if (wall.matchScore >= 95) {
                        showFeedback('PERFECT! +' + points, color(...COLORS.success));
                    } else {
                        showFeedback('GOOD! +' + points, color(...COLORS.warning));
                    }
                } else {
                    lives--;
                    showFeedback('MISS', color(...COLORS.danger));
                    if (lives <= 0) {
                        gameOver();
                    }
                }
                updateUI();
            }
            
            if (wall.hasPassed()) {
                activeWalls.splice(i, 1);
            }
        }
        
        if (score >= lastLevelScore + 400) {
            levelUp();
        }
        
        drawWallIndicator();
    }
    
    drawFeedback();
    
    if (cameraInitialized) {
        drawWebcamPreview(playerPose);
    }
}

function drawEnvironment() {
    background(15, 18, 25);
    
    noStroke();
    for (let i = 0; i < 5; i++) {
        let alpha = 20 - i * 4;
        fill(40, 60, 100, alpha);
        ellipse(width/2, height * 0.45, 600 + i * 100, 30 + i * 10);
    }
    
    drawPlatform();
}

function drawPlatform() {
    push();
    
    const horizonY = height * 0.45;
    const bottomY = height;
    const farW = 120;
    const nearW = 700;
    
    noStroke();
    fill(50, 55, 65);
    beginShape();
    vertex(width/2 - farW/2, horizonY);
    vertex(width/2 + farW/2, horizonY);
    vertex(width/2 + nearW/2, bottomY);
    vertex(width/2 - nearW/2, bottomY);
    endShape(CLOSE);
    
    stroke(80, 90, 110);
    strokeWeight(3);
    line(width/2 - farW/2, horizonY, width/2 - nearW/2, bottomY);
    line(width/2 + farW/2, horizonY, width/2 + nearW/2, bottomY);
    
    stroke(180, 180, 100, 150);
    strokeWeight(4);
    for (let i = 0; i < 12; i++) {
        let t1 = i / 12;
        let t2 = (i + 0.4) / 12;
        let y1 = lerp(horizonY, bottomY, t1);
        let y2 = lerp(horizonY, bottomY, t2);
        line(width/2, y1, width/2, y2);
    }
    
    stroke(60, 65, 75, 80);
    strokeWeight(1);
    for (let i = 1; i < 10; i++) {
        let t = Math.pow(i / 10, 1.5);
        let y = lerp(horizonY, bottomY, t);
        let w = lerp(farW, nearW, t);
        line(width/2 - w/2, y, width/2 + w/2, y);
    }
    
    pop();
}

function drawStickman(pose) {
    if (!pose || !connections) return;
    
    push();
    
    const scaleX = 0.8;
    const scaleY = 0.8;
    const offsetX = width * 0.1;
    const offsetY = height * 0.05;
    
    const getPos = (keypoint) => {
        if (!keypoint || keypoint.confidence < 0.1) return null;
        return {
            x: (width - keypoint.x) * scaleX + offsetX,
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
    
    strokeCap(ROUND);
    strokeJoin(ROUND);
    
    const bodyColor = color(255, 255, 255);
    const limbWidth = 22;
    const torsoWidth = 28;
    
    stroke(bodyColor);
    noFill();
    
    if (leftShoulder && rightShoulder && leftHip && rightHip) {
        strokeWeight(torsoWidth);
        fill(bodyColor);
        noStroke();
        beginShape();
        vertex(leftShoulder.x, leftShoulder.y);
        vertex(rightShoulder.x, rightShoulder.y);
        vertex(rightHip.x, rightHip.y);
        vertex(leftHip.x, leftHip.y);
        endShape(CLOSE);
        
        stroke(bodyColor);
        strokeWeight(limbWidth);
        line(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
        line(leftHip.x, leftHip.y, rightHip.x, rightHip.y);
        line(leftShoulder.x, leftShoulder.y, leftHip.x, leftHip.y);
        line(rightShoulder.x, rightShoulder.y, rightHip.x, rightHip.y);
    }
    
    stroke(bodyColor);
    strokeWeight(limbWidth);
    if (leftShoulder && leftElbow) line(leftShoulder.x, leftShoulder.y, leftElbow.x, leftElbow.y);
    if (leftElbow && leftWrist) line(leftElbow.x, leftElbow.y, leftWrist.x, leftWrist.y);
    if (rightShoulder && rightElbow) line(rightShoulder.x, rightShoulder.y, rightElbow.x, rightElbow.y);
    if (rightElbow && rightWrist) line(rightElbow.x, rightElbow.y, rightWrist.x, rightWrist.y);
    
    if (leftHip && leftKnee) line(leftHip.x, leftHip.y, leftKnee.x, leftKnee.y);
    if (leftKnee && leftAnkle) line(leftKnee.x, leftKnee.y, leftAnkle.x, leftAnkle.y);
    if (rightHip && rightKnee) line(rightHip.x, rightHip.y, rightKnee.x, rightKnee.y);
    if (rightKnee && rightAnkle) line(rightKnee.x, rightKnee.y, rightAnkle.x, rightAnkle.y);
    
    fill(bodyColor);
    noStroke();
    if (leftWrist) circle(leftWrist.x, leftWrist.y, limbWidth);
    if (rightWrist) circle(rightWrist.x, rightWrist.y, limbWidth);
    if (leftAnkle) circle(leftAnkle.x, leftAnkle.y, limbWidth);
    if (rightAnkle) circle(rightAnkle.x, rightAnkle.y, limbWidth);
    
    if (leftElbow) circle(leftElbow.x, leftElbow.y, limbWidth * 0.8);
    if (rightElbow) circle(rightElbow.x, rightElbow.y, limbWidth * 0.8);
    if (leftKnee) circle(leftKnee.x, leftKnee.y, limbWidth * 0.8);
    if (rightKnee) circle(rightKnee.x, rightKnee.y, limbWidth * 0.8);
    if (leftShoulder) circle(leftShoulder.x, leftShoulder.y, limbWidth * 0.8);
    if (rightShoulder) circle(rightShoulder.x, rightShoulder.y, limbWidth * 0.8);
    if (leftHip) circle(leftHip.x, leftHip.y, limbWidth * 0.8);
    if (rightHip) circle(rightHip.x, rightHip.y, limbWidth * 0.8);
    
    if (nose) {
        fill(bodyColor);
        noStroke();
        circle(nose.x, nose.y - 10, 50);
    }
    
    if (nose && leftShoulder && rightShoulder) {
        const neckX = (leftShoulder.x + rightShoulder.x) / 2;
        const neckY = (leftShoulder.y + rightShoulder.y) / 2;
        stroke(bodyColor);
        strokeWeight(limbWidth);
        line(nose.x, nose.y + 10, neckX, neckY);
    }
    
    pop();
}

function spawnWall() {
    if (activeWalls.length === 0) {
        // Filter poses by difficulty based on level
        let availablePoses = [];
        
        if (level <= 2) {
            // Easy poses only for levels 1-2
            availablePoses = POSE_TYPES.filter(p => p.difficulty === 1);
        } else if (level <= 4) {
            // Easy + some Hard for levels 3-4
            availablePoses = POSE_TYPES;
        } else {
            // All poses for level 5+
            availablePoses = POSE_TYPES;
        }
        
        // Remove STANDING TALL after first 2 walls (too easy)
        if (totalWallsSpawned >= 2) {
            availablePoses = availablePoses.filter(p => p.name !== 'STANDING TALL');
        }
        
        // Anti-repetition: filter out last pose
        if (lastPoseName && availablePoses.length > 1) {
            availablePoses = availablePoses.filter(p => p.name !== lastPoseName);
        }
        
        const poseType = random(availablePoses);
        lastPoseName = poseType.name;
        totalWallsSpawned++;
        
        const wall = new PoseWall(poseType, 400);
        activeWalls.push(wall);
    }
}

function drawWebcamPreview(pose) {
    const previewW = 240;
    const previewH = 180;
    const previewX = 15;
    const previewY = height - previewH - 15;
    
    // Clear and draw video
    previewGraphics.clear();
    previewGraphics.background(20, 20, 25);
    
    previewGraphics.push();
    previewGraphics.translate(previewW, 0);
    previewGraphics.scale(-1, 1);
    if (video && video.elt && video.elt.readyState >= 2) {
        previewGraphics.image(video, 0, 0, previewW, previewH);
    }
    previewGraphics.pop();
    
    // Draw skeleton overlay
    if (pose && connections) {
        previewGraphics.stroke(74, 222, 128, 220);
        previewGraphics.strokeWeight(3);
        previewGraphics.strokeCap(ROUND);
        
        const scaleX = previewW / 800;
        const scaleY = previewH / 600;
        
        for (let connection of connections) {
            let pointA = pose.keypoints[connection[0]];
            let pointB = pose.keypoints[connection[1]];
            
            if (pointA.confidence > 0.1 && pointB.confidence > 0.1) {
                let ax = previewW - (pointA.x * scaleX);
                let ay = pointA.y * scaleY;
                let bx = previewW - (pointB.x * scaleX);
                let by = pointB.y * scaleY;
                previewGraphics.line(ax, ay, bx, by);
            }
        }
        
        previewGraphics.fill(255, 255, 255);
        previewGraphics.stroke(74, 222, 128);
        previewGraphics.strokeWeight(2);
        for (let keypoint of pose.keypoints) {
            if (keypoint.confidence > 0.1) {
                let x = previewW - (keypoint.x * scaleX);
                let y = keypoint.y * scaleY;
                previewGraphics.circle(x, y, 8);
            }
        }
    }
    
    // Draw the preview on main canvas
    push();
    image(previewGraphics, previewX, previewY);
    
    // Border and label
    noFill();
    stroke(100, 200, 255, 180);
    strokeWeight(2);
    rect(previewX, previewY, previewW, previewH, 8);
    
    fill(100, 200, 255, 200);
    noStroke();
    textSize(11);
    textAlign(LEFT);
    textStyle(BOLD);
    text('WEBCAM PREVIEW', previewX + 10, previewY + 20);
    textStyle(NORMAL);
    pop();
}

function drawWallIndicator() {
    if (activeWalls.length > 0) {
        let nearestWall = activeWalls.find(w => !w.scored);
        if (!nearestWall) return;
        
        let progress = map(nearestWall.z, 400, 60, 0, width - 280);
        
        push();
        noStroke();
        
        fill(30, 30, 40);
        rect(240, height - 50, width - 280, 4, 2);
        
        const matchScore = nearestWall.matchScore || 0;
        if (matchScore >= 75) {
            fill(...COLORS.success);
        } else if (matchScore >= 50) {
            fill(255, 200, 100);
        } else {
            fill(100, 100, 120);
        }
        rect(240, height - 50, progress, 4, 2);
        
        fill(255, 255, 255, 120);
        textAlign(RIGHT);
        textSize(11);
        text(nearestWall.poseType.name + ' ' + floor(matchScore) + '%', width - 30, height - 44);
        pop();
    }
}

let feedbackText = '';
let feedbackColor;
let feedbackTimer = 0;

function showFeedback(text, col) {
    feedbackText = text;
    feedbackColor = col;
    feedbackTimer = 50;
}

function drawFeedback() {
    if (feedbackTimer > 0) {
        push();
        textAlign(CENTER, CENTER);
        
        let alpha = map(feedbackTimer, 50, 0, 255, 0);
        let size = map(feedbackTimer, 50, 0, 40, 50);
        let yOffset = map(feedbackTimer, 50, 0, 0, -20);
        
        textSize(size);
        textStyle(BOLD);
        fill(red(feedbackColor), green(feedbackColor), blue(feedbackColor), alpha);
        noStroke();
        text(feedbackText, width/2, height/3 + yOffset);
        textStyle(NORMAL);
        pop();
        feedbackTimer--;
    }
}

function levelUp() {
    level++;
    lastLevelScore = score;
    wallSpeed = min(4.0, 2.5 + (level - 1) * 0.15); // Augmentation modérée, max 4.0
    wallSpawnInterval = max(80, 120 - (level - 1) * 5); // Spawn plus rapide
    showFeedback('LEVEL ' + level, color(...COLORS.warning));
    updateUI();
}

function gameOver() {
    gameState = 'gameover';
    
    const gameOverDiv = document.createElement('div');
    gameOverDiv.className = 'game-over';
    gameOverDiv.innerHTML = `
        <h2>GAME OVER</h2>
        <p class="subtitle">Final Score</p>
        <div class="final-score">${score}</div>
        <p class="stats">Level ${level}</p>
        <button onclick="location.reload()">Play Again</button>
    `;
    document.getElementById('game-container').appendChild(gameOverDiv);
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lives').textContent = lives;
}

function updateStatus(text) {
    document.getElementById('status-display').textContent = text;
}

function keyPressed() {
    if (key === ' ' && gameState === 'ready') {
        startGame();
    }
    if (key === 'r' && gameState === 'gameover') {
        location.reload();
    }
}
