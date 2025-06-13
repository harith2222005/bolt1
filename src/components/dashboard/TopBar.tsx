import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Menu, 
  Search, 
  Sun, 
  Moon, 
  ChevronDown,
  FileText,
  Link as LinkIcon
} from 'lucide-react';

interface TopBarProps {
  onToggleSidebar: () => void;
  onOpenProfile: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, onOpenProfile }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'files' | 'links'>('files');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log(`Searching ${searchType} for: ${searchQuery}`);
    }
  };

  return (
    <nav className="navbar glass sticky-top">
      <div className="container-fluid">
        {/* Left side */}
        <div className="d-flex align-items-center">
          <button
            className="btn btn-link text-muted d-md-none me-2"
            onClick={onToggleSidebar}
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="d-flex align-items-center">
            <div className="input-group" style={{ maxWidth: '400px' }}>
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                >
                  {searchType === 'files' ? (
                    <FileText size={16} />
                  ) : (
                    <LinkIcon size={16} />
                  )}
                </button>
                <ul className="dropdown-menu glass">
                  <li>
                    <button
                      className="dropdown-item d-flex align-items-center"
                      type="button"
                      onClick={() => setSearchType('files')}
                    >
                      <FileText className="me-2" size={16} />
                      Files
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item d-flex align-items-center"
                      type="button"
                      onClick={() => setSearchType('links')}
                    >
                      <LinkIcon className="me-2" size={16} />
                      Links
                    </button>
                  </li>
                </ul>
              </div>
              <input
                type="text"
                className="form-control"
                placeholder={`Search ${searchType}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ borderLeft: 'none' }}
              />
              <button className="btn btn-outline-secondary" type="submit">
                <Search size={16} />
              </button>
            </div>
          </form>
        </div>

        {/* Right side */}
        <div className="d-flex align-items-center">
          {/* Theme toggle */}
          <button
            className="btn btn-link text-muted me-3"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* User dropdown */}
          <div className="dropdown">
            <button
              className="btn btn-link text-decoration-none d-flex align-items-center"
              type="button"
              onClick={onOpenProfile}
            >
              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2"
                   style={{ width: '32px', height: '32px' }}>
                <span className="text-white fw-bold small">
                  {user?.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-muted me-1">{user?.username}</span>
              <ChevronDown className="text-muted" size={16} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopBar;