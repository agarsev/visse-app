/* 2021-11-17 Antonio F. G. Sevilla <afgs@ucm.es>
 * Licensed under the Open Software License version 3.0
 *
 * Single Page Web Application for visualizing SignWriting. This is the
 * user-facing result of the VisSE project: https://www.ucm.es/visse
 */

import { render } from 'preact';
import { useReducer, useRef, useEffect } from 'preact/hooks';

const INITIAL_STATE = {
    // Navigation and UI
    screen: 'initial',
    helpVisible: false,
    isLoading: false,
    // Image data
    image: null,
    size: [0, 0],
    // Explanations data
    explanations: [],
    currentExpl: null,
    hideCircle: false,
}

const reducer = (state, action) => {
    switch (action.action) {
    case 'set_image':
        if (state.image) URL.revokeObjectURL(state.image);
        return { ...state, 
            image: URL.createObjectURL(action.image),
            size: [0, 0],
            screen: 'sign',
            isLoading: true,
        };
    case 'backend_response':
        let image = null;
        if (action.image) {
            if (state.image) URL.revokeObjectURL(state.image);
            image = URL.createObjectURL(action.image);
        }
        return { ...state, image,
            screen: 'sign',
            size: [action.width, action.height],
            explanations: action.explanations,
            currentExpl: 0,
            hideCircle: false,
            isLoading: false,
        };
    case 'set_current_expl':
        return { ...state, 
            currentExpl: action.currentExpl,
            hideCircle: false,
        };
    case 'hide_circle':
        return { ...state, hideCircle: true, };
    case 'show_help':
        return { ...state, helpVisible: true, };
    case 'hide_help':
        return { ...state, helpVisible: false, };
    case 'set_loading':
        return { ...state, isLoading: true, };
    default:
        return state;
    }
}

const BACKEND_URL = 'http://localhost:8000/';

function is_wide () { return document.documentElement.clientWidth > 768; }

export default function App() {

    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

    function choose (file) {
        dispatch({ action: 'set_image', image: file });
        const body = new FormData();
        body.append('image', file);
        fetch(BACKEND_URL+'recognize', { method: 'POST', body })
        .then(res => res.json())
        .then(res => dispatch({ action: 'backend_response', ...res }))
    }

    function get_example () {
        dispatch({ action: 'set_loading' });
        fetch(BACKEND_URL+'example/0')
        .then(res => res.json())
        .then(async res => {
            const image = await fetch("data:image/png;base64,"+res.image)
                .then(res => res.blob())
            dispatch({ action: 'backend_response', ...res, image });
        });
    }

    let screen;
    if (state.screen === 'initial') {
        screen = <InitialScreen get_example={get_example} />;
    } else if (state.screen === 'sign') {
        screen = <SignWindow dispatch={dispatch} {...state} />;
    }

    return <>
        <Header />
        {screen}
        <ExplanationList explanations={state.explanations}
            currentExpl={state.currentExpl} dispatch={dispatch} />
        <FileBar choose={choose} showhelp={() => dispatch({ action: 'show_help' })} />
        {state.helpVisible && <HelpPage hidehelp={() => dispatch({ action: 'hide_help' })} />}
    </>;
}

function Header () {
    return <header class="area-header py-2 mx-4 border-b-2 border-secondary-400 flex">
        <a href="https://www.ucm.es/visse" class="ml-auto" target="_blank">
            <img src="img/logo_visse_color.svg" class="h-28"
                 alt="Logo del proyecto VisSE"
                 title="Visualizando la SignoEscritura" />
        </a>
    </header>;
}

function InitialScreen ({ get_example }) {
    return <div class="area-signwindow prose prose-lg p-4 prose-primary text-center flex flex-col justify-center">
        <h3>Elige una imagen de SignoEscritura para ver aquí su explicación</h3>
        <p>Para cargar una imagen, haz click en el botón de abajo.</p>
        <p><a class="cursor-pointer" onclick={get_example}>Ver un ejemplo</a></p>
        <p><a href="https://www.ucm.es/visse" target="_blank">Saber más</a></p>
    </div>;
}

