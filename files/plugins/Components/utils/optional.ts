export class Optional<T = any> {

    static none<T>(): Optional<T> {
        return new Optional(null as T)
    }

    static some<T>(value: T): Optional<T> {
        return new Optional(value)
    }

    constructor(
        private value: T
    ) {}

    unwrap(): T {
        if (!this.isEmpty()) {
            return this.value
        }

        throw new Error(`Optional is empty\n${new Error().stack}`)
    }

    isEmpty(): boolean {
        return this.value === undefined || this.value === null
    }

    orElse(other: T): T {
        return this.value ?? other
    }

    use(fn: (v: T) => void, self?: any) {
        if (!this.isEmpty()) {
            fn.call(self, this.value)
            return true
        }

        return false
    }
}