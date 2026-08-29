import { useAuth } from './store/auth'
import Login from './components/Login'
import Terminal from './components/Terminal'

export default function App() {
  const accessToken = useAuth((s) => s.accessToken)
  return accessToken ? <Terminal /> : <Login />
}
