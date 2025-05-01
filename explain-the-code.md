# SheSurvived - Code Explanation

This document provides a detailed explanation of the SheSurvived app's code structure, key components, and functionality.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Core Components](#core-components)
3. [Data Management](#data-management)
4. [Key Features Implementation](#key-features-implementation)
5. [User Authentication Flow](#user-authentication-flow)
6. [Emergency Alert System](#emergency-alert-system)
7. [Location Tracking](#location-tracking)
8. [Audio Recording and Streaming](#audio-recording-and-streaming)
9. [Trusted Contacts System](#trusted-contacts-system)

## Project Structure

The SheSurvived app is built using Next.js with the App Router and follows a component-based architecture. Here's an overview of the project structure:
```
├── app/                           # Next.js App Router directory
│   ├── alarm/                     # Emergency alarm page
│   ├── bracelet-selection/        # Bracelet selection page
│   ├── bracelet-verification/     # Bracelet verification page
│   ├── dashboard/                 # Main dashboard page
│   ├── emergency-history/         # Emergency history page
│   ├── emergency-track/           # Emergency tracking page
│   ├── login/                     # Login page
│   ├── profile/                   # User profile page
│   ├── register/                  # Registration page
│   ├── safe-walk/                 # Safety map page
│   ├── trusted-by/                # People trusting you page
│   ├── trusted-contacts/          # Trusted contacts page
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Global styles
│
├── components/                    # Reusable components
│   ├── audio-player/              # Audio player component with full controls
│   ├── emergency-notification/    # Emergency notification component
│   ├── heat-map/                  # Heat map component
│   ├── live-location-map/         # Live location map component
│   └── she-survived-logo/         # Logo component
│
├── ui/                            # UI components (shadcn/ui)
│
├── public/                        # Static assets
│   ├── images/                    # Images
│   └── alarm-sound.mp3            # Alarm sound
```

## Core Components

### LiveLocationMap

The `LiveLocationMap` component is responsible for displaying and updating the user's location in real-time. It uses Leaflet for map rendering and includes features like:

- Real-time location tracking
- Location history
- Map controls
- Location sharing

```tsx
// Key features of LiveLocationMap
- Initializes a Leaflet map with the user's location
- Updates the marker position when location changes
- Stores location data in localStorage for emergency sharing
- Provides controls for starting/stopping tracking
```

### EmergencyNotification

The `EmergencyNotification` component displays alerts when a trusted contact triggers an emergency. It includes:

- Visual indicators for emergency type (full alert or doubt mode)
- Audio alarm that plays when an emergency is active
- Controls for muting the alarm
- Quick actions for responding to the emergency
- Embedded audio player for live streaming audio from the emergency

```tsx
// Key features of EmergencyNotification
- Displays emergency information (user, time, location)
- Plays an alarm sound using Web Audio API
- Provides buttons for tracking location and calling
- Shows different styles based on emergency type
- Includes an embedded AudioPlayer for live audio streaming
- Toggle option to show/hide the audio player
```

### AudioPlayer

The `AudioPlayer` component provides full control over audio playback:

- Play/pause functionality
- Skip forward/backward between audio chunks
- Timeline slider for seeking to specific points
- Visual indicators for live streaming
- Volume control and mute option
- Time display showing current position and total duration

```tsx
// Key features of AudioPlayer
- Simulates audio playback with Web Audio API
- Provides a timeline slider for seeking
- Shows current time and total duration
- Supports live streaming with visual indicators
- Includes controls for play/pause, skip, and volume
```

### HeatMap

The `HeatMap` component visualizes safety data on a map, showing areas with reported incidents. It:

- Displays incident density using color gradients
- Filters incidents based on time of day
- Provides information about each incident
- Shows the user's current location

## Data Management

The app uses localStorage for data persistence in this demo version. The main data structures are:

### User Data

```typescript
interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  city: string;
  password: string;
  hasBracelet: boolean;
  braceletVerified?: boolean;
  braceletCode?: string;
  braceletVerifiedAt?: string;
  trustedContacts: string[]; // Array of user IDs
  trustedBy: string[]; // Array of user IDs who trust this user
}
```

### Emergency Data

```typescript
interface Emergency {
  userId: string;
  userName: string;
  timestamp: string;
  location: [number, number]; // [latitude, longitude]
  active: boolean;
  doubtMode: boolean;
  braceletCode?: string;
  playAlarmOnContact?: boolean;
  audioChunks: string[];
  latestAudioChunk?: {
    chunk: string;
    timestamp: string;
  };
  liveStreamActive?: boolean;
  cancelledAt?: string;
  wasRealEmergency?: boolean;
  cancellationReason?: string;
  emergencyType?: string; // Type of emergency (harassment, stalking, etc.)
}
```

## Key Features Implementation

### User Authentication Flow

The authentication flow is simulated using localStorage:

1. User registers with personal information
2. User selects whether they have a bracelet
3. If they have a bracelet, they verify it with a code
4. User is redirected to the dashboard

```tsx
// Registration process
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Validate form data
  // Create new user object
  const newUser = {
    id: Date.now().toString(),
    fullName: formData.fullName,
    email: formData.email,
    // ... other user data
    trustedContacts: [],
    trustedBy: [],
  };
  // Save to localStorage
  users.push(newUser);
  localStorage.setItem("safetyUsers", JSON.stringify(users));
  localStorage.setItem("safetyUser", JSON.stringify(newUser));
  // Redirect to bracelet selection
  router.push("/bracelet-selection");
};
```

### Emergency Alert System

The emergency alert system is the core functionality of the app:

1. User triggers an alert (emergency or doubt mode)
2. App begins recording audio and tracking location
3. Trusted contacts receive notifications
4. User can cancel the alert with a reason
5. If it was a real emergency, user selects the emergency type

```tsx
// Triggering an emergency alert
const triggerAlarm = (isDoubtMode = false) => {
  setAlarmActive(true);
  setDoubtMode(isDoubtMode);
  setRecording(true);
  setLiveStreamActive(true);
  
  // Start timer for elapsed time
  timerRef.current = setInterval(() => {
    setElapsedTime((prev) => prev + 1);
  }, 1000);
  
  // Create and store emergency data
  const emergencyData = {
    userId: user.id,
    userName: user.fullName,
    timestamp: new Date().toISOString(),
    location: location,
    active: true,
    doubtMode: isDoubtMode,
    // ... other emergency data
  };
  
  // Store in localStorage and notify trusted contacts
  // ...
};
```

### Audio Recording and Streaming

The app simulates audio recording and live streaming from the emergency sender to trusted contacts:

```tsx
// In alarm page - Recording and streaming audio
useEffect(() => {
  if (recording && liveStreamActive) {
    const recordingInterval = setInterval(() => {
      // Generate a mock audio chunk
      const mockAudioChunk = `audio_chunk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      setAudioChunks((prev) => {
        const newChunks = [...prev, mockAudioChunk];
        
        // Update emergency data with new audio chunks and latest chunk for live streaming
        if (user) {
          const emergencies = JSON.parse(localStorage.getItem("emergencies") || "{}");
          if (emergencies[user.id]) {
            emergencies[user.id].audioChunks = newChunks;
            emergencies[user.id].latestAudioChunk = {
              chunk: mockAudioChunk,
              timestamp: new Date().toISOString()
            };
            emergencies[user.id].liveStreamActive = true;
            localStorage.setItem("emergencies", JSON.stringify(emergencies));
            
            // Update emergency history
            // ...
          }
        }
        
        return newChunks;
      });
    }, 5000);
    
    return () => clearInterval(recordingInterval);
  }
}, [recording, user]);
```

### Audio Player Implementation

The AudioPlayer component provides full control over audio playback:

```tsx
// AudioPlayer component key functionality
const startPlayback = () => {
  if (audioChunks.length === 0) return;

  setIsPlaying(true);

  try {
    // Create audio context and oscillator for simulated playback
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      audioContextRef.current = new AudioContext();
      oscillatorRef.current = audioContextRef.current.createOscillator();
      gainNodeRef.current = audioContextRef.current.createGain();

      // Configure audio settings
      oscillatorRef.current.type = "sine";
      oscillatorRef.current.frequency.setValueAtTime(440, audioContextRef.current.currentTime);
      gainNodeRef.current.gain.setValueAtTime(isMuted ? 0 : volume, audioContextRef.current.currentTime);

      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);

      oscillatorRef.current.start();

      // Update progress every 100ms
      progressIntervalRef.current = setInterval(() => {
        // Calculate current time based on chunk index and progress within chunk
        const chunkProgress = currentChunkIndex * 5 + progress * 5;
        setCurrentTime(formatTime(chunkProgress));
      }, 100);

      // Move to next chunk every 5 seconds
      playbackIntervalRef.current = setInterval(() => {
        setCurrentChunkIndex((prev) => {
          if (prev >= audioChunks.length - 1) {
            // If we're at the end, stop playback
            if (!isLive) {
              stopPlayback();
              return 0;
            }
            return prev;
          }
          return prev + 1;
        });
        setProgress(0); // Reset progress for new chunk
      }, 5000);
    }
  } catch (error) {
    console.error("Error starting audio playback:", error);
  }
};
```

### Location Tracking

Location tracking is simulated using the `LiveLocationMap` component:

```tsx
// Simulating location updates
const simulateLocationUpdate = () => {
  setLocation((prevLocation) => {
    // Simulate small movement in random direction
    const latChange = (Math.random() - 0.5) * 0.0005;
    const lngChange = (Math.random() - 0.5) * 0.0005;
    return [prevLocation[0] + latChange, prevLocation[1] + lngChange];
  });
};

