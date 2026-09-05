import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ContentCommandOutputPrototype } from './prototype/content-command-output/ContentCommandOutputPrototype'
import { ResponsiveTerminalSessionPrototype } from './prototype/responsive-terminal-session/ResponsiveTerminalSessionPrototype'
import { TerminalVisualGrammarPrototype } from './prototype/terminal-visual-grammar/TerminalVisualGrammarPrototype'
import './styles.css'
import './prototype/content-command-output/prototype.css'
import './prototype/responsive-terminal-session/prototype.css'
import './prototype/terminal-visual-grammar/prototype.css'

const searchParams = new URLSearchParams(window.location.search)
const prototypeName = searchParams.get('prototype')
const prototypeVariant = searchParams.get('variant')
const showContentCommandPrototype =
  import.meta.env.DEV && prototypeName === 'content' && ['A', 'B', 'C'].includes(prototypeVariant ?? '')
const showResponsivePrototype =
  import.meta.env.DEV && prototypeName === 'responsive' && ['A', 'B', 'C'].includes(prototypeVariant ?? '')
const showVisualGrammarPrototype =
  import.meta.env.DEV && !prototypeName && ['A', 'B', 'C'].includes(prototypeVariant ?? '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {showResponsivePrototype ? (
      <ResponsiveTerminalSessionPrototype />
    ) : showContentCommandPrototype ? (
      <ContentCommandOutputPrototype />
    ) : showVisualGrammarPrototype ? (
      <TerminalVisualGrammarPrototype />
    ) : (
      <App />
    )}
  </StrictMode>,
)
