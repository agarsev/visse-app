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


def hand_description(sh, var, rot, ref):
    shape, finger_params = hand_shape(sh)
    ori = hand_orientation(var, rot, ref)
    if shape is None or ori is None:
        return None
    return '{} {}'.format(shape, ori), finger_params


fixed_hands = {
    'picam++': ('El puño cerrado.',
                ['c', 'c', 'c', 'c', 'c']),
    'pir-O': ('El índice recto, con el pulgar pegado. El resto de dedos estirados',
              ['f', 'f', 'f', 'f', 'f']),
    'TE': ('El índice y el pulgar cruzados, el resto de dedos estirados.',
           ['t', 't', 't', 't', 't']),
    'CI': ('Los dedos índice y corazón cruzados.',
           ['x', 'x', 'x', 'x', 'x']),
    'pi-O': ('La punta del índice tocando la falange del pulgar, el resto de dedos extendidos.',
             ['s', 's', 's', 's', 's']),
}
hand_regex = re.compile(r'([picamPICAM]+)([rg]?)([+-]?)(O?)')


def hand_shape(sh):
    if sh in fixed_hands:
        return fixed_hands[sh]

    r = hand_regex.search(sh)
    if r is None:
        print(f'WARNING: unknown hand shape: {sh}')
        return None, None

    fingers = r.group(1)
    flex_mode = r.group(2)
    contact = r.group(3)
    others = r.group(4) == 'O'

    # Flex mode for each finger for the 3D model
    finger_params = ['E' if others else 'c'
                     for _ in ['P', 'I', 'C', 'A', 'M']]

    # Fingers
    fingers_list = []
    ext_flag = False
    if fingers.find('P') >= 0:
        fingers_list.append('pulgar')
        finger_params[0] = 'E' + contact
    elif fingers.find('p') >= 0:
        fingers_list.append('pulgar')
        finger_params[0] = flex_mode + contact

    if fingers.find('I') >= 0:
        fingers_list.append('índice')
        ext_flag = True
        finger_params[1] = 'E' + contact
    elif fingers.find('i') >= 0:
        fingers_list.append('índice')
        finger_params[1] = flex_mode + contact

    if fingers.find('C') >= 0:
        fingers_list.append('corazón')
        ext_flag = True
        finger_params[2] = 'E' + contact
    elif fingers.find('c') >= 0:
        fingers_list.append('corazón')
        finger_params[2] = flex_mode + contact

    if finger_params[1] in ('E', '') and finger_params[2] == 'c':
        # no middle finger but index, default "together" position
        finger_params[1] += '-'

    if fingers.find('A') >= 0:
        fingers_list.append('anular')
        ext_flag = True
        finger_params[3] = 'E' + contact
    elif fingers.find('a') >= 0:
        fingers_list.append('anular')
        finger_params[3] = flex_mode + contact
    if fingers.find('M') >= 0:
        fingers_list.append('meñique')
        ext_flag = True
        finger_params[4] = 'E' + contact
    elif fingers.find('m') >= 0:
        fingers_list.append('meñique')
        finger_params[4] = flex_mode + contact

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

    return text, finger_params


all_angles = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']


def rotate(angle, amount):
    return all_angles[(all_angles.index(angle) + amount) % len(all_angles)]


hor_angles = {
    'N': 'delante',
    'NE': 'delante y a la derecha',
    'E': 'la derecha',
    'SE': 'detrás y a la derecha',
    'S': 'ti',  # detrás
    'SW': 'detrás y a la izquierda',
    'W': 'la izquierda',
    'NW': 'delante y a la izquierda',
}
vert_angles = {
    'N': 'arriba',
    'NE': 'arriba y a la derecha',
    'E': 'la derecha',
    'SE': 'abajo y a la derecha',
    'S': 'abajo',
    'SW': 'abajo y a la izquierda',
    'W': 'la izquierda',
    'NW': 'arriba y a la izquierda',
}


def hand_orientation(var, rot, ref):
    if var == 'w':
        palm = hor_angles['S']
        dist = vert_angles[rot]
    elif var == 'hw':
        palm = vert_angles['N']
        dist = hor_angles[rot]
    elif var == 'b':
        palm = hor_angles['N']
        dist = vert_angles[rot]
    elif var == 'hb':
        palm = vert_angles['S']
        dist = hor_angles[rot]
    elif var == 'h' and ref == 'n':
        palm = vert_angles[rotate(rot, -2)]
        dist = vert_angles[rot]
    elif var == 'h' and ref == 'y':
        dist = vert_angles[rot]
        palm = vert_angles[rotate(rot, 2)]
    elif var == 'hh' and ref == 'n':
        palm = hor_angles[rotate(rot, -2)]
        dist = hor_angles[rot]
    elif var == 'hh' and ref == 'y':
        dist = hor_angles[rot]
        palm = hor_angles[rotate(rot, 2)]
    else:
        print(f'WARNING: Unknown orientation {var} {rot} {ref}')
        return None
    return f'La mano hacia {dist}, con la palma mirando hacia {palm}.'
