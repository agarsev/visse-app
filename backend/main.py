# 2021-11-10 Antonio F. G. Sevilla <afgs@ucm.es>
# Licensed under the Open Software License version 3.0

# Backend server for the VisSE project: https://www.ucm.es/visse
# Receives an image, and returns the recognised SignWriting data contained in
# it, with textual descriptions of the different symbols contained.

import base64
import logging
import os
import time
from functools import cmp_to_key
from io import BytesIO
from pathlib import Path

from fastapi import FastAPI, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from quevedo import Dataset, Logogram

from .descriptions import all_angles, get_description

CORPUS_PATH = os.environ.get(
    "CORPUS_PATH", Path(__file__).resolve().parent.parent.parent / "corpus"
)
PIPELINE_NAME = "p_full"


class HandExplanation(BaseModel):
    """Hand data for the 3D model."""

    ori: str
    rot: int
    ref: bool
    fingers: list[str]


class Explanation(BaseModel):
    """A single element of a SignWriting image to be explained.

    It contains the coordinates of the approximate bounding box, as well as
    the text of the explanation."""

    left: int
    top: int
    width: int
    height: int
    text: str
    hand: HandExplanation = None


class Response(BaseModel):
    image: bytes = None
    width: int
    height: int
    explanations: list[Explanation]


class NumberExamples(BaseModel):
    number: int


def logogram_to_response(logo: Logogram):
    width, height = logo.image.size
    response = Response(width=width, height=height, explanations=[])
    for grapheme in sort2D(logo.graphemes):
        description = get_description(grapheme.tags)
        hand = None
        if description is None:
            continue
        if grapheme.tags.get("CLASS") == "HAND":
            description, finger_params = description
            hand = HandExplanation(
                ori=grapheme.tags["VAR"],
                rot=all_angles.index(grapheme.tags["ROT"]),
                ref=grapheme.tags["REF"] == "y",
                fingers=finger_params,
            )
        cx, cy, w, h = grapheme.box
        expl = Explanation(
            left=(cx - w / 2) * width,
            top=(cy - h / 2) * height,
            width=w * width,
            height=h * height,
            text=description,
            hand=hand,
        )
        response.explanations.append(expl)
    return response


def logogram_raw_to_response(logo: Logogram):
    graphemes = []
    for grapheme in sort2D(logo.graphemes):
        elem = {'tags': grapheme.tags, 'description': get_description(grapheme.tags), 'box': grapheme.box}
        graphemes.append(elem)
    return graphemes


def prepare_example(subset, index):
    logo = ds.get_single(Logogram.target, subset, index)
    res = logogram_to_response(logo)
    buff = BytesIO()
    logo.image.save(buff, format="PNG")
    res.image = base64.b64encode(buff.getvalue()).decode("ascii")
    return res


def box_compare(a, b):
    """Compare two bounding boxes to order them in 2D."""
    xdist = (a.box[0] + a.box[2] / 2) - (b.box[0] + b.box[2] / 2)
    ydist = (a.box[1] + a.box[3] / 2) - (b.box[1] + b.box[3] / 2)
    if abs(xdist) < 0.1:
        return ydist
    return 10 * xdist


def sort2D(graphemes):
    """Sort a list of graphemes by rough x-coordinate, and then by
    y-coordinate."""
    return sorted(graphemes, key=cmp_to_key(box_compare))


ds = Dataset(CORPUS_PATH)
pipeline = ds.get_pipeline(PIPELINE_NAME)
examples = [
    prepare_example(subset, i)
    for (subset, i) in (
        ("A1_T1", "9"),
        ("A1_T1", "16"),
        ("A1_T1", "60"),
        ("A1_T1", "8"),
        ("A1_T1", "80"),
        ("A1_T1", "176"),
    )
]

app = FastAPI(
    root_path=os.environ.get("WEB_ROOT_PATH", "") + "/backend",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
ch = logging.StreamHandler()
ch.setLevel(logging.INFO)
formatter = logging.Formatter("[%(levelname)s] %(name)s: %(message)s")
ch.setFormatter(formatter)
logger.addHandler(ch)


@app.post("/recognize", response_model=Response)
def recognize(image: bytes = File(...)):
    """Recognize the SignWriting found in an image, and return explanations for
    the different symbols found."""
    logger.info("Start /recognize")
    try:
        logo = Logogram(image=BytesIO(image))
    except OSError:
        raise HTTPException(status_code=400, detail="Invalid image")

    start_time = time.time()
    pipeline.run(logo)
    logger.info(
        "Done /recognize in {:.2f} seconds ({:d} graphemes)".format(
            time.time() - start_time, len(logo.graphemes)
        )
    )
    return logogram_to_response(logo)


@app.post("/recognize/raw")
def recognize_raw(image: bytes = File(...)):
    """Recognize the SignWriting found in an image, and return the JSON for
    the different symbols found."""
    logger.info("Start /recognize/raw")
    try:
        logo = Logogram(image=BytesIO(image))
    except OSError:
        raise HTTPException(status_code=400, detail="Invalid image")

    start_time = time.time()
    pipeline.run(logo)
    logger.info(
        "Done /recognize in {:.2f} seconds ({:d} graphemes)".format(
            time.time() - start_time, len(logo.graphemes)
        )
    )
    return JSONResponse(content=logogram_raw_to_response(logo))


@app.get("/examples/number", response_model=NumberExamples)
def examples_length():
    """Return the number of examples available."""
    return NumberExamples(number=len(examples))


@app.get("/examples/{index}", response_model=Response)
def example(index: int):
    """Return an example SignWriting image with its explanations."""
    if index < 0 or index >= len(examples):
        raise HTTPException(status_code=404)
    return examples[index]


def run():
    """Run the server with uvicorn."""
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "localhost")
    uvicorn.run(app, host=host, port=port)
