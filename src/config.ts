export const config = {
    //Audio
    audioActivated: true,
    
    //Paddle
    defaultPaddleWidth: 100,
    defaultPaddleMoveSpeed: 10,
    minPaddleWidthOnHitPaddleBrick: 25,
    maxPaddleWidthOnHitPaddleBrick: 300,
    
    //Bricks
    ballsBrickActivated: true,
    ballsBrickProbability: 25,
    ballsBrickProbabilityDivideWithCurrentLevel: true,
    giftBrickActivated: true,
    giftBrickProbability: 10,
    giftBrickProbabilityDivideWithCurrentLevel: true,
    largePaddleBrickActivated: true,
    largePaddleBrickProbability: 15,
    largePaddleBrickProbabilityDivideWithCurrentLevel: true,
    smallPaddleBrickActivated: true,
    smallPaddleBrickProbability: 10,
    brickChainActivated: true,
    brickChainProbability: 10,
    brickChainProbabilityMultiplyWithCurrentLevel: true,
    
    //Ball
    defaultBallSpeedMultiplier: 1,
    addBallSpeedMultiplierOnFinishedLevel: 0.2,
    minBallsOnHitBallBrick: 1,
    maxBallsOnHitBallBrick: 10,
    
    //LifePoints
    defaultLifePoints: 3,
    maxLifePoints: 3,
    addLifePointsOnFinishedLevel: 1,
    
    //Points
    addPointsOnHitBrick: 25,
    addPointsOnFinishedLevel: 1000,
    minPointsOnHitGiftBrick: 250,
    maxPointsOnHitGiftBrick: 1000,
    multiplierAddPointsWithCurrentLevel: true,
};