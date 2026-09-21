export interface InventoryItem {
    itemId: string
    quantity: number
}

export class InventorySystem {

    private items: Map<string, number> = new Map()

    addItem(
        itemId: string,
        quantity: number = 1
    ): void {

        if (quantity <= 0) {
            return
        }

        const current =
            this.items.get(itemId) ?? 0

        this.items.set(
            itemId,
            current + quantity
        )

        console.log(
            'Inventory updated:',
            this.getItems()
        )
    }

    removeItem(
        itemId: string,
        quantity: number = 1
    ): boolean {

        if (quantity <= 0) {
            return false
        }

        const current =
            this.items.get(itemId) ?? 0

        if (current < quantity) {
            return false
        }

        const remaining =
            current - quantity

        if (remaining === 0) {

            this.items.delete(itemId)

        } else {

            this.items.set(
                itemId,
                remaining
            )
        }

        return true
    }

    hasItem(
        itemId: string,
        quantity: number = 1
    ): boolean {

        return (
            this.items.get(itemId) ?? 0
        ) >= quantity
    }

    getQuantity(
        itemId: string
    ): number {

        return this.items.get(itemId) ?? 0
    }

    getItems(): InventoryItem[] {

        return Array.from(
            this.items.entries()
        ).map(([itemId, quantity]) => ({
            itemId,
            quantity
        }))
    }
}