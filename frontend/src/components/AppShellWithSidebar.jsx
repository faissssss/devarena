import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppShellWithSidebar() {
  return (
    <div
      className="min-h-dvh"
      style={{ 
        background: 'var(--color-cream)', 
        color: 'var(--color-dark)', 
        display: 'flex',
        overflowX: 'hidden',
        width: '100%',
      }}
    >
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main
        style={{
          marginLeft: 240, // Sidebar width
          flex: 1,
          minHeight: '100vh',
          padding: '40px 48px',
          display: 'flex',
          justifyContent: 'center',
          overflowX: 'hidden',
        }}
      >
        <div style={{ width: '100%', maxWidth: 1200, overflowX: 'hidden' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
