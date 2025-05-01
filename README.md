# SheSurvived - Women's Safety App

SheSurvived is a comprehensive safety application designed to provide women with tools to enhance their personal security. The app features smart bracelet integration, emergency alerts, location tracking, and trusted contact networks to create a robust safety ecosystem.

## Features

### Core Functionality

- **User Authentication**: Secure login and registration system
- **Smart Bracelet Integration**: Pair and verify safety bracelets for quick emergency activation
- **Dashboard**: Central hub for accessing all safety features
- **Profile Management**: Update personal information and device settings

### Emergency Alert System

- **Emergency Alert (Red Button)**: Triggers immediate alerts to trusted contacts with location sharing and audio recording
- **Doubt Mode (Yellow Button)**: For suspicious situations - records audio and tracks location without triggering full alarms
- **Cancellation Options**:
  - **False Alarm (Green)**: Nothing happened, cancel the alert
  - **Emergency Resolved (Red)**: Something occurred but is now resolved
- **Emergency Type Classification**: Categorize resolved emergencies by type (harassment, stalking, assault, etc.)

### Location Services

- **Real-time Location Tracking**: Share your location with trusted contacts during emergencies
- **Safety Map**: View incident heat maps to identify high-risk areas
- **Location History**: Track movement during emergency situations

### Audio Recording

- **Live Audio Streaming**: Audio is recorded and streamed in real-time to trusted contacts
- **Full Audio Control**: Play, pause, skip, and seek to specific points in the audio recording
- **Audio History**: Access and play back audio recordings from past emergencies
- **Audio Timeline**: Navigate through audio recordings with a timeline interface

### Contact Management

- **Trusted Contacts**: Add and manage contacts who can receive your emergency alerts
- **Trusted By**: View users who have added you as their trusted contact
- **Emergency Notifications**: Receive alerts when your trusted contacts are in danger

### History and Reporting

- **Emergency History**: View all past alerts with detailed information
- **Incident Details**: Access location data, timestamps, audio recordings, and resolution status
- **Cancellation Reasons**: Track why alerts were cancelled (false alarm or resolved emergency)
- **Emergency Types**: View categorized emergencies for better incident analysis

## Technical Implementation

### Data Storage

The app uses localStorage for data persistence in this demo version. In a production environment, this would be replaced with secure server-side storage and real-time databases.

### Location Tracking

Location tracking is simulated in this demo. In a production environment, it would use the device's GPS and geolocation APIs.

### Audio Recording

Audio recording and streaming are simulated in this demo. In a production environment, it would use the device's microphone and WebRTC for real-time audio streaming.

### Map Integration

The app uses Leaflet for map rendering and location visualization. Heat maps show incident density in different areas.

## User Flows

### Emergency Alert Flow

1. User activates emergency alert (red button) or doubt mode (yellow button)
2. App begins recording audio and tracking location
3. For full alerts, trusted contacts receive notifications with alarm sounds
4. Trusted contacts can view real-time location and listen to live audio
5. User can cancel the alert with reason (false alarm or resolved emergency)
6. If resolved emergency, user selects the type of emergency from a dropdown
7. All data is stored in emergency history

### Trusted Contact Flow

1. User receives emergency notification
2. User can view sender's location in real-time
3. User can listen to live audio streaming or recorded audio
4. User can navigate through audio recordings with full playback controls
5. User can call or message the person in danger
6. User can track the emergency status (active, cancelled, resolved)
7. User can see the type of emergency if specified

## Setup and Installation

1. Clone the repository
2. Install dependencies with `npm install`
3. Run the development server with `npm run dev`
4. Access the app at `http://localhost:3000`

## Demo Accounts

For testing purposes, you can create new accounts or use the following demo accounts:

- Email: `user1@example.com`, Password: `password123`
- Email: `user2@example.com`, Password: `password123`

## Future Enhancements

- Real GPS integration
- Actual audio recording and streaming
- Push notifications
- Integration with emergency services
- Offline mode support
- End-to-end encryption for sensitive data
- Multi-language support
- Accessibility improvements
- Advanced analytics for emergency patterns
- Integration with wearable devices

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This project was created to help improve women's safety
- Special thanks to all contributors and testers
