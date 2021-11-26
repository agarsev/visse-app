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
    hideCircle: false,
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
            hideCircle: false,
        };
    case 'set_current_grapheme':
        return { ...state, 
            currentGrapheme: action.currentGrapheme,
            hideCircle: false,
        };
    case 'hide_circle':
        return { ...state, hideCircle: true, };
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
        <Header />
        <SignWindow dispatch={dispatch} {...state} />
        <ToolBar />
        <Explanation graphemes={state.graphemes} currentGrapheme={state.currentGrapheme}
            dispatch={dispatch} />
        <FileBar choose={choose} />
    </>;
}

function Header () {
    return <header class="py-2 mx-4 border-b-2 border-gray-400 flex">
        <img src="img/logo_visse_color.svg" 
             class="h-28 ml-auto"
             alt="Logo del proyecto VisSE"
             title="Visualizando la SignoEscritura" />
    </header>;
}

function SignWindow ({ image, size, graphemes, currentGrapheme, hideCircle, dispatch }) {
    const { left, top, width, height } = currentGrapheme != null ?
        graphemes[currentGrapheme] : {};
    return <div style="grid-area: signwindow;" class="flex"
        onClick={() => dispatch({ action: 'hide_circle' })}>
        <div class="inline-block m-auto relative">
            <img src={image} />
            <div class="absolute w-full h-full top-0 left-0">
                <svg width="100%" height="100%" class="text-green-400"
                    viewBox={`0 0 ${size[0]} ${size[1]}`}>
                {currentGrapheme != null && !hideCircle ? <circle
                    cx={left + width/2} cy={top + height/2}
                    r={0.05*size[0] + Math.max(width, height) / 2}
                    fill="none" stroke="currentColor" stroke-width="2"
                /> : null}
                {graphemes?.map((g, i) => <rect x={g.left} y={g.top}
                        onClick={e => {
                            dispatch({ action: 'set_current_grapheme', currentGrapheme: i })
                            e.stopPropagation();
                        }}
                        pointer-events="all" class="cursor-pointer"
                        width={g.width} height={g.height}
                        fill="none" stroke="none" />)}
                </svg>
            </div>
        </div>
    </div>;
}

function ToolBar () {
    return <nav style="grid-area: toolbar;">
    </nav>;
}

function Explanation ({ graphemes, currentGrapheme, dispatch }) {

    const scroller = useRef(null);
    const can_left = currentGrapheme > 0;
    const can_right = currentGrapheme < graphemes.length - 1;

    const bt = "w-6 h-20 rounded-full p-1 m-1";
    const bt_ok = bt+" bg-gray-400 text-white";
    const bt_no = bt+" bg-gray-200 text-white cursor-default";

    function updateCurrentGrapheme (e) {
        dispatch({ action: 'set_current_grapheme',
            currentGrapheme: Math.floor(scroller.current.scrollLeft / scroller.current.clientWidth)
        });
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

    return <div style="grid-area: explanation;" class="flex">
        <button onClick={scrollleft} class={can_left?bt_ok:bt_no} >
            <svg width="100%" height="100%" viewBox="4 0 16 24">
                <path d="M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z"
                    fill="currentColor" />
            </svg>
        </button>
        <div ref={scroller} onScroll={onscroll}
            class="whitespace-nowrap overflow-hidden flex-1"
            style="scroll-snap-type: x mandatory;">
            {graphemes.map(g => <GraphemeDescription grapheme={g} />)}
        </div>
        <button onClick={scrollright} class={can_right?bt_ok:bt_no} >
            <svg width="100%" height="100%" viewBox="4 0 16 24">
                <path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"
                    fill="currentColor" />
            </svg>
        </button>
    </div>;
}

function GraphemeDescription ({ grapheme }) {
    const { description } = grapheme;
    return <div class="w-full inline-block p-4"
        style="scroll-snap-align: center;">
        {description}
    </div>
}


function FileBar ({ choose }) {
    return <div style="grid-area: filebar;"
        class="flex p-2 justify-center items-center">
        <UploadButton choose={choose} />
    </div>;
}

function UploadButton ({ choose }) {
    const input = useRef(null);
    return <>
        <input class="hidden" type="file" ref={input}
            onChange={() => choose(input.current.files[0]) } />
        <button class="rounded-full bg-green-600 w-20 h-20 p-3 text-white" onClick={() => input.current.click()}>
            <svg width="100%" height="100%" viewBox="0 0 24 24">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" fill="currentColor" />
            </svg>
        </button>
    </>;
}


render(<App />, document.body);
