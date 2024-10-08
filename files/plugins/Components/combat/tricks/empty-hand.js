const { playAnim, playSoundAll } = require("../basic/index")
const { DefaultMoves, DefaultTrickModule } = require('../basic/default')

class EmptyHandMoves extends DefaultMoves {
    /**
     * @type {Move}
     */
    blocking = {
        cast: Infinity,
        onEnter(pl) {
            playAnim(pl, 'animation.general.empty_hand')
        },
        transitions: {
            cast: {
                onEndOfLife: null
            }
        }
    }

    constructor() {
        super()

        this.setup('blocking')
    }
}

class EmptyHandTricks extends DefaultTrickModule {
    constructor() {
        super(
            'rgb39.weapon.empty_hand',
            'blocking',
            [ '*' ],
            new EmptyHandMoves()
        )
    }
}

exports.tricks = new EmptyHandTricks()