import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthPage from './pages/Auth'
import HomePage from './pages/Home'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
