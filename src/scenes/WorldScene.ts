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

    private interactables!: Phaser.Physics.Arcade.StaticGroup
    private interactionKey!: Phaser.Input.Keyboard.Key
    private interactionText!: Phaser.GameObjects.Text
    private interactionTimer?: Phaser.Time.TimerEvent

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

        // Player
        this.player = this.physics.add.sprite(
            spawnX,
            spawnY,
            'player',
            1
        )
        this.player.setDepth(10)
        this.player.body?.setSize(
            18,
            12
        )
        this.player.body?.setOffset(
            7,
            18
        )

        this.player.setCollideWorldBounds(true)
        this.physics.world.setBounds(
            0,
            0,
            map.widthInPixels,
            map.heightInPixels
        )
        
        this.createPlayerAnimations()
        this.createInteractionTextures()
        this.createInteractables()
        this.createInteractionUI()

        // Keyboard
        this.cursors =
            this.input.keyboard!.createCursorKeys()

        this.wasd = this.input.keyboard!.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D
        }) as typeof this.wasd

        this.interactionKey =
            this.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.E
            )

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

        if (Phaser.Input.Keyboard.JustDown(this.interactionKey)) {
            this.interact()
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

    private createInteractionTextures() {

        // Wooden sign
        const sign = this.make.graphics({
            x: 0,
            y: 0
        })

        sign.fillStyle(0x8b5a2b)
        sign.fillRect(4, 4, 24, 14)
        sign.fillStyle(0x5c4033)
        sign.fillRect(14, 18, 4, 14)
        sign.generateTexture(
            'sign',
            32,
            32
        )
        sign.destroy()

        // Treasure chest
        const chest = this.make.graphics({
            x: 0,
            y: 0
        })

        chest.fillStyle(0x8b4513)
        chest.fillRect(2, 10, 28, 20)
        chest.fillStyle(0xd4af37)
        chest.fillRect(2, 10, 28, 4)
        chest.fillRect(14, 14, 4, 10)
        chest.generateTexture(
            'chest',
            32,
            32
        )
        chest.destroy()
    }

    private createInteractables() {
        this.interactables =
            this.physics.add.staticGroup()

        // Wooden sign
        const sign = this.interactables.create(
            480,
            256,
            'sign'
        ) as Phaser.Physics.Arcade.Sprite

        sign.setData(
            'type',
            'sign'
        )

        sign.setData(
            'message',
            'Welcome to your new farm!'
        )


        // Treasure chest
        const chest = this.interactables.create(
            576,
            256,
            'chest'
        ) as Phaser.Physics.Arcade.Sprite

        chest.setData(
            'type',
            'chest'
        )

        chest.setData(
            'message',
            'You found 100 gold!'
        )


        // Prevent walking through objects
        this.physics.add.collider(
            this.player,
            this.interactables
        )
    }

    private getInteractionPoint() {
        const distance = 28
        const x = this.player.x
        const y = this.player.y

        switch (this.facing) {
            case 'up':
                return {
                    x,
                    y: y - distance
                }
            case 'down':
                return {
                    x,
                    y: y + distance
                }
            case 'left':
                return {
                    x: x - distance,
                    y
                }
            case 'right':
                return {
                    x: x + distance,
                    y
                }
        }
    }

    private interact() {

        const point =
            this.getInteractionPoint()

        const interactionRadius = 22

        const objects =
            this.interactables.getChildren()

        let nearest:
            Phaser.GameObjects.GameObject | null = null

        let nearestDistance = Infinity

        for (const object of objects) {

            const sprite =
                object as Phaser.Physics.Arcade.Sprite

            const distance =
                Phaser.Math.Distance.Between(
                    point.x,
                    point.y,
                    sprite.x,
                    sprite.y
                )

            if (
                distance <= interactionRadius &&
                distance < nearestDistance
            ) {

                nearest = sprite

                nearestDistance = distance
            }
        }

        if (!nearest) {
            return
        }

        this.handleInteraction(
            nearest as Phaser.Physics.Arcade.Sprite
        )
    }
    
    private handleInteraction(object: Phaser.Physics.Arcade.Sprite) {
        const type =
            object.getData('type')

        const message =
            object.getData('message')

        switch (type) {
            case 'sign':
                this.showMessage(
                    message
                )
                break
            case 'chest':
                this.showMessage(
                    message
                )
                break
        }
    }

    private createInteractionUI() {
        const { width, height } =
            this.scale

        this.interactionText =
            this.add.text(
                width / 2,
                height - 70,
                '',
                {
                    fontFamily: 'Arial',
                    fontSize: '20px',
                    color: '#ffffff',
                    backgroundColor: '#222222',
                    padding: {
                        x: 20,
                        y: 12
                    },
                    wordWrap: {
                        width: width - 100
                    }
                }
            )

        this.interactionText
            .setOrigin(0.5)

        this.interactionText
            .setScrollFactor(0)

        this.interactionText
            .setDepth(1000)

        this.interactionText
            .setVisible(false)
    }

    private showMessage(message: string) {
        if (this.interactionTimer) {
            this.interactionTimer.remove()
        }
        this.interactionText
            .setText(message)
        this.interactionText
            .setVisible(true)
        this.interactionTimer =
            this.time.delayedCall(
                3000,
                () => {
                    this.interactionText
                        .setVisible(false)
                }
            )
    }

}