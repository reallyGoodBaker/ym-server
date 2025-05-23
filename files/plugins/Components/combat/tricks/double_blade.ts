import { playAnim, playSoundAll } from "../basic/index"
import { DefaultMoves, DefaultTrickModule, setVelocityByOrientation } from "../basic/default"
import { Stamina } from "@combat/basic/components/core/stamina"

class DoubleBladeMoves extends DefaultMoves {
    constructor() {
        super()

        this.animations.parry.left = 'animation.double_blade.parry.left'
        this.animations.block.left = 'animation.double_blade.block.left'
        this.animations.parry.right = 'animation.double_blade.parry.right'
        this.animations.block.right = 'animation.double_blade.block.right'
        this.setup<DoubleBladeMoves>('resume')
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
            startLeft: {
                onAttack: {
                    stamina: 22,
                }
            },
            startRight: {
                onUseItem: {
                    stamina: 22,
                }
            },
            dodge: {
                onDodge: null
            },
            shield: {
                onSneak: null
            },
        }
    }

    startLeft: Move = {
        cast: 13,
        backswing: 8,
        onEnter(pl, ctx) {
            ctx.status.isBlocking = true
            ctx.components.getComponent(Stamina).unwrap().stamina -= 22
            ctx.freeze(pl)
            ctx.lookAtTarget(pl)
            playAnim(pl, ctx.previousStatus === 'shieldKick' ? 'animation.double_blade.skl' : 'animation.double_blade.start_left')
            setVelocityByOrientation(pl as Player, ctx, 0.5, 1)
        },
        onLeave(pl, ctx) {
            ctx.status.isBlocking = false
            ctx.unfreeze(pl)
        },
        onAct(pl, ctx) {
            ctx.trap(pl, { tag: 'after' })
        },
        timeline: {
            4: (_, ctx) => {
                ctx.status.isBlocking = false
                
            },
            6: pl => playSoundAll('weapon.woosh.2', pl.pos),
            5: (pl, ctx) => ctx.trap(pl, { tag: 'feint' }),
            8: (pl, ctx) => {
                ctx.selectFromRange(pl, {
                    angle: 40,
                    radius: 2.2,
                    rotation: -20
                }).forEach(en => {
                    ctx.attack(pl, en, {
                        damage: 18,
                        knockback: 0.8,
                        direction: 'left'
                    })
                })
            }
        },
        transitions: {
            resume: {
                onEndOfLife: null,
                onTrap: {
                    tag: 'feint',
                    preInput: 'onFeint'
                }
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
            alternationLR: {
                onTrap: {
                    tag: 'after',
                    preInput: 'onUseItem',
                    stamina: 22,
                }
            },
            finishingL: {
                onTrap: {
                    tag: 'after',
                    preInput: 'onAttack',
                    stamina: 30,
                }
            },
            shield: {
                onTrap: {
                    tag: 'after',
                    preInput: 'onSneak',
                    stamina: 10,
                },
            },
            shieldFromBackswing: {
                onSneak: {
                    allowedState: 'backswing'
                },
            },
            block: {
                onBlock: null
            },
        }
    }

    startRight: Move = {
        cast: 13,
        backswing: 8,
        onEnter(pl, ctx) {
            ctx.status.isWaitingParry = true
            ctx.components.getComponent(Stamina).unwrap().stamina -= 22
            ctx.freeze(pl)
            ctx.lookAtTarget(pl)
            playAnim(pl, 'animation.double_blade.start_right')
            setVelocityByOrientation(pl as Player, ctx, 0.5, 1)
        },
        onLeave(pl, ctx) {
            ctx.status.isWaitingParry = false
            ctx.unfreeze(pl)
        },
        onAct(pl, ctx) {
            ctx.trap(pl, { tag: 'after' })
        },
        timeline: {
            3: (_, ctx) => ctx.status.isWaitingParry = false,
            4: (pl, ctx) => setVelocityByOrientation(pl as Player, ctx, 1.4, 1),
            6: pl => playSoundAll('weapon.woosh.2', pl.pos),
            5: (pl, ctx) => ctx.trap(pl, { tag: 'feint' }),
            8: (pl, ctx) => ctx.selectFromRange(pl, {
                angle: 40,
                radius: 2.2,
                rotation: -20
            }).forEach(en => {
                ctx.attack(pl, en, {
                    damage: 18,
                    knockback: 0.8,
                    direction: 'right'
                })
            }),
        },
        transitions: {
            resume: {
                onEndOfLife: null,
                onTrap: {
                    tag: 'feint',
                    preInput: 'onFeint'
                }
            },
            hurt: {
                onHurt: null
            },
            parried: {
                onParried: null
            },
            alternationRL: {
                onTrap: {
                    tag: 'after',
                    preInput: 'onAttack',
                    stamina: 22,
                }
            },
            kick: {
                onTrap: {
                    tag: 'after',
                    preInput: 'onUseItem',
                    stamina: 15,
                }
            },
            shield: {
                onTrap: {
                    tag: 'after',
                    preInput: 'onSneak',
                    stamina: 10,
                },
            },
            shieldFromBackswing: {
                onSneak: {
                    allowedState: 'backswing'
                },
            },
            parry: {
                onParry: null
            },
            blocked: {
                onBlocked: null
            },
        }
    }

    alternationLR: Move = {
        cast: 13,
        backswing: 8,
        onEnter(pl, ctx) {
            ctx.components.getComponent(Stamina).unwrap().stamina -= 22
            ctx.freeze(pl)
            ctx.lookAtTarget(pl)
            playAnim(pl, 'animation.double_blade.lr')
            ctx.adsorbOrSetVelocity(pl, 1, 90, 1)
        },
        onLeave(pl, ctx) { 
            ctx.unfreeze(pl)
        },
        onAct(pl, ctx) {
            ctx.trap(pl, { tag: 'after' })
        },
        timeline: {
            4: (_, ctx) => ctx.adsorbOrSetVelocity(_, 1.4, 90, 1),
            6: pl => playSoundAll('weapon.woosh.2', pl.pos),
            5: (pl, ctx) => ctx.trap(pl, { tag: 'feint' }),
            8: (pl, ctx) => 
                ctx.selectFromRange(pl, {
                    angle: 40,
                    radius: 2.2,
                    rotation: -20
                }).forEach(en => {
                    ctx.attack(pl, en, {
                        damage: 23,
                        knockback: 0.8,
                        direction: 'right'
                    })
                }),
        },
        transitions: {
            resume: {
                onEndOfLife: null,
                onTrap: {
                    tag: 'feint',
                    preInput: 'onFeint'
                }
            },
            hurt: {
                onHurt: null
            },
            parried: {
                onParried: null
            },
            alternationRL: {
                onTrap: {
                    tag: 'after',
                    preInput: 'onAttack',
                    stamina: 22,
                }
            },
            kick: {
                onTrap: {
                    tag: 'after',
                    preInput: 'onUseItem',
                    stamina: 15,
                }
            },
            shield: {
                onTrap: {
                    tag: 'after',
                    preInput: 'onSneak',
                    stamina: 10,
                },
            },
            shieldFromBackswing: {
                onSneak: {
                    allowedState: 'backswing'
                },
            },
            blocked: {
                onBlocked: null
            },
        }
    }

    alternationRL: Move = {
        cast: 13,
        backswing: 8,
        onEnter(pl, ctx) {
            ctx.components.getComponent(Stamina).unwrap().stamina -= 22
            ctx.freeze(pl)
            ctx.lookAtTarget(pl)
            playAnim(pl, 'animation.double_blade.rl')
            ctx.adsorbOrSetVelocity(pl, 1, 90, 1)
        },
        onLeave(pl, ctx) { 
            ctx.unfreeze(pl)
        },
        onAct(pl, ctx) {
            ctx.trap(pl, { tag: 'after' })
        },
        timeline: {
            4: (_, ctx) => ctx.adsorbOrSetVelocity(_, 1.4, 90, 1),
            6: pl => playSoundAll('weapon.woosh.2', pl.pos),
            5: (pl, ctx) => ctx.trap(pl, { tag: 'feint' }),
            8: (pl, ctx) =>
                ctx.selectFromRange(pl, {
                    angle: 40,
                    radius: 2.2,
                    rotation: -20
                }).forEach(en => {
                    ctx.attack(pl, en, {
                        damage: 23,
                        knockback: 0.8,
                        direction: 'left'
                    })
                }),
        },
        transitions: {
            resume: {
                onEndOfLife: null,
                onTrap: {
                    tag: 'feint',
                    preInput: 'onFeint'
                }
            },
            hurt: {
                onHurt: null
            },
            blocked: {
                onBlocked: null
            },
            parried: {
                onParried: null
            },
            alternationLR: {
                onTrap: {
                    tag: 'after',
                    preInput: 'onUseItem',
                    stamina: 22,
                },
            },
            finishingL: {
                onTrap: {
                    tag: 'after',
                    preInput: 'onAttack',
                    stamina: 30,
                },
            },
            shield: {
                onTrap: {
                    tag: 'after',
                    preInput: 'onSneak',
                    stamina: 10,
                },
            },
            shieldFromBackswing: {
                onSneak: {
                    allowedState: 'backswing'
                },
            },
        }
    }

    dodge: Move = {
        cast: 1,
        backswing: 10,
        onEnter(pl, ctx) {
            ctx.components.getComponent(Stamina).unwrap().setCooldown(10)
            ctx.freeze(pl)
            playAnim(pl, 'animation.double_blade.dodge')
            ctx.setVelocity(pl, 180, 1)
        },
        onAct(_, ctx) {
            ctx.status.isDodging = true
        },
        onLeave(_, ctx) {
            ctx.unfreeze(_)
            ctx.status.isDodging = false
        },
        timeline: {
            5: (_, ctx) => ctx.status.isDodging = false,
        },
        transitions: {
            resume: {
                onEndOfLife: null
            },
            hurt: {
                onHurt: null
            },
        }
    }

    finishingL: Move = {
        cast: 14,
        backswing: 15,
        onEnter(pl, ctx) {
            ctx.components.getComponent(Stamina).unwrap().stamina -= 10
            ctx.freeze(pl)
            playAnim(pl, 'animation.double_blade.ll')
            ctx.lookAtTarget(pl)
        },
        onLeave(pl, ctx) {
            ctx.unfreeze(pl)
        },
        onAct(pl, ctx) {
            ctx.components.getComponent(Stamina).unwrap().stamina -= 20
            ctx.selectFromRange(pl, {
                angle: 120,
                radius: 2.8,
                rotation: -60
            }).forEach(en => {
                ctx.attack(pl, en, {
                    permeable: true,
                    damage: 34,
                    damageType: 'entityAttack',
                    knockback: 1.5,
                    direction: 'left'
                })
            })
        },
        timeline: {
            1: (pl, ctx) => ctx.adsorbOrSetVelocity(pl, 1, 90),
            3: (pl, ctx) => ctx.adsorbOrSetVelocity(pl, 1.5, 90),
            11: (pl, ctx) => {
                ctx.adsorbOrSetVelocity(pl, 2, 90)
                playSoundAll('weapon.woosh.3', pl.pos)
            },

            10: (pl, ctx) => ctx.trap(pl, { tag: 'feint' }),
            17: (pl, ctx) => ctx.trap(pl, { tag: 'dodge' }),
        },
        transitions: {
            resume: {
                onEndOfLife: null,
                onTrap: {
                    tag: 'feint',
                    preInput: 'onFeint',
                }
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
            dodge: {
                onTrap: {
                    tag: 'dodge',
                    preInput: 'onDodge',
                }
            }
        }
    }

    kick: Move = {
        cast: 8,
        backswing: 12,
        onEnter(pl, ctx) {
            ctx.components.getComponent(Stamina).unwrap().stamina -= 10
            ctx.freeze(pl)
            ctx.lookAtTarget(pl)
            playAnim(pl, 'animation.double_blade.rr')
        },
        onLeave(pl, ctx) {
            ctx.unfreeze(pl)
        },
        onAct(pl, ctx) {
            ctx.selectFromRange(pl, {
                angle: 60,
                radius: 2,
                rotation: -30
            }).forEach(en => {          
                ctx.attack(pl, en, {
                    damage: 1,
                    knockback: 1,
                    direction: 'middle',
                    stiffness: 700,
                    parryable: false,
                    permeable: true,
                })
            })
        },
        timeline: {
            4: (pl, ctx) => ctx.adsorbOrSetVelocity(pl, 2, 90, 0.8),
            12: (pl, ctx) => ctx.trap(pl),
        },
        transitions: {
            resume: {
                onEndOfLife: null
            },
            hurt: {
                onHurt: null
            },
            kickCombo: {
                onTrap: {
                    preInput: 'onAttack'
                }
            },
        }
    }

    kickCombo: Move = {
        cast: 7,
        backswing: 16,
        onEnter(pl, ctx) {
            ctx.components.getComponent(Stamina).unwrap().stamina -= 25
            ctx.freeze(pl)
            playAnim(pl, ctx.previousStatus === 'shieldKick' ? 'animation.double_blade.skh' : 'animation.double_blade.rrl')
            ctx.adsorbOrSetVelocity(pl, 1, 90, 1)
        },
        onLeave(pl, ctx) {
            ctx.unfreeze(pl)
        },
        onAct(pl, ctx) {
            ctx.selectFromRange(pl, {
                angle: 120,
                radius: 2.8,
                rotation: -60
            }).forEach(en => {
                ctx.attack(pl, en, {
                    damage: 22,
                    direction: 'left',
                })
            })
        },
        timeline: {
            5: (pl, ctx) => {
                ctx.adsorbOrSetVelocity(pl, 1.4)
                playSoundAll('weapon.woosh.2', pl.pos)
            },
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
        }
    }

    shield: Move = {
        cast: 15,
        onEnter(pl, ctx) {
            ctx.status.isBlocking = true
            ctx.components.getComponent(Stamina).unwrap().stamina -= 10
            ctx.freeze(pl)

            const prevStatus = ctx.previousStatus
            if (prevStatus === 'shieldCounter') {
                playAnim(pl, 'animation.double_blade.counter_shield')
                ctx.adsorbOrSetVelocity(pl, 1, 90, 1)
            } else if (prevStatus.includes('RL') || prevStatus === 'startLeft') {
                playAnim(pl, 'animation.double_blade.shield_left')
            } else if (prevStatus.includes('LR') || prevStatus === 'startRight') {
                playAnim(pl, 'animation.double_blade.shield_right')
                ctx.adsorbOrSetVelocity(pl, 0.5, 90, 1)
            } else {
                playAnim(pl, 'animation.double_blade.shield')
            }
        },
        onLeave(pl, ctx) {
            ctx.status.isBlocking = false
            ctx.unfreeze(pl)
        },
        timeline: {
            10: (_, ctx) => ctx.status.isBlocking = false,
        },
        transitions: {
            resume: {
                onEndOfLife: null
            },
            hurt: {
                onHurt: null
            },
            shieldSuccess: {
                onBlock: null
            },
        }
    }

    shieldSuccess: Move = {
        cast: 5,
        backswing: 9,
        onEnter(pl, ctx) {
            ctx.status.isBlocking = true,
            ctx.components.getComponent(Stamina).unwrap().stamina += 30
            ctx.freeze(pl)
            playSoundAll('weapon.sword.hit2', pl.pos)
            playAnim(pl, 'animation.double_blade.shield_success')
            ctx.lookAtTarget(pl)
        },
        onLeave(pl, ctx) {
            ctx.status.isBlocking = false
            ctx.unfreeze(pl)
        },
        onAct(_, ctx) {
            ctx.status.isBlocking = false
        },
        timeline: {
            7: (_, ctx) => ctx.trap(_),
        },
        transitions: {
            resume: {
                onEndOfLife: null
            },
            hurt: {
                onHurt: null
            },
            shieldSuccess: {
                onBlock: null,
                onSneak: {
                    allowedState: 'backswing'
                }
            },
            shieldCounter: {
                onTrap: {
                    preInput: 'onUseItem'
                }
            },
            shieldKick: {
                onTrap: {
                    preInput: 'onAttack'
                }
            },
            shieldFromBackswing: {
                onSneak: {
                    allowedState: 'backswing'
                }
            }
        }
    }

    shieldKick: Move = {
        cast: 15,
        onEnter(pl, ctx) {
            ctx.status.repulsible = false
            ctx.components.getComponent(Stamina).unwrap().stamina -= 10
            ctx.freeze(pl)
            playAnim(pl, 'animation.double_blade.shield.kick')
            ctx.lookAtTarget(pl)
        },
        onLeave(pl, ctx) {
            ctx.status.repulsible = true
            ctx.unfreeze(pl)
        },
        timeline: {
            1: (pl, ctx) => ctx.adsorbOrSetVelocity(pl, 2, 90, 1),
            4: (pl, ctx) => ctx.selectFromRange(pl, {
                angle: 120,
                radius: 2.5,
                rotation: -60
            }).forEach(en => {
                ctx.attack(pl, en, {
                    damage: 2,
                    direction: 'middle',
                    parryable: false,
                    permeable: true,
                    powerful: true,
                    stiffness: 700,
                })
            }),
            8: (pl, ctx) => ctx.trap(pl),
        },
        transitions: {
            hurt: {
                onHurt: null
            },
            resume: {
                onEndOfLife: null
            },
            sheildAttack: {
                onTrap: {
                    preInput: 'onAttack',
                    stamina: 15,
                }
            },
            kickCombo: {
                onTrap: {
                    preInput: 'onUseItem',
                    stamina: 25,
                }
            }
        }
    }

    sheildAttack: Move = {
        cast: 11,
        backswing: 8,
        onEnter(pl, ctx) {
            ctx.status.repulsible = false
            ctx.components.getComponent(Stamina).unwrap().stamina -= 15
            ctx.freeze(pl)
            ctx.lookAtTarget(pl)
            playAnim(pl, 'animation.double_blade.skl')
            setVelocityByOrientation(pl as Player, ctx, 1, 1.5)
        },
        onLeave(pl, ctx) {
            ctx.status.repulsible = true
            ctx.unfreeze(pl)
        },
        onAct(pl, ctx) {
            ctx.trap(pl, { tag: 'after' })
        },
        timeline: {
            6: pl => playSoundAll('weapon.woosh.2', pl.pos),
            7: (pl, ctx) => {
                ctx.selectFromRange(pl, {
                    angle: 40,
                    radius: 2.2,
                    rotation: -20
                }).forEach(en => {
                    ctx.attack(pl, en, {
                        damage: 18,
                        knockback: 0.8,
                        direction: 'left'
                    })
                })
            }
        },
        transitions: {
            resume: {
                onEndOfLife: null,
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
            alternationLR: {
                onTrap: {
                    tag: 'after',
                    preInput: 'onUseItem',
                    stamina: 22,
                }
            },
            finishingL: {
                onTrap: {
                    tag: 'after',
                    preInput: 'onAttack',
                    stamina: 30,
                }
            },
            shield: {
                onTrap: {
                    tag: 'after',
                    preInput: 'onSneak',
                    stamina: 10,
                },
            },
            shieldFromBackswing: {
                onSneak: {
                    allowedState: 'backswing'
                },
            },
            block: {
                onBlock: null
            },
        }
    }

    shieldCounter: Move = {
        cast: 8,
        backswing: 12,
        onEnter(pl, ctx) {
            ctx.status.hegemony = true
            ctx.status.repulsible = false
            ctx.components.getComponent(Stamina).unwrap().stamina -= 25
            ctx.freeze(pl)
            playAnim(pl, 'animation.double_blade.shield_counter')
        },
        onLeave(pl, ctx) {
            ctx.unfreeze(pl)
            ctx.status.hegemony = false
            ctx.status.repulsible = true
        },
        onAct(pl, ctx) {
            ctx.selectFromRange(pl, {
                angle: 60,
                radius: 2.8,
                rotation: -30
            }).forEach(en => {
                ctx.attack(pl, en, {
                    damage: 25,
                    direction: 'vertical',
                })
            })
        },
        timeline: {
            3: (pl, ctx) => ctx.adsorbOrSetVelocity(pl, 1, 90, 1),
            5: pl => playSoundAll('weapon.woosh.3', pl.pos),
            14: (pl, ctx) => ctx.trap(pl),
        },
        transitions: {
            resume: {
                onEndOfLife: null,
            },
            hurt: {
                onHurt: null
            },
            parried: {
                onParried: null,
            },
            dodge: {
                onTrap: {
                    preInput: 'onDodge',
                    stamina: 10,
                }
            },
            shield: {
                onTrap: {
                    preInput: 'onSneak',
                    stamina: 10,
                }
            },
        }
    }

    shieldFromBackswing: Move = {
        cast: 15,
        onEnter(pl, ctx) {
            ctx.components.getComponent(Stamina).unwrap().stamina -= 10
            ctx.freeze(pl)
            playAnim(pl, 'animation.double_blade.shield')
        },
        onLeave(pl, ctx) {
            ctx.status.isBlocking = false
            ctx.unfreeze(pl)
        },
        timeline: {
            3: (_, ctx) => ctx.status.isBlocking = true,
            10: (_, ctx) => ctx.status.isBlocking = false,
        },
        transitions: {
            resume: {
                onEndOfLife: null
            },
            hurt: {
                onHurt: null
            },
            shieldSuccess: {
                onBlock: null
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