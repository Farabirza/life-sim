import Phaser from 'phaser'
import { InventorySystem } from '../systems/InventorySystem'
import {
    FarmingSystem,
    CROPS,
    type FarmTile
} from '../systems/FarmingSystem'

export class WorldScene extends Phaser.Scene {

    private player!: Phaser.Physics.Arcade.Sprite

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

    private wasd!: {
        W: Phaser.Input.Keyboard.Key
        A: Phaser.Input.Keyboard.Key
        S: Phaser.Input.Keyboard.Key
        D: Phaser.Input.Keyboard.Key
    }

    // private interactables!: Phaser.Physics.Arcade.StaticGroup
    private interactionKey!: Phaser.Input.Keyboard.Key
    private interactionText!: Phaser.GameObjects.Text
    private interactionTimer?: Phaser.Time.TimerEvent

    private inventory = new InventorySystem()
    private openedChests = new Set<string>()
    private interactables!: Phaser.Physics.Arcade.StaticGroup

    private inventoryKey!: Phaser.Input.Keyboard.Key
    private inventoryText!: Phaser.GameObjects.Text
    private inventoryVisible = false

    // Farming system
    private farming = new FarmingSystem()
    private selectedTool:
        'hoe' |
        'seed' |
        'water' |
        'hand' = 'hoe'
    private toolKeys!: {
        hoe: Phaser.Input.Keyboard.Key
        seed: Phaser.Input.Keyboard.Key
        water: Phaser.Input.Keyboard.Key
        hand: Phaser.Input.Keyboard.Key
    }
    private actionKey!: Phaser.Input.Keyboard.Key
    private nextDayKey!: Phaser.Input.Keyboard.Key
    private farmingGraphics!: Phaser.GameObjects.Graphics
    private day = 1

    private map!: Phaser.Tilemaps.Tilemap
    private collisionLayer?: Phaser.Tilemaps.TilemapLayer

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
        const map = this.make.tilemap({
            key: 'farm'
        })
        this.map = map

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
        this.createInteractables(map)
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
        this.collisionLayer =
            map.createLayer(
                'Collision',
                tilesets,
                0,
                0
            ) ?? undefined

        if (this.collisionLayer) {
            this.collisionLayer
                .setCollisionByExclusion([-1])
            this.physics.add.collider(
                this.player,
                this.collisionLayer
            )
            this.collisionLayer
                .setVisible(false)
        }

