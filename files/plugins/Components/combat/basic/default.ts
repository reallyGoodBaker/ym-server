import { playAnimCompatibility, playSoundAll } from "./index"
import { CameraFading } from "@components/camera-fading"
import { CameraComponent } from "@components/camera"
import { Stamina } from "@components/core/stamina"
import { CustomComponent } from "@combat/basic/core/component"
import { input } from "scripts-rpc/func/input"

export function getApproximatelyDir(direction: AttackDirection) {
    return direction === 'right' ? 'right'
            : direction === 'middle' ? 'right'
                : 'left'
}

function getAnim(animCategory: any, direction: string) {
    const anim = animCategory[direction]

    if (!anim) {
        switch (direction) {
            case 'middle':
                return animCategory.right ?? animCategory.left

            default:
                return animCategory.left
        }
    }

    return anim
}

type StateKey<T> = ObjKeyType<T, Move>

export class IncomingAttack extends CustomComponent {
    constructor(
        public direction: AttackDirection = 'left',
        public permeable: boolean = false,
        public parryable: boolean = true,
        public powerful: boolean = false,
        public trace: boolean = false,
    ) {
        super()
    }

    approximateAttackDirection() {
        return getApproximatelyDir(this.direction)
    }
}

export function setVelocityByOrientation(pl: Player, ctx: MovementContext, max: number, offset?: number) {
    const ori = input.approximateOrientation(pl)
    if (ori === input.Orientation.Backward) {
        ctx.setVelocity(pl, ori * 90, max, -2)
    } else {
        ctx.adsorbToTarget(pl, max, offset)
    }
}

export class DefaultMoves {
    animations = {
        parried: {
            /**
             * left and vertical
             */
            left: 'animation.general.parried.left',
            vertical: 'animation.general.parried.left',
            /**
             * right and stab
             */
            right: 'animation.general.parried.right',
            middle: 'animation.general.parried.right',
        },
        hit: {
            left: 'animation.general.hit.left',
            right: 'animation.general.hit.right',
            vertical: 'animation.general.hit.vertical',
            middle: 'animation.general.hit.middle',
        },
        parry: {
            /**
             * left and vertical
             */
            left: '',
            vertical: '',
            /**
             * right and stab
             */
            right: '',
            middle: '',
        },
        knockdown: 'animation.general.fell',
        blocked: {
            /**
             * left and vertical
             */
            left: 'animation.general.blocked.left',
            vertical: 'animation.general.blocked.left',
            /**
             * right and stab
             */
            right: 'animation.general.blocked.right',
            middle: 'animation.general.blocked.right',
        },
        block: {
            /**
             * left and vertical
             */
            left: '',
            vertical: '',
            /**
             * right and stab
             */
            right: '',
            middle: '',
        },
        execution: {
            cutHead: 'animation.general.execution.cut_head',
        },
        executionNoGore: {
            cutHead: 'animation.general.execution.cut_head_no_gore',
        }
    }

    sounds = {
        parry: 'weapon.parry',
        blocked: 'weapon.sword.hit3',
        block: 'weapon.sword.hit2',
    }

    blocked: Move = {
        cast: 15,
        onEnter: (pl, ctx) => {
            const { direction } = ctx.rawArgs[2]

            ctx.status.componentManager.getComponent(Stamina).unwrap().stamina -= 10
            playAnimCompatibility(pl, getAnim(this.animations.blocked, direction))
            playSoundAll(this.sounds.blocked, pl.pos, 1)
            ctx.movement(pl, false)
            ctx.freeze(pl)
            ctx.setVelocity(pl, -100, 0.8, -2)
        },
        onLeave(pl, ctx) {
            ctx.movement(pl, true)
            ctx.unfreeze(pl)
        },
        timeline: {
            8: (pl, ctx) => ctx.trap(pl, { tag: 'blockedCounter' })
        },
        transitions: {}
    }

