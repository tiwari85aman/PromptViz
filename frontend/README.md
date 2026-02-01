# PromptViz Frontend

A modern, responsive React frontend for PromptViz - an AI-powered system prompt visualization tool that transforms complex text prompts into beautiful, interactive diagrams.

## 🚀 Features

### Core Functionality
- **AI-Powered Diagram Generation**: Convert text prompts into Mermaid diagrams using various AI models
- **Multiple Input Methods**: Text input or file upload (.txt, .md)
- **Real-time Preview**: Toggle between diagram view and code view
- **Multiple AI Models**: Support for GPT-4, GPT-3.5, Claude, and more
- **Flowchart Diagrams**: Generate clear, interactive flowchart visualizations

### User Experience
- **Modern UI/UX**: Clean, professional design following the detailed UX specifications
- **Responsive Design**: Mobile-first approach with bottom sheet on mobile devices
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- **Loading States**: Beautiful animations and progress feedback
- **Error Handling**: Comprehensive error states with actionable messages

### Technical Features
- **TypeScript**: Fully typed for better development experience
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Mermaid Integration**: Real-time diagram rendering with zoom and pan
- **API Integration**: RESTful API client with error handling
- **Keyboard Shortcuts**: Power user features (Cmd+Enter to generate, Cmd+` to toggle view)

## 🛠️ Technology Stack

- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Mermaid** for diagram rendering
- **Axios** for API communication
- **Lucide React** for icons
- **React Hooks** for state management

## 📋 Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend API running on `http://localhost:5000`

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set environment variables** (optional):
   ```bash
   echo "REACT_APP_API_URL=http://localhost:5000" > .env
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## 📱 Responsive Design

The application adapts to different screen sizes:

- **Desktop (1024px+)**: Full sidebar layout with all features
- **Tablet (768px-1024px)**: Optimized spacing and touch targets
- **Mobile (320px-768px)**: Hidden sidebar with mobile menu, bottom sheet controls

## ♿ Accessibility Features

- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and live regions
- **Focus Management**: Visible focus indicators and logical tab order
- **High Contrast**: Minimum 4.5:1 color contrast ratio
- **Reduced Motion**: Respects user's motion preferences

## ⌨️ Keyboard Shortcuts

- `Cmd/Ctrl + Enter`: Generate diagram
- `Cmd/Ctrl + \``: Toggle between diagram and code view
- `Tab`: Navigate between interactive elements
- `Space/Enter`: Activate buttons and links

## 🎨 Design System

### Colors
- **Primary**: Blue (#2563eb) for brain/intelligence theme
- **Success**: Green (#059669) for completion states
- **Warning**: Orange (#d97706) for processing states
- **Error**: Red (#dc2626) for error states
- **Info**: Cyan (#0891b2) for informational content

### Typography
- **Headings**: 2.5rem, 2rem, 1.5rem (bold/semibold)
- **Body**: 1.125rem (large), 1rem (base), 0.875rem (small)
- **Code**: 1rem monospace for prompts and code

### Components
- **Buttons**: 8px border-radius, proper hover states
- **Inputs**: Focus rings, placeholder text, validation states
- **Cards**: Subtle shadows, proper spacing
- **Loading**: Skeleton screens, progress indicators

## 🔧 Available Scripts

- `npm start`: Run development server
- `npm build`: Build for production
- `npm test`: Run test suite
- `npm run eject`: Eject from Create React App (not recommended)

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # App header with branding
│   ├── Sidebar.tsx     # Desktop sidebar controls
│   ├── MobileSidebar.tsx # Mobile sidebar implementation
│   └── DiagramCanvas.tsx # Main diagram viewing area
├── hooks/              # Custom React hooks
│   └── useKeyboardShortcuts.ts
├── services/           # API services
│   └── api.ts         # Backend API client
├── types/             # TypeScript type definitions
│   └── api.ts         # API response types
├── utils/             # Utility functions
│   └── accessibility.ts # Accessibility helpers
├── App.tsx            # Main app component
└── index.tsx          # App entry point
```

## 🌐 API Integration

The frontend communicates with the backend API for:

- **Health Check**: `GET /api/health`
- **Generate Diagram**: `POST /api/generate-diagram`
- **Upload File**: `POST /api/upload-file`
- **Get Models**: `GET /api/models`
- **Validate Key**: `POST /api/validate-key`
- **System Prompts**: `GET /api/system-prompts`

## 🎯 Performance Optimizations

- **Lazy Loading**: Components loaded on demand
- **Memoization**: Expensive operations cached
- **Optimistic Updates**: Immediate UI feedback
- **Progressive Enhancement**: Graceful degradation for slow connections

## 🐛 Error Handling

The application includes comprehensive error handling:

- **Network Errors**: Connection issues with retry options
- **Validation Errors**: Form validation with helpful messages
- **API Errors**: Server errors with actionable solutions
- **Rendering Errors**: Fallback UI for unexpected issues

## 🎪 Delight Factors

- **Micro-animations**: Subtle hover and focus states
- **Smart Defaults**: Anticipate user needs
- **Contextual Help**: Tooltips and guidance
- **Success Celebrations**: Positive feedback for completions

## 📝 Usage Examples

### Basic Text Input
1. Select an AI model (GPT-4 recommended)
2. Enter your system prompt in the text area
3. Click "Generate Diagram" or press Cmd+Enter

### File Upload
1. Switch to "Upload" input method
2. Drag and drop a .txt or .md file
3. Configure AI model
4. Generate the diagram

### Viewing Results
- Use the diagram/code toggle to switch views
- Zoom in/out using the controls or mouse wheel
- Copy the Mermaid code to clipboard
- Download the diagram code

## 🤝 Contributing

1. Follow the existing code style and component patterns
2. Ensure accessibility standards are maintained
3. Test responsive design on multiple screen sizes
4. Update documentation for new features

## 📄 License

This project is part of the PromptViz system. See the main project README for license information.