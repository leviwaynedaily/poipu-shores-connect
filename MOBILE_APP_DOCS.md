# Mobile App Developer Documentation

This document provides information for the native mobile app team on how to integrate with the web app's backend (Supabase).

## Custom Domain

**Important:** Use the custom Supabase domain for all API calls:
- **Supabase URL:** `https://rvqqnfsgovlxocjjugww.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cXFuZnNnb3ZseG9jamp1Z3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTQ2MzgsImV4cCI6MjA3OTQzMDYzOH0.iUzJqQoHRUJ0nmPU1t44OL9I-ZYtCDofNxAN14phjBQ`

---

## Data Access Methods

### Direct Supabase SDK Access

The mobile app can use the Supabase SDK directly for most data operations. The following tables are accessible with proper RLS policies:

| Table | Direct Access | Notes |
|-------|---------------|-------|
| `profiles` | ✅ Yes | Users can read all profiles, update own |
| `announcements` | ✅ Yes | Anyone can read, admins can write |
| `community_photos` | ✅ Yes | Anyone can read approved, users can upload |
| `documents` | ✅ Yes | Access based on unit ownership |
| `chat_channels` | ✅ Yes | Based on membership |
| `chat_messages` | ✅ Yes | Based on channel access |
| `login_history` | ✅ Yes | Admins can view all |
| `emergency_contacts` | ✅ Yes | Anyone can view active |
| `webcams` | ✅ Yes | Anyone can view active |

### Edge Functions

Some operations require edge functions for security or complex logic:

| Function | Auth Required | Purpose |
|----------|---------------|---------|
| `community-assistant-mobile` | ✅ Yes | AI assistant chat |
| `get-weather` | ❌ No | Weather data |
| `get-members` | ✅ Yes | Member directory |
| `get-page-config` | ❌ No | Mobile page configuration |
| `mobile-user-profile` | ✅ Yes | Get/update user profile |
| `mobile-conversations` | ✅ Yes | Chat conversations |
| `mobile-users` | ✅ Yes (Admin) | Admin user management |
| `register-push-token` | ✅ Yes | Register Expo push token |
| `unregister-push-token` | ✅ Yes | Remove push token |
| `send-push-notification` | ✅ Yes | Send push notifications |
| `track-login` | ✅ Yes | Track login activity |
| `update-notification-preferences` | ✅ Yes | Update notification settings |
| `send-otp` | ❌ No | Send SMS OTP via Twilio |
| `verify-otp` | ❌ No | Verify SMS OTP and get session |

---

## Phone OTP Authentication (SMS via Twilio)

The app supports phone number authentication using custom OTP via Twilio SMS. This bypasses Supabase's native phone auth and uses edge functions directly.

### Flow Overview

```
User enters phone → send-otp → Twilio SMS → User enters code → verify-otp → Magic link token → Sign in
```

### Step 1: Send OTP

```typescript
const { data, error } = await supabase.functions.invoke('send-otp', {
  body: { phone: '8085551234' } // 10-digit phone number (digits only)
});

// Success response:
// { success: true, message: "Verification code sent", phone: "1234" }

// Error responses:
// { error: "Please wait before requesting another code" } (429 - rate limited)
// { error: "If an account exists with this phone number, you will receive an SMS" } (user not found - for security)
```

**Rate Limiting:** One code per phone number every 60 seconds.

### Step 2: Verify OTP

```typescript
const { data, error } = await supabase.functions.invoke('verify-otp', {
  body: { 
    phone: '8085551234',
    code: '123456' // 6-digit code from SMS
  }
});

// Success response:
// { success: true, token_hash: "abc123...", email: "user@example.com" }

// Error responses:
// { error: "Invalid or expired code. Please request a new one." }
// { error: "Invalid code. 3 attempts remaining." }
// { error: "Too many attempts. Please request a new code." }
```

**Security:**
- Codes expire after 10 minutes
- Maximum 5 verification attempts per code
- Codes are deleted after successful verification

### Step 3: Complete Sign In

After successful verification, use the returned `token_hash` and `email` to complete the Supabase session:

```typescript
const { error } = await supabase.auth.verifyOtp({
  email: data.email,
  token_hash: data.token_hash,
  type: 'magiclink',
});

if (!error) {
  // User is now signed in
  // Track login
  await supabase.functions.invoke('track-login', {
    body: {
      userAgent: 'Mobile App/1.0',
      browser: 'React Native',
      deviceType: 'Mobile'
    }
  });
}
```

