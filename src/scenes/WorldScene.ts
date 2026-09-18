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

    constructor() {
        super('WorldScene')
    }

    preload() {

        this.load.on('loaderror', (file: Phaser.Loader.File) => {
            console.error(
                'FAILED TO LOAD:',
                file.key,
                file.src
            )
        })

        this.load.on('filecomplete', (key: string) => {
            console.log(
                'LOADED:',
                key
            )
        })

        this.load.image(
            'terrain',
            '/assets/tilesets/terrain.png'
        )

        this.load.image(
            'nature_objects1',
            '/assets/tilesets/nature_objects1.png'
        )

        this.load.tilemapTiledJSON(
            'farm',
            '/assets/maps/farm.json'
        )
    }

    create() {

        console.log('WorldScene create() started')

        const map = this.make.tilemap({
            key: 'farm'
        })

        console.log('MAP:', map)
        console.log('MAP SIZE:', map.width, map.height)
        console.log('TILE SIZE:', map.tileWidth, map.tileHeight)
        console.log('TILESETS:', map.tilesets)

        const terrainTileset  = map.addTilesetImage(
            'terrain',
            'terrain'
        )
        
        const natureTileset = map.addTilesetImage(
            'nature_objects1',
            'nature_objects1'
        )

        if (!terrainTileset || !natureTileset) {
            throw new Error('One or more tilesets could not be loaded')
        }

        const tilesets = [
            terrainTileset,
            natureTileset
        ]

        // Ground
        const groundLayer = map.createLayer(
            'Ground',
            tilesets ,
            0,
            0
        )
        groundLayer?.setDepth(0)

        // GroundDecoration
        const decorationLayer = map.createLayer(
            'GroundDecoration',
            tilesets ,
            0,
            0
        )
        decorationLayer?.setDepth(1)

        // Objects
        const objectLayer = map.createLayer(
            'Objects',
            tilesets ,
            0,
            0
        )
        objectLayer?.setDepth(5)

        const eventsLayer =
            map.getObjectLayer('Events')

        const spawn =
            eventsLayer?.objects.find(
                object => object.name === 'PlayerSpawn'
            )

        const spawnX =
            spawn?.x ?? 400

        const spawnY =
            spawn?.y ?? 300

        this.createPlayerTexture()

        this.player = this.physics.add.image(
            spawnX,
            spawnY,
            'player'
        )
        this.player.setDepth(10)

        this.player.setCollideWorldBounds(true)

        this.physics.world.setBounds(
            0,
            0,
            map.widthInPixels,
            map.heightInPixels
        )

        this.cursors =
            this.input.keyboard!.createCursorKeys()

        this.wasd = this.input.keyboard!.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D
        }) as typeof this.wasd

        this.cameras.main.setBounds(
            0,
            0,
            map.widthInPixels,
            map.heightInPixels
        )

        this.cameras.main.startFollow(
            this.player,
            true,
            0.1,
            0.1
        )

        const aboveLayer = map.createLayer(
            'AbovePlayer',
            tilesets,
            0,
            0
        )
        aboveLayer?.setDepth(20)
        
        // Collision
        const collisionLayer = map.createLayer(
            'Collision',
            tilesets,
            0,
            0
        )

        collisionLayer?.setCollisionByExclusion([-1])
        if (collisionLayer) {

            this.physics.add.collider(
                this.player,
                collisionLayer
            )

            collisionLayer.setVisible(false)
        }
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

    private createPlayerTexture() {

        const graphics = this.make.graphics({
            x: 0,
            y: 0
        })

        graphics.fillStyle(0xff3333)

        graphics.fillRect(
            0,
            0,
            24,
            28
        )

        graphics.generateTexture(
            'player',
            24,
            28
        )

        graphics.destroy()
    }
}