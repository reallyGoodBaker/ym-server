import { BaseComponent } from "../core/component"
import { PublicComponent, Fields } from "../core/config"

@PublicComponent('damage-modifier')
@Fields([ 'modifier' ])
export class DamageModifier extends BaseComponent {
    static defaultModifier = 0.2
    static defaultModifierOpt = new DamageModifier(DamageModifier.defaultModifier)
    static create({ modifier }: { modifier: number }) {
        return new DamageModifier(modifier)
    }

    #modifier = DamageModifier.defaultModifier

    get modifier() {
        return this.#modifier
    }

    constructor(
        modifier = DamageModifier.defaultModifier
    ) {
        super()
        this.#modifier = modifier
    }
}