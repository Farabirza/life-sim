import Phaser from 'phaser'

export class WorldScene extends Phaser.Scene {

    private player!: Phaser.Physics.Arcade.Image

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    private wasd!: {
        W: Phaser.Input.Keyboard.Key
        A: Phaser.Input.Keyboard.Key
        S: Phaser.Input.Keyboard.Key
        D: Phaser.Input.Keyboard.Key
    }

    private obstacles!: Phaser.Physics.Arcade.StaticGroup

    private readonly TILE_SIZE = 32
    private readonly MAP_WIDTH = 50
    private readonly MAP_HEIGHT = 50

    constructor() {
        super('WorldScene')
    }

    create() {
        this.createTextures()

        const worldWidth = this.MAP_WIDTH * this.TILE_SIZE
        const worldHeight = this.MAP_HEIGHT * this.TILE_SIZE

        // World boundaries
        this.physics.world.setBounds(
            0,
            0,
            worldWidth,
            worldHeight
        )

        // Terrain
        this.createWorld()

        // Player
        this.player = this.physics.add.image(
            5 * this.TILE_SIZE + this.TILE_SIZE / 2,
            5 * this.TILE_SIZE + this.TILE_SIZE / 2,
            'player'
        )

        this.player.setCollideWorldBounds(true)

        // Player vs obstacles
        this.physics.add.collider(
            this.player,
            this.obstacles
        )

        // Keyboard
        this.cursors = this.input.keyboard!.createCursorKeys()

        this.wasd = this.input.keyboard!.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D
        }) as typeof this.wasd

        // Camera
        this.cameras.main.setBounds(
            0,
            0,
            worldWidth,
            worldHeight
        )

        this.cameras.main.startFollow(
            this.player,
            true,
            0.1,
            0.1
        )
    }

    update() {
        const speed = 180

        this.player.setVelocity(0)

        const left =
            this.cursors.left.isDown ||
            this.wasd.A.isDown

        const right =
            this.cursors.right.isDown ||
            this.wasd.D.isDown

        const up =
            this.cursors.up.isDown ||
            this.wasd.W.isDown

        const down =
            this.cursors.down.isDown ||
            this.wasd.S.isDown

        if (left) {
            this.player.setVelocityX(-speed)
        }

        if (right) {
            this.player.setVelocityX(speed)
        }

        if (up) {
            this.player.setVelocityY(-speed)
        }

        if (down) {
            this.player.setVelocityY(speed)
        }

        if (
            this.player.body!.velocity.x !== 0 ||
            this.player.body!.velocity.y !== 0
        ) {
            this.player.body!.velocity
                .normalize()
                .scale(speed)
        }
    }

    private createTextures() {

        // Player
        const playerGraphics = this.make.graphics({ x: 0, y: 0 })

        playerGraphics.fillStyle(0xff3333)
        playerGraphics.fillRect(0, 0, 24, 28)

        playerGraphics.generateTexture(
            'player',
            24,
            28
        )

        playerGraphics.destroy()

        // Grass
        const grassGraphics = this.make.graphics({ x: 0, y: 0 })

        grassGraphics.fillStyle(0x63a84d)
        grassGraphics.fillRect(
            0,
            0,
            this.TILE_SIZE,
            this.TILE_SIZE
        )

        grassGraphics.generateTexture(
            'grass',
            this.TILE_SIZE,
            this.TILE_SIZE
        )

        grassGraphics.destroy()

        // Dirt
        const dirtGraphics = this.make.graphics({ x: 0, y: 0 })

        dirtGraphics.fillStyle(0xa67c52)
        dirtGraphics.fillRect(
            0,
            0,
            this.TILE_SIZE,
            this.TILE_SIZE
        )

        dirtGraphics.generateTexture(
            'dirt',
            this.TILE_SIZE,
            this.TILE_SIZE
        )

        dirtGraphics.destroy()

        // Water
        const waterGraphics = this.make.graphics({ x: 0, y: 0 })

        waterGraphics.fillStyle(0x3498db)
        waterGraphics.fillRect(
            0,
            0,
            this.TILE_SIZE,
            this.TILE_SIZE
        )

        waterGraphics.generateTexture(
            'water',
            this.TILE_SIZE,
            this.TILE_SIZE
        )

        waterGraphics.destroy()

        // Tree
        const treeGraphics = this.make.graphics({ x: 0, y: 0 })

        treeGraphics.fillStyle(0x1e6b34)
        treeGraphics.fillRect(
            0,
            0,
            this.TILE_SIZE,
            this.TILE_SIZE
        )

        treeGraphics.generateTexture(
            'tree',
            this.TILE_SIZE,
            this.TILE_SIZE
        )

        treeGraphics.destroy()

        // Rock
        const rockGraphics = this.make.graphics({ x: 0, y: 0 })

        rockGraphics.fillStyle(0x777777)
        rockGraphics.fillRect(
            0,
            0,
            this.TILE_SIZE,
            this.TILE_SIZE
        )

        rockGraphics.generateTexture(
            'rock',
            this.TILE_SIZE,
            this.TILE_SIZE
        )

        rockGraphics.destroy()
    }

    private createWorld() {

        this.obstacles = this.physics.add.staticGroup()

        for (let y = 0; y < this.MAP_HEIGHT; y++) {

            for (let x = 0; x < this.MAP_WIDTH; x++) {

                const pixelX =
                    x * this.TILE_SIZE +
                    this.TILE_SIZE / 2

                const pixelY =
                    y * this.TILE_SIZE +
                    this.TILE_SIZE / 2

                // Default terrain
                let terrain = 'grass'

                // Lake
                if (
                    x >= 10 &&
                    x <= 18 &&
                    y >= 8 &&
                    y <= 15
                ) {
                    terrain = 'water'
                }

                // Dirt/farm area
                if (
                    x >= 25 &&
                    x <= 35 &&
                    y >= 20 &&
                    y <= 28
                ) {
                    terrain = 'dirt'
                }

                this.add.image(
                    pixelX,
                    pixelY,
                    terrain
                )

                // Water collision
                if (terrain === 'water') {
                    this.obstacles
                        .create(pixelX, pixelY, 'water')
                        .setVisible(false)
                }
            }
        }

        // Trees
        this.createObstacle(7, 10, 'tree')
        this.createObstacle(8, 10, 'tree')
        this.createObstacle(7, 11, 'tree')

        this.createObstacle(22, 7, 'tree')
        this.createObstacle(23, 7, 'tree')
        this.createObstacle(24, 7, 'tree')

        // Rocks
        this.createObstacle(20, 20, 'rock')
        this.createObstacle(21, 20, 'rock')
        this.createObstacle(22, 20, 'rock')
    }

    private createObstacle(
        tileX: number,
        tileY: number,
        texture: string
    ) {

        const x =
            tileX * this.TILE_SIZE +
            this.TILE_SIZE / 2

        const y =
            tileY * this.TILE_SIZE +
            this.TILE_SIZE / 2

        this.obstacles.create(
            x,
            y,
            texture
        )
    }
}