### Complete Mobile Implementation Example

```typescript
async function signInWithPhone(phone: string) {
  // Normalize phone number
  const normalizedPhone = phone.replace(/\D/g, '');
  
  // Step 1: Send OTP
  const { data: sendData, error: sendError } = await supabase.functions.invoke('send-otp', {
    body: { phone: normalizedPhone }
  });
  
  if (sendError || sendData?.error) {
    throw new Error(sendData?.error || 'Failed to send code');
  }
  
  return { success: true };
}

async function verifyPhoneOtp(phone: string, code: string) {
  const normalizedPhone = phone.replace(/\D/g, '');
  
  // Step 2: Verify OTP
  const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-otp', {
    body: { phone: normalizedPhone, code }
  });
  
  if (verifyError || verifyData?.error) {
    throw new Error(verifyData?.error || 'Verification failed');
  }
  
  // Step 3: Complete sign in with magic link token
  const { error: authError } = await supabase.auth.verifyOtp({
    email: verifyData.email,
    token_hash: verifyData.token_hash,
    type: 'magiclink',
  });
  
  if (authError) {
    throw authError;
  }
  
  return { success: true };
}
```

---

## User Management (Admin)

### Fetching User List

Use the `mobile-users` edge function or query directly:

```typescript
// Direct SDK access
const { data: profiles } = await supabase
  .from('profiles')
  .select('*')
  .order('created_at', { ascending: false });

// Get user roles
const { data: roles } = await supabase
  .from('user_roles')
  .select('user_id, role');

// Get unit ownership
const { data: units } = await supabase
  .from('unit_owners')
  .select('user_id, unit_number, relationship_type, is_primary_contact');
```

### User Detail View

The web app now has a comprehensive user detail sheet showing:
- Contact info (email via edge function, phone, unit)
- Account status (created date, last sign in)
- Roles (Admin, Owner, Board) - can be toggled
- Login history from `login_history` table
- Password reset functionality

For mobile, query login history:

```typescript
const { data: loginHistory } = await supabase
  .from('login_history')
  .select('*')
  .eq('user_id', userId)
  .order('logged_in_at', { ascending: false })
  .limit(10);
```

### Getting User Email (Admin Only)

Emails are stored in `auth.users` which is not directly accessible. Use:

```typescript
const { data } = await supabase.functions.invoke('get-user-email', {
  body: { userId: 'user-uuid-here' }
});
// Returns: { email: 'user@example.com' }
```

### Password Reset (Admin Only)

```typescript
const { data } = await supabase.functions.invoke('reset-password', {
  body: {
    user_id: 'user-uuid-here',
    notification_method: 'show' // or 'email', 'sms', 'both'
  }
});
// If 'show': Returns { temp_password: 'alohakeiki42' }
// Otherwise: Sends notification
```

### Toggle User Roles (Admin Only)

```typescript
// Add role
await supabase.from('user_roles').insert({ 
  user_id: userId, 
  role: 'admin' // or 'owner', 'board' 
});

// Remove role
await supabase.from('user_roles')
  .delete()
  .eq('user_id', userId)
  .eq('role', 'admin');
```

---

## Login Activity Tracking

Track login activity after successful authentication:

```typescript
await supabase.functions.invoke('track-login', {
  body: {
    userAgent: 'Mobile App/1.0',
    browser: 'React Native',
    deviceType: 'Mobile' // or 'Tablet'
  }
});
```

The login history includes:
- `logged_in_at` - timestamp
- `browser` - browser/app name
- `device_type` - Mobile/Tablet/Desktop
- `ip_address` - user's IP
- `location_city` / `location_country` - if available

---

## Push Notifications

### Register Token

```typescript
await supabase.functions.invoke('register-push-token', {
  body: {
    token: 'ExponentPushToken[xxx]',
    device_type: 'ios' // or 'android'
  }
});
```

### Notification Preferences

```typescript
// Get preferences (direct SDK)
const { data } = await supabase
  .from('notification_preferences')
  .select('*')
  .eq('user_id', userId)
  .single();

// Update preferences
await supabase.functions.invoke('update-notification-preferences', {
  body: {
    chat_enabled: true,
    announcements_enabled: true,
    documents_enabled: false,
    photos_enabled: true,
    sound_enabled: true,
    vibration_enabled: true
  }
});
```

