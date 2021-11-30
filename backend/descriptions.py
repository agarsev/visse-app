# 2021-11-29 Antonio F. G. Sevilla <afgs@ucm.es>
# Licensed under the Open Software License version 3.0
#
# Textual descriptions for SignWriting graphemes.

import re


heads = {
    'face': 'Este símbolo representa la *cabeza* o la cara del signante.',
    'nose': 'Este símbolo representa la *nariz*.',
    'mouth': 'Este símbolo representa la *boca*.',
    'moutho': 'La boca con los labios curvados, como diciendo "Oh".',
    'smile': 'La boca curvada en una *sonrisa*.',
    'teeth': 'La boca abierta, marcando los *dientes*.',
    'hair': 'El *cabello* del signante.',
    'tongue': 'La boca con la *lengua* sacada.',
    'eyes': 'Este símbolo representa los *ojos*.',
    'eyer': 'El *ojo derecho* del signante.',
    'eyel': 'El *ojo izquierdo* del signante.',
    'chin': 'Este símbolo representa la *barbilla*.',
    'fore': 'Este símbolo representa la *frente*.',
    'forer': 'Este símbolo representa la *sien derecha*.',
    'forel': 'Este símbolo representa la *sien izquierda*.',
    'ears': 'Este símbolo representa las *orejas*.',
    'earr': 'La *oreja derecha* del signante.',
    'earl': 'La *oreja izquierda* del signante.',
    'neck': 'Este símbolo representa el *cuello*.',
    'brow_up': 'Las cejas *alzadas*, interrogación cerrada (sí o no).',
    'brow_down': 'Las cejas *bajadas*, interrogación abierta (cuál, cómo, qué).',
    'cheeks': 'Este símbolo representa las *mejillas*.',
    'cheekr': 'La *mejilla derecha* del signante.',
    'cheekl': 'La *mejilla izquierda* del signante.',
}

diacs = {
    'touch': 'Este símbolo indica que hay *contacto*.',
    'grasp': 'La mano *coge* la otra mano, dedo o parte del cuerpo.',
    'between': 'Las manos o dedos se *entrelazan*.',
    'strike': 'Hay contacto rápido *a la mitad* del movimiento.',
    'brush': 'Hay contacto prolongado *a la mitad* el movimiento.',
    'rub': 'Hay contacto *durante todo* el movimiento.',
    'flex_hook': 'Los dedos se *flexionan* a la altura de las falanges.',
    'ext_hook': 'Los dedos se *extienden* a la altura de las falanges.',
    'flex_base': 'Los dedos se *flexionan* por la base, a la altura de los nudillos.',
    'ext_base': 'Los dedos se *extienden* por la base, a la altura de los nudillos.',
    'sym': 'Las manos se mueven *simultáneamente*.',
    'anti': 'Las manos se mueven *alernativamente*.',
    'altern': 'Primero se mueve una mano, luego la otra.',
    'flex_alt': 'Los dedos se *flexionan en secuencia*, como una castañuela.',
    'ext_alt': 'Los dedos se *extienden en secuencia*, como en el signo "número".',
    'wiggle': 'Los dedos se mueven *alternativamente*.',
    'tense': 'El movimiento es rápido o la mano se mantiene tensa.',
    'wrist': 'Gira la muñeca',
}


def get_description(tags):
    try:
        cl = tags['CLASS']
        sh = tags['SHAPE']
    except KeyError:
        return None
    if cl == 'HEAD':
        return heads.get(sh)
    elif cl == 'DIAC':
        return diacs.get(sh)
    elif cl == 'HAND':
        return hand_description(tags['SHAPE'], tags['VAR'], tags['ROT'], tags['REF'])
    elif cl == 'STEM':
        if sh == 's':
            return 'La varilla simple indica que el movimiento es *horizontal*, paralelo al suelo.'
        elif sh == 'd':
            return 'La varilla doble indica que el movimiento es *vertical*, paralelo a la pared.'
        else:
            return None
    elif cl == 'ARRO':
        if sh.startswith('b'):
            return 'La punta de flecha negra indica que se mueve la mano *derecha*.'
        elif sh.startswith('w'):
            return 'La punta de flecha blanca indica que se mueve la mano *izquierda*.'
        elif sh.startswith('j'):
            return 'Esta punta de flecha indica que se mueven *las dos manos juntas*, como una unidad.'
        else:
            return None
    elif cl == 'ARC':
        if sh.startswith('s'):
            return 'La varilla simple indica que el movimiento es *horizontal*, paralelo al suelo.'
        elif sh.startswith('d'):
            return 'La varilla doble indica que el movimiento es *vertical*, paralelo a la pared.'
        else:
            return None


fixed_hands = {
    'picam++': 'El puño cerrado.',
    'TE': 'La mano como en la "T" del dactilológico.',
}

hand_regex = re.compile(r'([picamPICAM]+)([rg]?)([+-]?)(O?)')


def hand_description(sh, var, rot, ref):
    if sh in fixed_hands:
        return fixed_hands[sh]

    r = hand_regex.search(sh)
    if r is None:
        return None

    fingers = r.group(1)
    flex_mode = r.group(2)
    contact = r.group(3)
    others = r.group(4) == 'O'

    # Fingers
    fingers_list = []
    ext_flag = False
    if fingers.find('P') >= 0:
        fingers_list.append('pulgar')
        ext_flag = True
    elif fingers.find('p') >= 0:
        fingers_list.append('pulgar')
    if fingers.find('I') >= 0:
        fingers_list.append('índice')
        ext_flag = True
    elif fingers.find('i') >= 0:
        fingers_list.append('índice')
    if fingers.find('C') >= 0:
        fingers_list.append('corazón')
        ext_flag = True
    elif fingers.find('c') >= 0:
        fingers_list.append('corazón')
    if fingers.find('A') >= 0:
        fingers_list.append('anular')
        ext_flag = True
    elif fingers.find('a') >= 0:
        fingers_list.append('anular')
    if fingers.find('M') >= 0:
        fingers_list.append('meñique')
        ext_flag = True
    elif fingers.find('m') >= 0:
        fingers_list.append('meñique')

    if len(fingers_list) == 5:
        text = 'Los dedos'
        plural = 's'
    elif len(fingers_list) > 1:
        plural = 's'
        text = 'Los dedos '+', '.join(fingers_list)
        last_comma = text.rfind(',')
        rest = text[last_comma+2:]
        text = text[:last_comma] + (' e ' if rest.startswith('í') else ' y ') + rest
    else:
        plural = ''
        text = f'El dedo {fingers_list[0]}'

    if ext_flag:
        text += ' extendido'+plural
    else:
        if flex_mode != 'r' and flex_mode != 'g':
            text += f' curvo{plural}'
            if contact == '-':
                text += ' y juntos'
        elif flex_mode == 'r':
            text += f' recto{plural}, flexionado{plural} por el nudillo'
        elif flex_mode == 'g':
            text += f' flexionado{plural} por las falanges, como una garra'

    if contact == '-':
        text += ' y juntos'
    elif contact == '+':
        if len(fingers_list) == 2:
            text += f', con el pulgar tocando la yema del {fingers_list[1]}'
        else:
            text += ', con el pulgar tocando las yemas de los demás'

    if others:
        text += '. Los demás dedos extendidos.'
    else:
        text += '.'

    return text
