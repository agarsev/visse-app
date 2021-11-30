# 2021-11-29 Antonio F. G. Sevilla <afgs@ucm.es>
# Licensed under the Open Software License version 3.0
#
# Textual descriptions for SignWriting graphemes.

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
        return 'hand'
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