    block: Move = {
        cast: 10,
        onEnter: (pl, ctx) => {
            const { direction } = ctx.rawArgs[2]
            const stamina = ctx.status.componentManager.getComponent(Stamina).unwrap()
            stamina.setCooldown(5)
            stamina.stamina += 15
            ctx.status.isBlocking = true
            playAnimCompatibility(pl, getAnim(this.animations.block, direction))
            playSoundAll(this.sounds.block, pl.pos, 1)
            ctx.movement(pl, false)
            ctx.freeze(pl)
        },
        onLeave(pl, ctx) {
            ctx.movement(pl, true)
            ctx.unfreeze(pl)
            ctx.status.isBlocking = false
        },
        timeline: {
            9: (pl, ctx) => ctx.trap(pl, { tag: 'blockCounter' })
        },
        transitions: {}
    }

    hurt: Move = {
        cast: Infinity,
        onEnter: (pl, ctx) => {
            const manager = ctx.status.componentManager
            manager.getComponent(Stamina).unwrap().setCooldown(5)
            ctx.movement(pl, false)
            ctx.freeze(pl)
            ctx.status.disableInputs([
                'onAttack',
                'onUseItem',
            ])

            const abuser = ctx.rawArgs[1]
            ctx.lookAt(pl, abuser)
            const { stiffness, customHurtAnimation, direction, execution } = ctx.rawArgs[2] as DamageOption
            const hurtAnim = customHurtAnimation ?? this.animations.hit[direction || 'left']

            if (execution) {
                ctx.trap(pl, { tag: 'execution', execution })
                return
            }

            playAnimCompatibility(pl, hurtAnim)
            ctx.task.queue(() => {
                ctx.trap(pl, { tag: 'recover' })
            }, stiffness).run()
        },
        onLeave(pl, ctx) {
            ctx.task.cancel()
            ctx.status.shocked = false
            ctx.status.enableInputs([
                'onAttack',
                'onUseItem',
            ])
            ctx.unfreeze(pl)
        },
        onTick(pl, ctx) {
            if (ctx.status.shocked) {
                // ctx.trap(pl, { tag: 'hitWall' })
            }
        },
        timeline: {
            0: (pl, ctx) => {
                const { direction } = ctx.components.getComponent(IncomingAttack).unwrap()
                switch (direction) {
                    case 'left':
                        ctx.setVelocity(pl, -150, 1.5, -2)
                        break;
                    case 'right':
                        ctx.setVelocity(pl, -30, 1.5, -2)
                        break;
                    case 'middle':
                    case 'vertical':
                        ctx.setVelocity(pl, -90, 1.5, -2)
                        break;
                }
            }
        },
        transitions: {}
    }

    execution: Move = {
        cast: 60,
        onEnter(pl, ctx) {
            ctx.freeze(pl)
            ctx.status.disableInputs([
                'onAttack',
                'onUseItem',
            ])
        },
        transitions: {}
    }

    hitWall: Move = {
        cast: 25,
        onEnter: (pl, ctx) => {
            ctx.movement(pl, false)
            ctx.freeze(pl)
            ctx.status.disableInputs([
                'onAttack',
                'onUseItem',
            ])
            playAnimCompatibility(pl, 'animation.general.hit_wall')
        },
        onLeave(pl, ctx) {
            ctx.unfreeze(pl)
            ctx.status.enableInputs([
                'onAttack',
                'onUseItem',
            ])
        },
        transitions: { }
    }

    parried: Move = {
        onEnter: (pl, ctx) => {
            ctx.status.componentManager.getComponent(Stamina).unwrap().stamina -= 15
            ctx.movement(pl, false)
            ctx.freeze(pl)
            ctx.status.disableInputs([
                'onAttack',
                'onUseItem',
            ])
            const { direction } = ctx.rawArgs[2]
            playAnimCompatibility(pl, getAnim(this.animations.parried, direction))
            ctx.trap(pl, { tag: getApproximatelyDir(direction) })
        },
        transitions: {
            parriedLeft: {
                onTrap: {
                    tag: 'left'
                }
            },
            parriedRight: {
                onTrap: {
                    tag: 'right'
                }
            },
            hurt: {
                onHurt: null
            }
        }
    }

    parriedLeft: Move = {
        cast: 34,
        onLeave(pl, ctx) {
            ctx.unfreeze(pl)
            ctx.status.enableInputs([
                'onAttack',
                'onUseItem'
            ])
        },
        timeline: {
            3: (pl, ctx) => ctx.setVelocity(pl, -40, 1.5, -2),
            11: (pl, ctx) => ctx.lookAtTarget(pl),
        },
        transitions: { }
    }

