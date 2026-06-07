import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { ThemeInit } from '../features/theme/ThemeInit'

export function Providers() {
  return (
    <BrowserRouter>
      <ThemeInit />
      <App />
    </BrowserRouter>
  )
}
