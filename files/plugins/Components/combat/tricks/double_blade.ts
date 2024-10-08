import { playAnim, playSoundAll } from "../basic/index"
import { DefaultMoves, DefaultTrickModule } from "../basic/default"

class DoubleBladeMoves extends DefaultMoves {
    constructor() {
        super()

        this.animations.parry.left = 'animation.double_blade.parry.left'
        this.animations.block.left = 'animation.double_blade.block.left'
        this.setup<DoubleBladeMoves>('resume')
    }

    idle: Move = {
        cast: Infinity,
        onEnter(pl) {
            playAnim(pl, 'animation.double_blade.idle', 'animation.double_blade.idle')
        },
        transitions: {
            i2r: {
                onChangeSprinting: {
                    sprinting: true
                }
            },
            hurt: {
                onHurt: null
            },
            hold: {
                onLock: null
            },
        }
    }

    running: Move = {
        cast: Infinity,
        onEnter(pl) {
            playAnim(pl, 'animation.double_blade.running', 'animation.double_blade.running')
        },
        transitions: {
            r2i: {
                onChangeSprinting: {
                    sprinting: false
                }
            },
            hurt: {
                onHurt: null
            },
        }
    }

    i2r: Move = {
        cast: 5,
        onEnter(pl) {
            playAnim(pl, 'animation.double_blade.i2r')
        },
        transitions: {
            running: {
                onEndOfLife: null
            },
            r2i: {
                onChangeSprinting: {
                    sprinting: false
                }
            }
        }
    }

    r2i: Move = {
        cast: 5,
        onEnter(pl) {
            playAnim(pl, 'animation.double_blade.r2i')
        },
        transitions: {
            idle: {
                onEndOfLife: null
            },
            i2r: {
                onChangeSprinting: {
                    sprinting: true
                }
            }
        }
    }

    hold: Move = {
        cast: Infinity,
        onEnter(pl) {
            playAnim(pl, 'animation.double_blade.hold', 'animation.double_blade.hold')
        },
        transitions: {
            hurt: {
                onHurt: null
            },
            idle: {
                onReleaseLock: null
            },
            startSweap: {
                onAttack: null
            }
        }
    }

    resume: Move = {
        transitions: {
            hold: {
                onEndOfLife: {
                    hasTarget: true
                }
            },
            idle: {
                onEndOfLife: {
                    hasTarget: false
                }
            }
        }
    }

    startSweap: Move = {
        cast: 8,
        backswing: 13,
        onEnter(pl, ctx) {
            ctx.freeze(pl)
            ctx.lookAtTarget(pl)
            playAnim(pl, 'animation.double_blade.single_left')
            ctx.status.isBlocking = true
            ctx.adsorbOrSetVelocity(pl, 0.5, 90, 1)
        },
        onLeave(pl, ctx) { 
            ctx.status.isBlocking = false
            ctx.unfreeze(pl)
        },
        onAct(pl, ctx) {
            ctx.selectFromRange(pl, {
                angle: 40,
                radius: 2.2,
                rotation: -20
            }).forEach(en => {
                ctx.attack(pl, en, {
                    damage: 17,
                    damageType: 'entityAttack',
                    knockback: 0.8,
                    direction: 'left'
                })
            })
        },
        timeline: {
            3: (_, ctx) => ctx.status.isBlocking = false,
            4: (_, ctx) => ctx.adsorbOrSetVelocity(_, 1.4, 90, 1)
        },
        transitions: {
            resume: {
                onEndOfLife: null
            },
            hurt: {
                onHurt: null
            },
            parried: {
                onParried: null
            },
            blocked: {
                onBlocked: null
            },
            startMasterHit: {
                onBlock: null
            },
        }
    }

    startMasterHit: Move = {
        cast: 6,
        backswing: 13,
        onEnter(pl, ctx) {
            playSoundAll('weapon.sword.hit2', pl.pos, 1)
            ctx.freeze(pl)
            ctx.adsorbOrSetVelocity(pl, 1.4, 90, 1)
        },
        onAct(pl, ctx) {
            ctx.selectFromRange(pl, {
                angle: 40,
                radius: 2.2,
                rotation: -20
            }).forEach(en => {
                ctx.attack(pl, en, {
                    damage: 20,
                    damageType: 'entityAttack',
                    knockback: 0.8,
                    permeable: true,
                    direction: 'vertical'
                })
            })
        },
        onLeave(pl, ctx) {
            ctx.unfreeze(pl)
        },
        transitions: {
            resume: {
                onEndOfLife: null
            },
            hurt: {
                onHurt: {
                    allowedState: 'both'
                }
            },
            parried: {
                onParried: {
                    allowedState: 'backswing'
                }
            },
        }
    }
}

class DoubleBlade extends DefaultTrickModule {
    constructor() {
        super(
            'rgb:double_blade',
            'idle',
            [
                'weapon:double_blade',
                'weapon:db_morphidae',
            ],
            new DoubleBladeMoves()
        )
    }
}

export const tricks = new DoubleBlade()