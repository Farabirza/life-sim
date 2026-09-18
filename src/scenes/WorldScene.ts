import Phaser from 'phaser'

export class WorldScene extends Phaser.Scene {

    private player!: Phaser.Physics.Arcade.Sprite

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

        this.load.spritesheet(
            'player',
            '/assets/characters/male1.png',
            {
                frameWidth: 32,
                frameHeight: 32
            }
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

        this.player = this.physics.add.sprite(
            spawnX,
            spawnY,
            'player',
            1
        )
        this.player.setDepth(10)
        
        
        this.player.body.setSize(
            18,
            12
        )

        this.player.body.setOffset(
            7,
            18
        )
        
        this.createPlayerAnimations()

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

    private facing: 'down' | 'left' | 'right' | 'up' = 'down'

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

        let moving = false

        if (left) {

            this.player.setVelocityX(-speed)

            this.player.anims.play(
                'walk-left',
                true
            )

            this.facing = 'left'

            moving = true

        } else if (right) {

            this.player.setVelocityX(speed)

            this.player.anims.play(
                'walk-right',
                true
            )

            this.facing = 'right'

            moving = true
        }

        if (up) {

            this.player.setVelocityY(-speed)

            this.player.anims.play(
                'walk-up',
                true
            )

            this.facing = 'up'

            moving = true

        } else if (down) {

            this.player.setVelocityY(speed)

            this.player.anims.play(
                'walk-down',
                true
            )

            this.facing = 'down'

            moving = true
        }

        if (
            this.player.body!.velocity.x !== 0 ||
            this.player.body!.velocity.y !== 0
        ) {
            this.player.body!.velocity
                .normalize()
                .scale(speed)
        }

        if (!moving) {

            this.player.anims.stop()

            switch (this.facing) {

                case 'down':
                    this.player.setFrame(1)
                    break

                case 'left':
                    this.player.setFrame(4)
                    break

                case 'right':
                    this.player.setFrame(7)
                    break

                case 'up':
                    this.player.setFrame(10)
                    break
            }
        }
    }
    
    private createPlayerAnimations() {
        this.anims.create({
            key: 'walk-down',
            frames: [
                { key: 'player', frame: 0 },
                { key: 'player', frame: 1 },
                { key: 'player', frame: 2 },
                { key: 'player', frame: 1 }
            ],
            frameRate: 8,
            repeat: -1
        })

        this.anims.create({
            key: 'walk-left',
            frames: [
                { key: 'player', frame: 3 },
                { key: 'player', frame: 4 },
                { key: 'player', frame: 5 },
                { key: 'player', frame: 4 }
            ],
            frameRate: 8,
            repeat: -1
        })

        this.anims.create({
            key: 'walk-right',
            frames: [
                { key: 'player', frame: 6 },
                { key: 'player', frame: 7 },
                { key: 'player', frame: 8 },
                { key: 'player', frame: 7 }
            ],
            frameRate: 8,
            repeat: -1
        })

        this.anims.create({
            key: 'walk-up',
            frames: [
                { key: 'player', frame: 9 },
                { key: 'player', frame: 10 },
                { key: 'player', frame: 11 },
                { key: 'player', frame: 10 }
            ],
            frameRate: 8,
            repeat: -1
        })
    }

}