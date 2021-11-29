# 2021-11-29 Antonio F. G. Sevilla <afgs@ucm.es>
# Licensed under the Open Software License version 3.0
#
# Textual descriptions for SignWriting graphemes.

def get_description(tags):
    cl = tags.get('CLASS')
    sh = tags.get('SHAPE')
    if cl is None or sh is None:
        return None
    elif cl == 'HEAD':
        return 'head'
    elif cl == 'DIAC':
        return 'diacritic'
    elif cl == 'HAND':
        return 'hand'
    elif cl == 'STEM':
        if sh == 's':
            return 'La varilla simple indica que el movimiento es *horizontal*, paralelo al suelo.'
        elif sh == 'd':
            return 'La varilla doble indica que el movimiento es *vertical*, paralelo a la pared.'
        else:
            return None
    elif cl == 'ARRO':
        return 'arrow'
    elif cl == 'ARC':
        return 'arc'
