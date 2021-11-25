import { render } from 'preact';

export default function App() {
    return <>
        <p class="rounded text-white bg-blue-600">Hello World!</p>
    </>;
}

render(<App />, document.getElementById('app'));
