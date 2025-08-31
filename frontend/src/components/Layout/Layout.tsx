import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      <main className="flex-1">
        <Outlet />
      </main>
      
    </div>
  )
}

export default Layout