        // inventory
        this.inventoryKey = this.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.I
            )
        this.createInventoryUI()

        // using tools
        this.toolKeys = {
            hoe: this.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.ONE
            ),
            seed: this.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.TWO
            ),
            water: this.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.THREE
            ),
            hand: this.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.FOUR
            )
        }

        this.actionKey =
            this.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.SPACE
            )
        this.nextDayKey =
            this.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.N
            )

        this.farmingGraphics = this.add.graphics()
        this.farmingGraphics.setDepth(2)
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

        // toggle sign
        if (Phaser.Input.Keyboard.JustDown(this.interactionKey)) {
            this.interact()
        }
        // toggle inventory
        if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
            this.toggleInventory()
        }
        // Select hoe
        if (
            Phaser.Input.Keyboard.JustDown(
                this.toolKeys.hoe
            )
        ) {
            this.selectedTool = 'hoe'
            this.showMessage(
                'Equipped: Hoe'
            )
        }
        // Select seeds
        if (
            Phaser.Input.Keyboard.JustDown(
                this.toolKeys.seed
            )
        ) {
            this.selectedTool = 'seed'
            this.showMessage(
                'Equipped: Parsnip Seeds'
            )
        }
        // Select watering can
        if (
            Phaser.Input.Keyboard.JustDown(
                this.toolKeys.water
            )
        ) {
            this.selectedTool = 'water'
            this.showMessage(
                'Equipped: Watering Can'
            )
        }
        // Select hand
        if (
            Phaser.Input.Keyboard.JustDown(
                this.toolKeys.hand
            )
        ) {

            this.selectedTool = 'hand'

            this.showMessage(
                'Equipped: Hand'
            )
        }
        // Use selected tool
        if (
            Phaser.Input.Keyboard.JustDown(
                this.actionKey
            )
        ) {

            this.useTool()
        }
        // Advance day
        if (
            Phaser.Input.Keyboard.JustDown(
                this.nextDayKey
            )
        ) {
            this.advanceDay()
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

    private createInteractables(map: Phaser.Tilemaps.Tilemap) {
        this.interactables = this.physics.add.staticGroup()
        const layer = map.getObjectLayer('Interactables')

        if (!layer) {

            console.warn(
                'Interactables layer not found'
            )

            return
        }

        for (const object of layer.objects) {

            const type =
                object.type

            const name =
                object.name

            if (
                type !== 'sign' &&
                type !== 'chest'
            ) {
                continue
            }

            const width =
                object.width ?? 32

            const height =
                object.height ?? 32

            const x =
                (object.x ?? 0) + width / 2

            const y =
                (object.y ?? 0) + height / 2

            const sprite =
                this.interactables.create(
                    x,
                    y,
                    type
                ) as Phaser.Physics.Arcade.Sprite

            sprite.setData(
                'id',
                name
            )

            sprite.setData(
                'type',
                type
            )

            // Read custom Tiled properties
            for (
                const property of
                object.properties ?? []
            ) {

                sprite.setData(
                    property.name,
                    property.value
                )
            }

            console.log(
                'Created interactable:',
                name,
                type
            )
        }

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
        const point = this.getInteractionPoint()
        const interactionRadius = 22
        const objects = this.interactables.getChildren()
        let nearest: Phaser.GameObjects.GameObject | null = null
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
        const type = object.getData('type')
        const message = object.getData('message')

        switch (type) {
            case 'sign':
                this.showMessage(message ?? 'An old wooden sign.')
                break
            case 'chest':
                this.openChest(object)
                break
        }
    }

    private openChest(chest: Phaser.Physics.Arcade.Sprite) {
        const chestId = chest.getData('id')
        const itemId = chest.getData('item_id')
        const quantity = Number(chest.getData('quantity') ?? 1)
        const message = chest.getData('message')

        // Already opened?
        if (this.openedChests.has(chestId)) {
            this.showMessage(
                'This chest is empty.'
            )
            return
        }

        // Validate item data
        if (!itemId ||!Number.isInteger(quantity) ||quantity <= 0) {
            this.showMessage(
                'This chest is empty.'
            )
            return
        }

        // Give item
        this.inventory.addItem(
            itemId,
            quantity
        )

        // Mark chest as opened
        this.openedChests.add(
            chestId
        )

        // Show result
        this.showMessage(
            message ??
            `You received ${quantity} ${itemId}!`
        )

        console.log(
            'Current inventory:',
            this.inventory.getItems()
        )
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

    private createInventoryUI() {
        const { width, height } = this.scale

        this.inventoryText =
            this.add.text(
                width / 2,
                height / 2,
                '',
                {
                    fontFamily: 'Arial',
                    fontSize: '20px',
                    color: '#ffffff',
                    backgroundColor: '#222222',
                    padding: {
                        x: 30,
                        y: 25
                    },
                    align: 'left'
                }
            )

        this.inventoryText.setOrigin(0.5)
        this.inventoryText.setScrollFactor(0)
        this.inventoryText.setDepth(2000)
        this.inventoryText.setVisible(false)
    }

    private toggleInventory() {
        this.inventoryVisible = !this.inventoryVisible

        if (!this.inventoryVisible) {
            this.inventoryText
                .setVisible(false)
            return
        }

        const items = this.inventory.getItems()
        let content = 'INVENTORY\n\n'

        if (items.length === 0) {
            content += 'Empty'
        } else {
            for (const item of items) {
                content +=
                    `${item.itemId} x${item.quantity}\n`
            }
        }

        content += '\nPress I to close'

        this.inventoryText.setText(content)
        this.inventoryText.setVisible(true)
    }

    private getFacingTile() {
        const tileSize = 32

        // Approximate player's feet position
        const feetX = this.player.x
        const feetY = this.player.y + 10
        let tileX = Math.floor(feetX / tileSize)
        let tileY = Math.floor(feetY / tileSize)

        switch (this.facing) {
            case 'up':
                tileY--
                break
            case 'down':
                tileY++
                break
            case 'left':
                tileX--
                break
            case 'right':
                tileX++
                break
        }

        return {
            x: tileX,
            y: tileY
        }
    }

    private useTool() {
        const target = this.getFacingTile()
        const x = target.x
        const y = target.y

        switch (this.selectedTool) {
            case 'hoe':
                if (!this.canFarm(x, y)) {
                    this.showMessage(
                        'You cannot farm here.'
                    )
                    break
                }
                if (
                    this.farming.till(x, y)
                ) {
                    this.showMessage(
                        'You tilled the soil!'
                    )
                } else {
                    this.showMessage(
                        'This soil is already tilled.'
                    )
                }
                break
            case 'seed':
                this.plantSeed(x, y)
                break
            case 'water':
                if (
                    this.farming.water(x, y)
                ) {
                    this.showMessage(
                        'You watered the soil!'
                    )
                } else {
                    this.showMessage(
                        'There is no farmland here.'
                    )
                }
                break
            case 'hand':
                this.harvestCrop(x, y)
                break
        }

        this.renderFarm()
    }

    private plantSeed(x: number, y: number) {
        const cropId = 'parsnip'
        const crop = CROPS[cropId]

        if (!this.inventory.hasItem(crop.seedItemId)) {
            this.showMessage(
                'You have no Parsnip Seeds!'
            )
            return
        }

        const planted =
            this.farming.plant(
                x,
                y,
                cropId
            )

        if (!planted) {
            this.showMessage(
                'Cannot plant here.'
            )
            return
        }

        this.inventory.removeItem(crop.seedItemId, 1)

        this.showMessage(
            'You planted a Parsnip Seed!'
        )
    }

    private harvestCrop(x: number, y: number) {
        const itemId = this.farming.harvest(x, y)

        if (!itemId) {
            this.showMessage(
                'Nothing to harvest here.'
            )
            return
        }

        this.inventory.addItem(itemId, 1)
        this.showMessage(`You harvested ${itemId}!`)
    }

    private renderFarm() {
        const tileSize = 32
        this.farmingGraphics.clear()
        const tiles = this.farming.getAllTiles()

        for (const tile of tiles) {
            const pixelX = tile.x * tileSize
            const pixelY = tile.y * tileSize

            // Tilled soil
            this.farmingGraphics.fillStyle(
                tile.watered
                    ? 0x654321
                    : 0x9b7653
            )

            this.farmingGraphics.fillRect(
                pixelX,
                pixelY,
                tileSize,
                tileSize
            )

            // No crop
            if (!tile.cropId) {
                continue
            }

            const crop = CROPS[tile.cropId]

            if (!crop) {
                continue
            }

            const progress = tile.growth / crop.growthDays
            let cropColor = 0x8bc34a
            let cropSize = 8

            if (progress >= 1) {
                cropColor = 0xffd54f
                cropSize = 24
            } else if (progress >= 0.5) {
                cropColor = 0x4caf50
                cropSize = 16
            }

            const centerX = pixelX + tileSize / 2
            const centerY = pixelY + tileSize / 2

            this.farmingGraphics.fillStyle(
                cropColor
            )

            this.farmingGraphics.fillCircle(
                centerX,
                centerY,
                cropSize / 2
            )
        }
    }

    private advanceDay() {
        this.day++
        this.farming.nextDay()
        this.renderFarm()
        this.showMessage(
            `Day ${this.day}`
        )
        console.log(
            'Farm state:',
            this.farming.getAllTiles()
        )
    }

    private canFarm(x: number, y: number): boolean {
        // Outside map
        if (
            x < 0 ||
            y < 0 ||
            x >= this.map.width ||
            y >= this.map.height
        ) {
            return false
        }

        // Collision tile
        if (
            this.collisionLayer?.hasTileAt(
                x,
                y
            )
        ) {
            return false
        }

        // Must have ground
        const ground =
            this.map.getLayer('Ground')

        if (!ground) {
            return false
        }

        const tile =
            ground.tilemapLayer.getTileAt(
                x,
                y
            )

        if (!tile) {
            return false
        }

        return true
    }
}