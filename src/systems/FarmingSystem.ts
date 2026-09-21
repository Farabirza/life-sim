export interface FarmTile {
    x: number
    y: number
    tilled: boolean
    watered: boolean
    cropId: string | null
    growth: number
}

export interface CropDefinition {
    id: string
    name: string
    seedItemId: string
    harvestItemId: string
    growthDays: number
}

export const CROPS: Record <string, CropDefinition> = {
    parsnip: {
        id: 'parsnip',
        name: 'Parsnip',
        seedItemId: 'parsnip_seed',
        harvestItemId: 'parsnip',
        growthDays: 4
    }
}

export class FarmingSystem {
    private tiles = new Map<string, FarmTile>()

    private getKey(
        x: number,
        y: number
    ): string {
        return `${x},${y}`
    }

    getTile(
        x: number,
        y: number
    ): FarmTile | undefined {
        return this.tiles.get(
            this.getKey(x, y)
        )
    }

    till(
        x: number,
        y: number
    ): boolean {
        const key =
            this.getKey(x, y)
        if (this.tiles.has(key)) {
            return false
        }
        this.tiles.set(key, {
            x,
            y,
            tilled: true,
            watered: false,
            cropId: null,
            growth: 0
        })
        return true
    }

    plant(
        x: number,
        y: number,
        cropId: string
    ): boolean {
        const tile =
            this.getTile(x, y)
        const crop =
            CROPS[cropId]
        if (!tile || !crop) {
            return false
        }
        if (!tile.tilled) {
            return false
        }
        if (tile.cropId !== null) {
            return false
        }
        tile.cropId = cropId
        tile.growth = 0
        return true
    }

    water(
        x: number,
        y: number
    ): boolean {
        const tile =
            this.getTile(x, y)
        if (!tile) {
            return false
        }
        tile.watered = true
        return true
    }

    nextDay(): void {
        for (
            const tile of
            this.tiles.values()
        ) {
            if (
                tile.cropId &&
                tile.watered
            ) {
                const crop =
                    CROPS[tile.cropId]
                if (
                    crop &&
                    tile.growth < crop.growthDays
                ) {
                    tile.growth++
                }
            }
            // Soil dries overnight
            tile.watered = false
        }
    }

    isHarvestable(
        x: number,
        y: number
    ): boolean {
        const tile =
            this.getTile(x, y)
        if (!tile?.cropId) {
            return false
        }
        const crop =
            CROPS[tile.cropId]
        if (!crop) {
            return false
        }
        return (
            tile.growth >=
            crop.growthDays
        )
    }

    harvest(
        x: number,
        y: number
    ): string | null {
        if (
            !this.isHarvestable(x, y)
        ) {
            return null
        }
        const tile = this.getTile(x, y)!
        const crop = CROPS[tile.cropId!]
        const itemId = crop.harvestItemId
        
        // Reset crop, preserve soil
        tile.cropId = null
        tile.growth = 0
        tile.watered = false
        return itemId
    }

    getAllTiles(): FarmTile[] {
        return Array.from(
            this.tiles.values()
        )
    }
}