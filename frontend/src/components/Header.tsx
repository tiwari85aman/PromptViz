import React from 'react';
import { Brain, Settings, HelpCircle, Menu, History, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  onSettingsClick?: () => void;
  onHelpClick?: () => void;
  onMenuClick?: () => void;
  onHistoryClick?: () => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onSettingsClick, 
  onHelpClick, 
  onMenuClick,
  onHistoryClick,
  showBackButton = false,
  onBackClick
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and branding */}
        <div className="flex items-center space-x-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-gray-900">PromptViz</h1>
            <p className="text-sm text-gray-600">AI-Powered Prompt Visualization</p>
          </div>
          <div className="sm:hidden">
            <h1 className="text-lg font-bold text-gray-900">PromptViz</h1>
          </div>
        </div>

        {/* Status indicators and actions */}
        <div className="flex items-center space-x-4">
          {/* Connection status */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span className="text-sm text-gray-600">Connected</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {showBackButton ? (
              <button
                onClick={onBackClick}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
            ) : (
              <>
                <button
                  onClick={onHistoryClick}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2"
                  aria-label="View History"
                >
                  <History className="w-5 h-5" />
                  <span className="hidden sm:inline">History</span>
                </button>
                <button
                  onClick={onHelpClick}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  aria-label="Help"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={onSettingsClick}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;