// Start/stop location tracking
useEffect(() => {
  if (isTracking && mapInitialized) {
    locationIntervalRef.current = setInterval(simulateLocationUpdate, 3000);
  } else if (locationIntervalRef.current) {
    clearInterval(locationIntervalRef.current);
  }
  
  return () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }
  };
}, [isTracking, mapInitialized]);
```

## Trusted Contacts System

The trusted contacts system allows users to:

1. Add other users as trusted contacts
2. View users who have added them as trusted contacts
3. Receive emergency alerts from trusted contacts
4. Track trusted contacts during emergencies
5. Listen to live audio streaming from trusted contacts during emergencies

```tsx
// Adding a trusted contact
const addContact = (contactId: string) => {
  if (!user) return;
  
  const contactUser = allUsers.find((u: any) => u.id === contactId);
  if (!contactUser) return;
  
  // Update current user's trusted contacts
  const updatedUser = {
    ...user,
    trustedContacts: [...(user.trustedContacts || []), contactId],
  };
  
  // Update contact's trustedBy list
  const updatedContactUser = {
    ...contactUser,
    trustedBy: [...(contactUser.trustedBy || []), user.id],
  };
  
  // Update in local storage
  const updatedUsers = allUsers.map((u: any) => {
    if (u.id === user.id) return updatedUser;
    if (u.id === contactId) return updatedContactUser;
    return u;
  });
  
  localStorage.setItem("safetyUsers", JSON.stringify(updatedUsers));
  localStorage.setItem("safetyUser", JSON.stringify(updatedUser));
  
  // Update state
  setUser(updatedUser);
  setContacts([...contacts, contactUser]);
  setSearchResults(searchResults.filter((r) => r.id !== contactId));
  setAllUsers(updatedUsers);
};
```

## Emergency History

The emergency history system stores and displays all past emergency alerts:

```tsx
// Loading emergency history
const loadEmergencyHistory = (userData: any, users: any[]) => {
  // Get emergency history from localStorage
  const emergencyHistory = JSON.parse(localStorage.getItem("emergencyHistory") || "{}");
  const currentEmergencies = JSON.parse(localStorage.getItem("emergencies") || "{}");
  
  // Process sent alerts (alerts sent by current user)
  const userSentAlerts: any[] = [];
  
  // Check if user has any emergency history
  if (emergencyHistory[userData.id]) {
    // Convert to array if it's not already
    const userEmergencies = Array.isArray(emergencyHistory[userData.id])
      ? emergencyHistory[userData.id]
      : [emergencyHistory[userData.id]];
    
    // Add all alerts to the array
    userEmergencies.forEach((alert: any) => {
      userSentAlerts.push({
        ...alert,
        userId: userData.id,
        userName: userData.fullName,
      });
    });
  }
  
  // Sort by timestamp (newest first)
  userSentAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  setSentAlerts(userSentAlerts);
  
  // Process received alerts (alerts sent by trusted contacts)
  // ...
};
```

## Emergency Notification with Live Audio

The EmergencyNotification component now includes an embedded AudioPlayer for live audio streaming:

```tsx
// EmergencyNotification with AudioPlayer
return (
  <Card className={`mb-4 animate-pulse ${isDoubtMode ? "bg-yellow-50" : "bg-red-50"}`}>
    <CardContent className="p-4">
      {/* Emergency information */}
      <div className="flex items-start justify-between">
        {/* ... */}
        {hasAudio && isLiveStreaming && (
          <button 
            onClick={toggleAudioPlayer} 
            className="mt-1 text-xs text-pink-600 hover:text-pink-800 flex items-center"
          >
            {showAudioPlayer ? "Hide live audio" : "Listen to live audio"}
            {isLiveStreaming && <span className="ml-1 h-2 w-2 bg-pink-500 rounded-full animate-pulse"></span>}
          </button>
        )}
      </div>

      {/* Embedded AudioPlayer */}
      {showAudioPlayer && hasAudio && (
        <div className="mt-3 p-3 bg-white rounded-md border border-gray-200">
          <AudioPlayer 
            audioChunks={emergency.audioChunks || []} 
            isLive={isLiveStreaming}
            latestTimestamp={emergency.latestAudioChunk?.timestamp}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-3 flex space-x-2">
        <Link href={`/emergency-track/${emergency.userId}`} className="flex-1">
          <Button className="w-full text-white bg-red-500 hover:bg-red-600">
            Track Location
          </Button>
        </Link>
        <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
          Call
        </Button>
      </div>
    </CardContent>
  </Card>
);
```

## Conclusion

The SheSurvived app demonstrates a comprehensive safety solution with features like emergency alerts, location tracking, audio recording and streaming, and trusted contacts. The code is structured to be modular and maintainable, with clear separation of concerns between components.

In a production environment, the localStorage-based data management would be replaced with secure server-side storage, real-time databases, and proper authentication. The simulated features like audio recording and location tracking would use actual device APIs.
