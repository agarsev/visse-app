/* 2021-11-17 Antonio F. G. Sevilla <afgs@ucm.es>
 * Licensed under the Open Software License version 3.0
 *
 * Single Page Web Application for visualizing SignWriting. This is the
 * user-facing result of the VisSE project: https://www.ucm.es/visse
 */

import { render } from 'preact';
import { useReducer, useRef, useEffect } from 'preact/hooks';

const INITIAL_STATE = {
    // Image data
    image: null,
    size: [0, 0],
    // Grapheme data
    graphemes: [],
    currentGrapheme: null,
    hideCircle: false,
    // UI
    helpVisible: false,
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
    case 'show_help':
        return { ...state, helpVisible: true, };
    case 'hide_help':
        return { ...state, helpVisible: false, };
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
        <Explanation graphemes={state.graphemes} currentGrapheme={state.currentGrapheme}
            dispatch={dispatch} />
        <FileBar choose={choose} showhelp={() => dispatch({ action: 'show_help' })} />
        {state.helpVisible && <HelpPage hidehelp={() => dispatch({ action: 'hide_help' })} />}
    </>;
}

function Header () {
    return <header class="py-2 mx-4 border-b-2 border-secondary-400 flex">
        <a href="https://www.ucm.es/visse" class="ml-auto" target="_blank">
            <img src="img/logo_visse_color.svg" class="h-28"
                 alt="Logo del proyecto VisSE"
                 title="Visualizando la SignoEscritura" />
        </a>
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
                <svg width="100%" height="100%" class="text-primary-400"
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
    const bt_ok = bt+" bg-secondary-400 text-white";
    const bt_no = bt+" bg-secondary-200 text-white cursor-default";

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


function FileBar ({ choose, showhelp }) {
    return <div style="grid-area: filebar;"
        class="flex py-2 px-6 justify-between items-center">
        <Button3D />
        <UploadButton choose={choose} />
        <HelpButton showhelp={showhelp} />
    </div>;
}

function Button3D ({ enabled }) {
    return enabled?<button 
        class="w-14 h-14 rounded-full p-2 bg-primary-600 text-white text-2xl font-bold">
        3D</button>
        :<div class="w-14 h-14 rounded-full bg-secondary-200" />;
}

function UploadButton ({ choose }) {
    const input = useRef(null);
    return <>
        <input class="hidden" type="file" ref={input}
            onChange={() => choose(input.current.files[0]) } />
        <button class="rounded-full bg-primary-600 w-20 h-20 p-3 text-white" onClick={() => input.current.click()}>
            <svg width="100%" height="100%" viewBox="0 0 24 24">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" fill="currentColor" />
            </svg>
        </button>
    </>;
}

function HelpButton ({ showhelp }) {
    return <button class="rounded-full w-16 h-16 text-primary-600" onClick={showhelp}>
        <svg width="100%" height="100%" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" fill="currentColor" />
        </svg>
    </button>;
}

function HelpPage ({ hidehelp }) {
    const page = useRef(null);
    useEffect(() => {
        page.current.style.marginLeft = '20vw';
    }, []);
    return <>
        <div class="fixed inset-0 bg-black opacity-25"
            onClick={hidehelp} />
        <div class="fixed top-0 bottom-0 px-2 py-12 bg-white transition-all prose leading-snug prose-primary overflow-y-auto"
            style="margin-left: 100vw; width: 80vw;" ref={page}>
            <p>La <a href="https://www.signwriting.org/spain/lecciones/SignoEscritura/index.html" target="_blank">SignoEscritura</a> es un sistema para transcribir las lenguas de signos en papel. Se usan dibujos y símbolos icónicos para representar las manos y sus movimientos, además de otras partes del cuerpo, y cuestiones como el contacto, la repetición, etc.</p>
            <p>Si quieres leer SignoEscritura pero no la conoces a la perfección, esta herramienta te puede ayudar a entender los distintos símbolos y así mejorar tu vocabulario o tu capacidad de comunicación.</p>
            <h3>Cómo funciona</h3>
            <p>Elige una imagen de SignoEscritura de tu dispositivo pinchando en el botón central. La imagen se mostrará en el centro de la pantalla, y será enviada para procesar por el reconocedor.</p>
            <p>Una vez los distintos elementos sean reconocidos, se mostrarán sus explicaciones. Haz click sobre las flechas para ver todos los símbolos, o pincha sobre ellos en la imagen para leer su explicación.</p>
            <p>En el caso de las manos, puedes pinchar en el botón "3D" para ver una representación 3D de cómo hay que colocar los dedos y girar la muñeca para realizar el signo.</p>
            <p style="margin-bottom: 10vh;">
                <a href="https://www.ucm.es/visse" target="_blank">Saber más</a>
            </p>
        </div>
    </>;
}


render(<App />, document.body);