function SignWindow ({ image, size, explanations, currentExpl, hideCircle, isLoading, dispatch }) {
    const { left, top, width, height } = currentExpl != null ?
        explanations[currentExpl] : {};
    let overlay = '';
    if (isLoading) {
        overlay = <g transform={`translate(50,50)`}>
            <g class="animate-spin">
                <circle cx="0" cy="0" r="30" fill="none" stroke="currentColor"
                    stroke-width="6" opacity="0.5" />
                <path d="M30,0 A30,30 0 0 0 0,-30" fill="none" stroke="currentColor"
                    stroke-width="6" />
            </g>
        </g>;
    } else {
        overlay = <>
            {currentExpl != null && !hideCircle ?<circle
                cx={left + width/2} cy={top + height/2}
                r={0.05*size[0] + Math.max(width, height) / 2}
                fill="none" stroke="currentColor" stroke-width="2"
            />: null}
            {explanations?.map((g, i) => <rect x={g.left} y={g.top}
                onClick={e => {
                    dispatch({ action: 'set_current_expl', currentExpl: i })
                    e.stopPropagation();
                }}
                pointer-events="all" class="cursor-pointer"
                width={g.width} height={g.height}
                fill="none" stroke="none" />
            )}
        </>;
    }
    return <div class="flex area-signwindow"
        onClick={() => dispatch({ action: 'hide_circle' })}>
        <div class="inline-block m-auto relative">
            <img src={image} />
            <div class="absolute w-full h-full top-0 left-0">
                <svg width="100%" height="100%" class="text-primary-400"
                    viewBox={`0 0 ${size[0] || 100} ${size[1] || 100}`}>
                    {overlay}
                </svg>
            </div>
        </div>
    </div>;
}

function ExplanationList ({ explanations, currentExpl, dispatch }) {

    const scroller = useRef(null);
    const can_prev = currentExpl > 0;
    const can_next = currentExpl < explanations.length - 1;

    const bt = "w-6 h-20 rounded-full p-1 m-1";
    const bt_ok = bt+" bg-secondary-400 text-white";
    const bt_no = bt+" bg-secondary-200 text-white cursor-default";

    function goprev () {
        dispatch({ action: 'set_current_expl',
            currentExpl: currentExpl > 0 ? currentExpl - 1 : 0,
        });
    }
    function gonext () {
        dispatch({ action: 'set_current_expl',
            currentExpl: currentExpl < explanations.length - 1 ? currentExpl + 1 : explanations.length - 1,
        });
    }

    return <div class="flex area-explanation md:flex-col">
        <button onClick={goprev} class={"md:hidden "+(can_prev?bt_ok:bt_no)} >
            <svg width="100%" height="100%" viewBox="4 0 16 24">
                <path d="M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z"
                    fill="currentColor" />
            </svg>
        </button>
        <div ref={scroller} class="horizontal-scroll md:vertical-list flex-1 md:pr-12">
            {explanations.map((x, i) => <Explanation
                explanation={x}
                current={i == currentExpl}
                select={() => dispatch({ action: 'set_current_expl', currentExpl: i })}
            />)}
        </div>
        <button onClick={gonext} class={"md:hidden "+(can_next?bt_ok:bt_no)} >
            <svg width="100%" height="100%" viewBox="4 0 16 24">
                <path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"
                    fill="currentColor" />
            </svg>
        </button>
    </div>;
}

function Explanation ({ explanation, current, select }) {
    const div_el = useRef(null);
    const { text } = explanation;
    const div_class = "w-full inline-block p-4 rounded whitespace-normal "+
        "md:block md:border border-primary-500 md:my-2 md:cursor-pointer "+
        (current ? "md:bg-primary-100" : "");

    useEffect(() => {
        if (current) {
            div_el.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [current]);

    function applyStyle(text) {
        return text.replace(/\*([^*]*)\*/g,
            "<em>$1</em>");
    }

    return <div class={div_class} ref={div_el} style="scroll-snap-align: center;"
        onClick={current?null:select}>
        <svg class={"hidden md:inline-block h-full float-left w-5 mr-4 "+
                (current?"text-secondary-600":"text-primary-600")}
            viewBox="0 0 10 10">
            <circle cx="5" cy="5" r="4" vector-effect="non-scaling-stroke"
                stroke="currentColor" stroke-width="1"
                fill={current ? "currentColor" : "none"} />
        </svg>
        <p class="text-primary-900"
            dangerouslySetInnerHTML={{__html: applyStyle(text) }} />
    </div>
}


function FileBar ({ choose, showhelp }) {
    const div_style = "area-filebar flex py-2 px-6 justify-between items-center"+
        " md:justify-center md:space-x-24 md:py-4";
    return <div class={div_style}>
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
        <input class="hidden" type="file" ref={input} accept="image/*"
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
    const slider_style = "z-10 px-2 py-12 bg-white transition-all prose leading-snug prose-primary overflow-y-auto off-to-right md:off-below md:prose-lg md:p-6";
    useEffect(() => {
        if (is_wide()) {
            page.current.style.marginTop = '0';
        } else {
            page.current.style.marginLeft = '20vw';
        }
    }, []);
    return <div class="fixed inset-0 flex">
        <div class="absolute inset-0 bg-black opacity-25 flex"
            onClick={hidehelp} />
        <div class={slider_style} ref={page}>
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
    </div>;
}


render(<App />, document.body);
