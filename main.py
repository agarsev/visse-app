# 2021-11-10 Antonio F. G. Sevilla <afgs@ucm.es>
# Licensed under the Open Software License version 3.0

# Backend server for the VisSE project: https://www.ucm.es/visse
# Receives an image, and returns the recognised SignWriting data contained in
# it, with textual descriptions of the different graphemes.

from io import BytesIO
from fastapi import FastAPI, File
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from pydantic import BaseModel
from quevedo import Dataset, Logogram

CORPUS_PATH = Path(__file__).parent.parent / 'corpus'
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


class ApiGrapheme(BaseModel):
    left: int
    top: int
    width: int
    height: int
    description: str


class Response(BaseModel):
    width: int
    height: int
    graphemes: list[ApiGrapheme]


@app.post("/recognize", response_model=Response)
def recognize(image: bytes = File(...)):
    '''Recognize the SignWriting found in an image, and return the different
    graphemes (symbols) and their descriptions.'''
    logo = Logogram(image=BytesIO(image))
    pipeline.run(logo)
    return logogram_to_response(logo)


def logogram_to_response(logo: Logogram):
    width, height = logo.image.size
    response = Response(
        width=width,
        height=height,
        graphemes=[]
    )
    for grapheme in logo.graphemes:
        description = get_description(grapheme.tags)
        if description is None:
            continue
        cx, cy, w, h = grapheme.box
        response.graphemes.append(
            ApiGrapheme(
                left=(cx-w/2)*width,
                top=(cy-h/2)*height,
                width=w*width,
                height=h*height,
                description=description
            )
        )
    return response


def get_description(tags):
    cl = tags.get('CLASS')
    if cl is None:
        return None
    elif cl == 'HEAD':
        return 'head'
    elif cl == 'DIAC':
        return 'diacritic'
    elif cl == 'HAND':
        return 'hand'
    elif cl == 'STEM':
        return 'stem'
    elif cl == 'ARRO':
        return 'arrow'
    elif cl == 'ARC':
        return 'arc'