---

## Theme & Settings

The web app admin can configure mobile-specific themes and page visibility.

### Get Mobile Page Config

```typescript
const { data } = await supabase.functions.invoke('get-page-config');
// Returns mobile page visibility and order settings
```

### App Settings

```typescript
// Get all settings
const { data: settings } = await supabase
  .from('app_settings')
  .select('setting_key, setting_value');

// Relevant keys:
// - 'mobile_theme' - colors, fonts, etc.
// - 'mobile_pages' - page visibility/order
// - 'emergency_info' - emergency contact display settings
```

---

## Real-time Subscriptions

Use Supabase realtime for:

```typescript
// Chat messages
supabase
  .channel('chat')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'chat_messages' 
  }, handleNewMessage)
  .subscribe();

// Announcements
supabase
  .channel('announcements')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'announcements' 
  }, handleNewAnnouncement)
  .subscribe();

// Typing indicators
supabase
  .channel('typing')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'chat_typing_indicators',
    filter: `channel_id=eq.${channelId}`
  }, handleTyping)
  .subscribe();
```

---

## Recent Updates

### January 2026

- **Searchable Icon Picker** - Sidebar and page icons now use a searchable picker with 1,500+ Lucide icons
  - Icons are stored as PascalCase strings (e.g., `"Home"`, `"MessageSquare"`, `"Camera"`)
  - Mobile app should use the same Lucide icon names from their native library
  - Query icon name from `web_pages_config` or `mobile_pages_config` in `app_settings` table
  - Example: `page.icon` or `page.fallbackIcon` contains the icon name string

- **Remember Me Feature (Web Only)** - Users can now toggle "Remember me" when signing in
  - When checked (default): Session persists in `localStorage` across browser restarts
  - When unchecked: Session stored in `sessionStorage`, cleared when browser/tab closes
  - **Mobile note**: Mobile apps typically use secure storage (Keychain/Keystore) and don't need this toggle
  - If implementing similar functionality on mobile, use:
    - iOS: Keychain with `kSecAttrAccessibleAfterFirstUnlock`
    - Android: EncryptedSharedPreferences or Keystore

- **Automatic Document Vectorization** - Documents are now automatically vectorized when uploaded
  - New `embedding_status` column on `documents` table tracks vectorization progress
  - Possible values: `pending`, `processing`, `completed`, `failed`
  - The `extract-document-content` edge function now automatically triggers `generate-embeddings`
  - Failed documents can be retried from the Documents UI
  - Query embedding status directly:
    ```typescript
    const { data } = await supabase
      .from('documents')
      .select('id, title, embedding_status')
      .eq('embedding_status', 'failed'); // Find failed documents
    ```

- **Vector Search for Document AI** - Documents are now vectorized for semantic search
  - New `document_chunks` table stores embeddings for document content
  - `document-chat` edge function now uses vector similarity search
  - Only relevant document chunks are sent to AI (reduces token usage significantly)
  - New edge functions:
    - `generate-embeddings` - Vectorize a single document
    - `batch-generate-embeddings` - Vectorize all documents
  - **`has_embeddings` field** - Documents now include a boolean `has_embeddings` indicating vectorization status
  - To check vectorization status: query `document_chunks` table for the document ID

### December 2025

- **User Detail Sheet** - New comprehensive admin view for user management
  - Shows email, phone, unit details
  - Login history with device/browser/IP
  - Inline role toggling (Admin/Owner/Board)
  - Password reset with visible password option
  - Copy-to-clipboard for temporary passwords

- **Login Tracking** - `track-login` edge function now properly tracks:
  - Browser/app name
  - Device type
  - IP address
  - Timestamp

---

## Document AI (Ask the Chicken)

The document AI assistant uses vector search to find relevant document content:

```typescript
// Call the document chat edge function
const response = await fetch(`${SUPABASE_URL}/functions/v1/document-chat`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'What are the lanai rules?' }
    ]
  })
});

// Stream the response (SSE format)
const reader = response.body.getReader();
// Process SSE stream...
```

The AI will:
1. Convert the user's question to a vector embedding
2. Search `document_chunks` for similar content
3. Include only relevant chunks in the AI prompt
4. Return a focused, accurate response

---

## Questions?

For backend changes or API questions, coordinate with the web app team to ensure compatibility.
