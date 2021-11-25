/* 2021-11-17 Antonio F. G. Sevilla <afgs@ucm.es>
 * Licensed under the Open Software License version 3.0
 *
 * Single Page Web Application for visualizing SignWriting. This is the
 * user-facing result of the VisSE project: https://www.ucm.es/visse
 */

import { render } from 'preact';
import { useReducer, useRef, useEffect } from 'preact/hooks';

const INITIAL_STATE = {
    image: null,
    size: [0, 0],
    graphemes: [],
    currentGrapheme: null,
}

const reducer = (state, action) => {
    switch (action.action) {
    case 'set_image':
        if (state.image) URL.revokeObjectURL(state.image);
        return { ...state, 
            image: URL.createObjectURL(action.image)
        };
    case 'backend_response':
        return { ...state,
            size: [action.width, action.height],
            graphemes: action.graphemes,
            currentGrapheme: 0,
        };
    case 'set_current_grapheme':
        return { ...state, currentGrapheme: action.currentGrapheme };
    default:
        return state;
    }
}

const BACKEND_URL = 'http://localhost:8000/recognize';

export default function App() {

    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

    function choose (file) {
        dispatch({ action: 'set_image', image: file });
        const body = new FormData();
        body.append('image', file);
        fetch(BACKEND_URL, { method: 'POST', body })
        .then(res => res.json())
        .then(res => dispatch({ action: 'backend_response', ...res }))
    }

    return <>
        <SignWindow image={state.image} />
        <ToolBar />
        <Explanation graphemes={state.graphemes} currentGrapheme={state.currentGrapheme}
            dispatch={dispatch} />
        <FileBar choose={choose} />
    </>;
}

function SignWindow ({ image }) {
    return <div id="signwindow">
        <img src={image} />
    </div>
}

function ToolBar () {
    return <nav></nav>;
}

function Explanation ({ graphemes, currentGrapheme, dispatch }) {

    const scroller = useRef(null);

    function updateCurrentGrapheme (e) {
        dispatch({ action: 'set_current_grapheme',
            currentGrapheme: Math.floor(scroller.current.scrollLeft / scroller.current.clientWidth)
        });
    }
    function onscroll (e) {
        clearTimeout(onscroll.timeout);
        onscroll.timeout = setTimeout(updateCurrentGrapheme, 100);
    }
    function scrollleft () {
        dispatch({ action: 'set_current_grapheme',
            currentGrapheme: currentGrapheme > 0 ? currentGrapheme - 1 : 0,
        });
    }
    function scrollright () {
        dispatch({ action: 'set_current_grapheme',
            currentGrapheme: currentGrapheme < graphemes.length - 1 ? currentGrapheme + 1 : graphemes.length - 1,
        });
    }

    useEffect(() => {
        scroller.current.scrollTo({ 
            left: currentGrapheme * scroller.current.clientWidth,
            behavior: 'smooth'
        });
    }, [currentGrapheme]);

    return <div class="flex">
        <button disabled={currentGrapheme === 0} onClick={scrollleft}>
            <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z" />
                <path d="M0-.5h24v24H0z" fill="none" />
            </svg>
        </button>
        <div ref={scroller} onScroll={onscroll}
            class="whitespace-nowrap overflow-x-scroll flex-1"
            style="scroll-snap-type: x mandatory;">
            {graphemes.map(g => <div class="w-full inline-block rounded border p-4"
                style="scroll-snap-align: center;">
                    {g.description}
                </div>)}
        </div>
        <button disabled={currentGrapheme === graphemes.length - 1} onClick={scrollright}>
            <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z" />
                <path d="M0-.25h24v24H0z" fill="none" />
            </svg>
        </button>
    </div>;
}

function FileBar ({ choose }) {
    return <div id="filebar">
        <UploadButton choose={choose} />
    </div>;
}

function UploadButton ({ choose }) {
    const input = useRef(null);
    return <>
        <input class="hidden" type="file" ref={input}
            onChange={() => choose(input.current.files[0]) } />
        <button onClick={() => input.current.click()}>
            Upload
        </button>
    </>;
}


render(<App />, document.getElementById('app'));
