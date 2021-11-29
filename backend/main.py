# 2021-11-10 Antonio F. G. Sevilla <afgs@ucm.es>
# Licensed under the Open Software License version 3.0

# Backend server for the VisSE project: https://www.ucm.es/visse
# Receives an image, and returns the recognised SignWriting data contained in
# it, with textual descriptions of the different symbols contained.

from io import BytesIO
from fastapi import FastAPI, File
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from pydantic import BaseModel
from quevedo import Dataset, Logogram

CORPUS_PATH = Path(__file__).parent.parent.parent / 'corpus'
PIPELINE = 'p_full'

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ds = Dataset(CORPUS_PATH)
pipeline = ds.get_pipeline(PIPELINE)


class Explanation(BaseModel):
    '''A single element of a SignWriting image to be explained.

    It contains the coordinates of the approximate bounding box, as well as
    the text of the explanation.'''
    left: int
    top: int
    width: int
    height: int
    text: str


class Response(BaseModel):
    width: int
    height: int
    explanations: list[Explanation]


@app.post("/recognize", response_model=Response)
def recognize(image: bytes = File(...)):
    '''Recognize the SignWriting found in an image, and return explanations for
    the different symbols found.'''
    logo = Logogram(image=BytesIO(image))
    pipeline.run(logo)
    return logogram_to_response(logo)


def logogram_to_response(logo: Logogram):
    width, height = logo.image.size
    response = Response(
        width=width,
        height=height,
        explanations=[]
    )
    for grapheme in logo.graphemes:
        description = get_description(grapheme.tags)
        if description is None:
            continue
        cx, cy, w, h = grapheme.box
        response.explanations.append(
            Explanation(
                left=(cx-w/2)*width,
                top=(cy-h/2)*height,
                width=w*width,
                height=h*height,
                text=description
            )
        )
    return response


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