    parriedRight: Move = {
        cast: 34,
        onLeave(pl, ctx) {
            ctx.unfreeze(pl)
            ctx.status.enableInputs([
                'onAttack',
                'onUseItem'
            ])
        },
        timeline: {
            3: (pl, ctx) => ctx.setVelocity(pl, -140, 1.5, -2),
            11: (pl, ctx) => ctx.lookAtTarget(pl),
        },
        transitions: { }
    }

    parry: Move = {
        cast: 10,
        backswing: 11,
        onEnter: (pl, ctx) => {
            const target = ctx.rawArgs[1]
            const { direction } = ctx.rawArgs[2]

            ctx.status.componentManager.getComponent(Stamina).unwrap().stamina += 10
            ctx.movement(pl, false)
            playSoundAll(this.sounds.parry, pl.pos, 1)
            ctx.status.isWaitingParry = true
            playAnimCompatibility(pl, getAnim(this.animations.parry, direction))
            ctx.lookAt(pl, target)

            ctx.status.componentManager.attachComponent(new CameraFading([
                {
                    from: CameraComponent.defaultOffset,
                    to: [ 0.6, 0, 0.8, 0, 0 ],
                    duration: 2
                },
                {
                    to: CameraComponent.defaultOffset,
                    duration: 3
                }
            ]))
        },
        onLeave(pl, ctx) {
            ctx.unfreeze(pl)
            ctx.status.isWaitingParry = false
            ctx.status.componentManager.detachComponent(CameraFading)
        },
        timeline: {
            13: (pl, ctx) => ctx.trap(pl, { tag: 'parryCounter' })
        },
        transitions: { }
    }

    knockdown: Move = {
        cast: 30,
        onEnter: (pl, ctx) => {
            ctx.freeze(pl)
            ctx.status.disableInputs([
                'onAttack',
                'onUseItem'
            ])
            playAnimCompatibility(pl, this.animations.knockdown)
        },
        onLeave(pl, ctx) {
            ctx.unfreeze(pl)
            playAnimCompatibility(pl, 'animation.general.stand')
            ctx.status.enableInputs([
                'onAttack',
                'onUseItem'
            ])
        },
        transitions: { }
    }

    setup<T extends DefaultMoves>(init: StateKey<T>) {
        this.hitWall.transitions = {
            hurt: {
                onHurt: null
            },
            [init]: {
                onEndOfLife: null
            },
        }

        this.parry.transitions = {
            parry: {
                onParry: null
            },
            [init]: {
                onEndOfLife: null
            },
            hurt: {
                onHurt: null
            },
        }

        this.parriedLeft.transitions = {
            [init]: {
                onEndOfLife: null
            },
            hurt: {
                onHurt: null
            },
        }

        this.parriedRight.transitions = {
            [init]: {
                onEndOfLife: null
            },
            hurt: {
                onHurt: null
            },
        }

        this.hurt.transitions = {
            [init]: {
                onTrap: {
                    tag: 'recover'
                }
            },
            hurt: {
                onHurt: null
            },
            hitWall: {
                onTrap: {
                    tag: 'hitWall',
                    allowedState: 'both',
                    isCollide: true,
                }
            },
        }

        this.blocked.transitions = {
            [init]: {
                onEndOfLife: null
            },
            hurt: {
                onHurt: null
            },
        }

        this.block.transitions = {
            [init]: {
                onEndOfLife: null
            },
            hurt: {
                onHurt: null
            },
            block: {
                onBlock: null
            }
        }

        this.execution.transitions = {
            [init]: {
                onEndOfLife: null
            }
        }
    }

    mixin<T extends DefaultMoves>(state: StateKey<T>, obj: any): void {
        //@ts-ignore
        this[state] = Object.assign(this[state], obj)
    }

    setTransition<T extends DefaultMoves>(state: StateKey<T>, transitionName: StateKey<T>, transition: TransitionTypeOption) {
        //@ts-ignore
        const _state = this[state]
        if (!_state) {
            return
        }

        _state.transitions[transitionName] = transition
    }
}

export class DefaultTrickModule implements TrickModule {
    constructor(
        public sid: string,
        public entry: string,
        public bind: string|string[],
        public moves: DefaultMoves
    ) {}
}