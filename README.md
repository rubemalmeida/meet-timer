# Google Meet Timer Extension

A Chrome extension that adds a customizable timer to Google Meet sessions and Google Slides presentations, helping you keep track of meeting duration and presentation time with visual alerts.

## Features

- **Visible Timer Display**: Shows a timer in the top-left corner of Google Meet pages and Google Slides presentations
- **Cross-Platform Support**: Works on both Google Meet and Google Slides for seamless presentation timing
- **Customizable Duration**: Set target meeting duration in minutes
- **Visual Alert**: Timer blinks when the target time is reached
- **Persistent State**: Timer continues running even if you navigate between Meet rooms or presentation slides
- **Start/Pause/Reset Controls**: Full control over timer functionality
- **Presentation Mode**: Enhanced visibility when presenting with screen sharing
- **Cross-Browser Support**: Compatible with Chrome, Edge, and other Chromium-based browsers

## Installation

### Method 1: Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The extension will be installed and ready to use

### Method 2: Chrome Web Store
*Coming soon - extension will be published to the Chrome Web Store*

## Usage

1. **Navigate to Google Meet or Slides**: Go to any Google Meet session or Google Slides presentation
2. **Open Extension Popup**: Click the extension icon in the browser toolbar
3. **Set Target Time**: Use the + and - buttons to set your desired meeting/presentation duration
4. **Start Timer**: Click "Start" to begin the timer
5. **Monitor Progress**: The timer will be visible in the top-left corner of the Meet or Slides window
6. **Visual Alert**: When the target time is reached, the timer will start blinking
7. **Control Timer**: Use "Pause" to pause or "Reset" to reset the timer
8. **Screen Sharing**: When presenting Google Slides with screen sharing, all participants will see the timer

## Interface

### Extension Popup
- **Current Time Display**: Shows the current elapsed time
- **Target Time Controls**: Increase/decrease target duration
- **Start/Pause Button**: Toggle timer state
- **Reset Button**: Reset timer to 00:00
- **Status Indicator**: Shows current timer state

### On-Screen Timer
- **Position**: Top-left corner of Google Meet window or Google Slides presentation
- **Style**: Black background with red text, enhanced visibility on Slides
- **Visibility**: Always visible but doesn't interfere with Meet controls or presentation content
- **Alert**: Blinks when target time is exceeded
- **Presentation Mode**: Larger and more prominent when used in Google Slides

## File Structure

```
meet-timer/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── content.js            # Content script for Meet pages
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── timer.css             # Timer styling
└── README.md             # This file
```

## Technical Details

### Permissions Required
- `activeTab`: Access to the current active tab
- `scripting`: Inject content scripts into Meet pages and Slides presentations
- `storage`: Save timer state and preferences
- `https://meet.google.com/*`: Access to Google Meet
- `https://docs.google.com/*`: Access to Google Slides presentations

### Browser Compatibility
- Google Chrome (Manifest V3)
- Microsoft Edge
- Other Chromium-based browsers

### Storage
The extension uses Chrome's local storage to persist:
- Target meeting duration
- Current timer state (running/paused)
- Elapsed time
- Timer start time and pause duration

## Development

### Prerequisites
- Chrome/Chromium browser with Developer Mode enabled
- Basic knowledge of JavaScript, HTML, and CSS

### Local Development
1. Clone the repository
2. Make your changes
3. Reload the extension in `chrome://extensions/`
4. Test in Google Meet and Google Slides presentations

### Key Components

#### Content Script (`content.js`)
- Injects the timer display into Meet pages and Slides presentations
- Detects platform (Meet vs Slides) and adapts timer appearance
- Manages timer state and intervals
- Handles persistence across page navigation
- Communicates with popup for real-time updates

#### Popup Interface (`popup.js` + `popup.html`)
- Provides user controls for timer management
- Displays current timer status
- Sends commands to content script

#### Background Script (`background.js`)
- Handles extension lifecycle events
- Facilitates communication between popup and content scripts

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have suggestions:
1. Check existing issues on GitHub
2. Create a new issue with detailed description
3. Include browser version and steps to reproduce

## Changelog

### Version 1.1
- Added Google Slides presentation support
- Enhanced timer visibility for screen sharing scenarios
- Cross-platform timer synchronization
- Improved styling for presentation mode

### Version 1.0
- Initial release
- Basic timer functionality
- Google Meet integration
- Cross-browser compatibility
- Persistent timer state
- Visual blinking alert

---

**Note**: This extension is not affiliated with or endorsed by Google. Google Meet and Google Slides are trademarks of Google LLC.
