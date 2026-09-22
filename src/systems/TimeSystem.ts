export class TimeSystem {

    private day = 1

    private hour = 6

    private minute = 0

    // One in-game minute = 1 real second
    private readonly msPerGameMinute = 1000

    private elapsed = 0

    update(delta: number): void {

        this.elapsed += delta

        while (
            this.elapsed >= this.msPerGameMinute
        ) {

            this.elapsed -= this.msPerGameMinute

            this.advanceMinute()
        }
    }

    private advanceMinute(): void {

        this.minute++

        if (this.minute >= 60) {

            this.minute = 0

            this.hour++
        }

        if (this.hour >= 24) {

            this.hour = 0

            this.day++
        }
    }

    sleep(): void {

        this.day++

        this.hour = 6

        this.minute = 0

        this.elapsed = 0
    }

    getDay(): number {

        return this.day
    }

    getHour(): number {

        return this.hour
    }

    getMinute(): number {

        return this.minute
    }

    getFormattedTime(): string {

        const hour =
            this.hour.toString()
                .padStart(2, '0')

        const minute =
            this.minute.toString()
                .padStart(2, '0')

        return `${hour}:${minute}`
    }
}