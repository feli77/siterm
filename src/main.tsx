import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { TerminalVisualGrammarPrototype } from './prototype/terminal-visual-grammar/TerminalVisualGrammarPrototype'
import './styles.css'
import './prototype/terminal-visual-grammar/prototype.css'

const prototypeVariant = new URLSearchParams(window.location.search).get('variant')
const showVisualGrammarPrototype =
  import.meta.env.DEV && ['A', 'B', 'C'].includes(prototypeVariant ?? '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {showVisualGrammarPrototype ? <TerminalVisualGrammarPrototype /> : <App />}
  </StrictMode>,
)
