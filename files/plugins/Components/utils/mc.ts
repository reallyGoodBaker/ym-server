import { Optional } from "../../../optional"

export function getPlayer(info: string, init: (pl: Player) => void) {
    const pl = mc.getPlayer(info)
    pl && init(pl) 
    return Optional.some(pl)
}