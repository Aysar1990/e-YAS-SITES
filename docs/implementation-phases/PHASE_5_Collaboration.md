# 🤝 **PHASE 5 - Collaboration Features**

## 📋 **نظرة عامة**

**الهدف:** إضافة ميزات التعاون الجماعي للـ SpreadsheetView  
**الوقت المقدر:** 3-4 أيام (بدل 7 أيام)  
**التوفير:** 43%

---

## ✨ **الميزات (3)**

1. ✅ **Activity Feed** - سجل الأنشطة والتغييرات
2. ✅ **Multi-User Presence** - من موجود online
3. ✅ **Comments & Mentions** - تعليقات مع @mentions

---

## 🎯 **استراتيجية التوفير**

### **المكتبات المستخدمة:**
```bash
✅ react-mentions           # للـ @username
✅ Firebase Firestore       # للـ comments & activities
✅ Firebase Realtime DB     # للـ presence
```

### **Components المعاد استخدامها:**
```javascript
✅ QuickStatsWidget (Phase 1)  → Activity Feed layout
✅ Modal System (Phase 3)      → Comments panel
✅ HistoryPanel (Phase 3)      → Activity timeline
```

### **MVP Approach:**
- Activity Feed: قائمة بسيطة (فلترة لاحقاً)
- Presence: أسماء فقط (avatars لاحقاً)
- Comments: نص بسيط (rich text لاحقاً)

---

## 📦 **Feature 1: Activity Feed**

### **الوصف:**
Timeline يعرض جميع التغييرات والأنشطة على المواقع في real-time.

### **المكونات:**

#### **1. Firebase Collection Structure:**
```javascript
// src/services/firebase/collections.js
import { collection } from 'firebase/firestore';
import { db } from './firebase';

export const activitiesRef = collection(db, 'activities');

// Activity Document Structure:
{
  id: "activity_123",
  type: "status_change" | "comment" | "edit" | "bulk_edit",
  siteId: "AM001",
  siteName: "Amman Tower",
  userId: "user123",
  userName: "Ahmad Ali",
  timestamp: Timestamp,
  details: {
    field: "tssr_status",
    oldValue: "Pending",
    newValue: "Approved"
  }
}
```

#### **2. ActivityFeed Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/ActivityFeed/ActivityFeed.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { activitiesRef } from '../../../../services/firebase/collections';
import ActivityItem from './ActivityItem';
import './ActivityFeed.css';

const ActivityFeed = ({ isOpen, onClose }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener
    const q = query(
      activitiesRef,
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const acts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(acts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="activity-feed-overlay" onClick={onClose}>
      <div 
        className="activity-feed-panel" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="activity-feed-header">
          <h3>📋 سجل الأنشطة</h3>
          <button 
            className="close-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="activity-feed-content">
          {loading ? (
            <div className="activity-loading">
              <div className="spinner"></div>
              <p>جاري التحميل...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="activity-empty">
              <p>لا توجد أنشطة بعد</p>
            </div>
          ) : (
            <div className="activity-list">
              {activities.map(activity => (
                <ActivityItem 
                  key={activity.id} 
                  activity={activity} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;
```

#### **3. ActivityItem Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/ActivityFeed/ActivityItem.jsx`

```javascript
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const ActivityItem = ({ activity }) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'status_change': return '🔄';
      case 'comment': return '💬';
      case 'edit': return '✏️';
      case 'bulk_edit': return '📝';
      default: return '📌';
    }
  };

  const getMessage = () => {
    const { type, details, userName, siteName } = activity;

    switch (type) {
      case 'status_change':
        return (
          <>
            <strong>{userName}</strong> غيّر حالة{' '}
            <span className="site-name">{siteName}</span>
            {' '}من{' '}
            <span className="old-value">{details.oldValue}</span>
            {' '}إلى{' '}
            <span className="new-value">{details.newValue}</span>
          </>
        );
      case 'comment':
        return (
          <>
            <strong>{userName}</strong> علّق على{' '}
            <span className="site-name">{siteName}</span>
          </>
        );
      case 'edit':
        return (
          <>
            <strong>{userName}</strong> عدّل{' '}
            <span className="field-name">{details.field}</span>
            {' '}في{' '}
            <span className="site-name">{siteName}</span>
          </>
        );
      case 'bulk_edit':
        return (
          <>
            <strong>{userName}</strong> قام بتعديل جماعي على{' '}
            <span className="count">{details.count}</span> موقع
          </>
        );
      default:
        return <>{userName} قام بنشاط</>;
    }
  };

  const getTimeAgo = () => {
    if (!activity.timestamp) return 'الآن';
    
    const date = activity.timestamp.toDate();
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: ar 
    });
  };

  return (
    <div className="activity-item">
      <div className="activity-icon">{getIcon()}</div>
      <div className="activity-content">
        <div className="activity-message">{getMessage()}</div>
        <div className="activity-time">{getTimeAgo()}</div>
      </div>
    </div>
  );
};

export default ActivityItem;
```

#### **4. CSS Styling:**

**File:** `src/pages/Admin/SpreadsheetView/components/ActivityFeed/ActivityFeed.css`

```css
/* Activity Feed Overlay */
.activity-feed-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

.activity-feed-panel {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

/* Header */
.activity-feed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.activity-feed-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: #f5f5f5;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  color: #666;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e0e0e0;
  color: #333;
}

/* Content */
.activity-feed-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Activity Item */
.activity-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 3px solid #8FD9D9;
  transition: all 0.2s;
}

.activity-item:hover {
  background: #f0f0f0;
  border-left-color: #FF8566;
}

.activity-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-message {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 4px;
}

.activity-message strong {
  color: #8FD9D9;
  font-weight: 600;
}

.activity-message .site-name {
  color: #FF8566;
  font-weight: 500;
}

.activity-message .old-value {
  text-decoration: line-through;
  color: #999;
}

.activity-message .new-value {
  color: #4CAF50;
  font-weight: 500;
}

.activity-message .field-name,
.activity-message .count {
  color: #8FD9D9;
  font-weight: 500;
}

.activity-time {
  font-size: 12px;
  color: #999;
}

/* Loading */
.activity-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #999;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #8FD9D9;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Empty State */
.activity-empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

#### **5. Integration in SpreadsheetView:**

```javascript
// src/pages/Admin/SpreadsheetView/SpreadsheetView.jsx

import ActivityFeed from './components/ActivityFeed/ActivityFeed';

const SpreadsheetView = () => {
  const [showActivityFeed, setShowActivityFeed] = useState(false);

  return (
    <div className="spreadsheet-view">
      {/* Toolbar */}
      <div className="toolbar">
        {/* ... other buttons ... */}
        
        <button 
          className="toolbar-btn"
          onClick={() => setShowActivityFeed(true)}
          title="سجل الأنشطة"
        >
          📋 الأنشطة
        </button>
      </div>

      {/* Activity Feed */}
      <ActivityFeed 
        isOpen={showActivityFeed}
        onClose={() => setShowActivityFeed(false)}
      />
    </div>
  );
};
```

---

## 📦 **Feature 2: Multi-User Presence**

### **الوصف:**
عرض المستخدمين المتصلين حالياً في real-time.

### **المكونات:**

#### **1. Firebase Realtime Database Setup:**

```javascript
// src/services/firebase/presence.js
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { rtdb } from './firebase';

export class PresenceService {
  constructor(userId, userName) {
    this.userId = userId;
    this.userName = userName;
    this.presenceRef = ref(rtdb, `presence/${userId}`);
  }

  // Set user online
  goOnline() {
    const userStatus = {
      name: this.userName,
      status: 'online',
      lastSeen: serverTimestamp(),
      currentSite: null
    };

    set(this.presenceRef, userStatus);

    // Auto offline on disconnect
    onDisconnect(this.presenceRef).set({
      ...userStatus,
      status: 'offline',
      lastSeen: serverTimestamp()
    });
  }

  // Set current site user is viewing
  setCurrentSite(siteId) {
    set(ref(rtdb, `presence/${this.userId}/currentSite`), siteId);
  }

  // Listen to all online users
  listenToUsers(callback) {
    const presenceRef = ref(rtdb, 'presence');
    return onValue(presenceRef, (snapshot) => {
      const users = [];
      snapshot.forEach((childSnapshot) => {
        const user = {
          id: childSnapshot.key,
          ...childSnapshot.val()
        };
        if (user.status === 'online') {
          users.push(user);
        }
      });
      callback(users);
    });
  }
}
```

#### **2. OnlineUsers Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/UserPresence/OnlineUsers.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { PresenceService } from '../../../../services/firebase/presence';
import UserAvatar from './UserAvatar';
import './UserPresence.css';

const OnlineUsers = ({ currentUser }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [presenceService, setPresenceService] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    // Initialize presence
    const service = new PresenceService(
      currentUser.uid,
      currentUser.displayName || currentUser.email
    );
    service.goOnline();
    setPresenceService(service);

    // Listen to other users
    const unsubscribe = service.listenToUsers((users) => {
      // Filter out current user
      const others = users.filter(u => u.id !== currentUser.uid);
      setOnlineUsers(others);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  if (onlineUsers.length === 0) {
    return null; // Hide if no one online
  }

  return (
    <div className="online-users">
      <div className="online-users-label">
        <span className="online-dot"></span>
        {onlineUsers.length} متصل
      </div>
      
      <div className="online-users-list">
        {onlineUsers.map(user => (
          <UserAvatar 
            key={user.id}
            user={user}
          />
        ))}
      </div>
    </div>
  );
};

export default OnlineUsers;
```

#### **3. UserAvatar Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/UserPresence/UserAvatar.jsx`

```javascript
import React from 'react';

const UserAvatar = ({ user }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name[0];
  };

  const getColor = (name) => {
    // Generate color based on name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 60%, 55%)`;
  };

  return (
    <div 
      className="user-avatar"
      style={{ backgroundColor: getColor(user.name) }}
      title={user.name}
    >
      {getInitials(user.name)}
      {user.currentSite && (
        <div className="avatar-badge" title={`يعمل على ${user.currentSite}`}>
          📍
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
```

#### **4. CSS Styling:**

**File:** `src/pages/Admin/SpreadsheetView/components/UserPresence/UserPresence.css`

```css
/* Online Users */
.online-users {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.online-users-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.online-dot {
  width: 8px;
  height: 8px;
  background: #4CAF50;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.online-users-list {
  display: flex;
  gap: 6px;
}

/* User Avatar */
.user-avatar {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-avatar:hover {
  transform: scale(1.1);
}

.avatar-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

---

## 📦 **Feature 3: Comments & Mentions**

### **الوصف:**
نظام تعليقات مع دعم @mentions للمستخدمين.

### **المكتبة:**
```bash
react-mentions  # مثبتة ✅
```

### **المكونات:**

#### **1. CommentsPanel Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/Comments/CommentsPanel.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../../../services/firebase/firebase';
import CommentItem from './CommentItem';
import MentionInput from './MentionInput';
import './Comments.css';

const CommentsPanel = ({ siteId, siteName, currentUser, allUsers }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) {
      setLoading(false);
      return;
    }

    // Real-time comments listener
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('siteId', '==', siteId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cmts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(cmts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [siteId]);

  const handleSubmit = async () => {
    if (!newComment.trim() || !siteId) return;

    try {
      // Extract mentions
      const mentions = [];
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      while ((match = mentionRegex.exec(newComment)) !== null) {
        mentions.push(match[2]); // user ID
      }

      // Add comment to Firestore
      await addDoc(collection(db, 'comments'), {
        siteId,
        siteName,
        text: newComment,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        mentions,
        timestamp: serverTimestamp(),
        edited: false
      });

      // Add activity log
      await addDoc(collection(db, 'activities'), {
        type: 'comment',
        siteId,
        siteName,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        timestamp: serverTimestamp(),
        details: {
          preview: newComment.substring(0, 50)
        }
      });

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('فشل إضافة التعليق');
    }
  };

  return (
    <div className="comments-panel">
      <div className="comments-header">
        <h4>💬 التعليقات</h4>
        <span className="comments-count">{comments.length}</span>
      </div>

      <div className="comments-list">
        {loading ? (
          <div className="comments-loading">جاري التحميل...</div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">
            لا توجد تعليقات. كن أول من يعلق!
          </div>
        ) : (
          comments.map(comment => (
            <CommentItem 
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
            />
          ))
        )}
      </div>

      <div className="comments-input">
        <MentionInput 
          value={newComment}
          onChange={setNewComment}
          onSubmit={handleSubmit}
          users={allUsers}
          placeholder="أضف تعليقاً... (اكتب @ لذكر مستخدم)"
        />
      </div>
    </div>
  );
};

export default CommentsPanel;
```

#### **2. CommentItem Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/Comments/CommentItem.jsx`

```javascript
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const CommentItem = ({ comment, currentUser }) => {
  const isOwn = comment.userId === currentUser?.uid;

  const getTimeAgo = () => {
    if (!comment.timestamp) return 'الآن';
    const date = comment.timestamp.toDate();
    return formatDistanceToNow(date, { addSuffix: true, locale: ar });
  };

  const renderText = () => {
    // Replace mention syntax with styled spans
    let text = comment.text;
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add mention
      parts.push(
        <span key={match.index} className="mention">
          @{match[1]}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className={`comment-item ${isOwn ? 'own' : ''}`}>
      <div className="comment-avatar">
        {comment.userName?.[0]?.toUpperCase() || '?'}
      </div>
      
      <div className="comment-content">
        <div className="comment-header">
          <strong className="comment-author">{comment.userName}</strong>
          <span className="comment-time">{getTimeAgo()}</span>
        </div>
        
        <div className="comment-text">
          {renderText()}
        </div>
        
        {comment.edited && (
          <span className="comment-edited">(معدّل)</span>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
```

#### **3. MentionInput Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/Comments/MentionInput.jsx`

```javascript
import React from 'react';
import { MentionsInput, Mention } from 'react-mentions';

const MentionInput = ({ value, onChange, onSubmit, users, placeholder }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const mentionStyle = {
    control: {
      fontSize: 14,
      fontWeight: 'normal',
      minHeight: 60,
    },
    '&multiLine': {
      control: {
        fontFamily: 'inherit',
        minHeight: 60,
      },
      highlighter: {
        padding: 12,
        border: '1px solid transparent',
      },
      input: {
        padding: 12,
        border: '1px solid #ddd',
        borderRadius: 8,
        outline: 'none',
      },
    },
    suggestions: {
      list: {
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: 8,
        fontSize: 14,
        maxHeight: 200,
        overflow: 'auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      },
      item: {
        padding: '8px 12px',
        borderBottom: '1px solid #f0f0f0',
        '&focused': {
          backgroundColor: '#f9f9f9',
        },
      },
    },
  };

  const mentionDisplayStyle = {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
    borderRadius: 4,
    padding: '2px 4px',
  };

  return (
    <div className="mention-input-wrapper">
      <MentionsInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        style={mentionStyle}
        className="mention-input"
      >
        <Mention
          trigger="@"
          data={users.map(user => ({
            id: user.id,
            display: user.name
          }))}
          style={mentionDisplayStyle}
          renderSuggestion={(suggestion) => (
            <div className="mention-suggestion">
              <div className="mention-avatar">
                {suggestion.display[0]?.toUpperCase()}
              </div>
              <span>{suggestion.display}</span>
            </div>
          )}
        />
      </MentionsInput>
      
      <button 
        className="send-btn"
        onClick={onSubmit}
        disabled={!value.trim()}
      >
        ➤
      </button>
    </div>
  );
};

export default MentionInput;
```

#### **4. CSS Styling:**

**File:** `src/pages/Admin/SpreadsheetView/components/Comments/Comments.css`

```css
/* Comments Panel */
.comments-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.comments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f9f9f9;
}

.comments-header h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.comments-count {
  background: #8FD9D9;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

/* Comments List */
.comments-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.comments-loading,
.comments-empty {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

/* Comment Item */
.comment-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  animation: slideIn 0.3s ease;
}

.comment-item.own .comment-content {
  background: #E3F2FD;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #8FD9D9;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  background: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.comment-author {
  font-size: 14px;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  color: #555;
  line-height: 1.5;
  word-wrap: break-word;
}

.comment-text .mention {
  background: #8FD9D9;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.comment-edited {
  font-size: 11px;
  color: #999;
  font-style: italic;
  margin-top: 4px;
  display: inline-block;
}

/* Mention Input */
.comments-input {
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}

.mention-input-wrapper {
  position: relative;
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.mention-input {
  flex: 1;
}

.send-btn {
  width: 44px;
  height: 44px;
  background: #8FD9D9;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: #7CCACA;
  transform: scale(1.05);
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Mention Suggestions */
.mention-suggestion {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mention-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #8FD9D9;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

/* Animations */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

---

## 🔗 **Integration in SpreadsheetView**

```javascript
// src/pages/Admin/SpreadsheetView/SpreadsheetView.jsx

import { useState, useEffect } from 'react';
import ActivityFeed from './components/ActivityFeed/ActivityFeed';
import OnlineUsers from './components/UserPresence/OnlineUsers';
import CommentsPanel from './components/Comments/CommentsPanel';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';

const SpreadsheetView = () => {
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const currentUser = { 
    uid: 'user123', 
    displayName: 'Ahmad Ali',
    email: 'ahmad@zain.jo'
  }; // Replace with real auth

  // Load all users for mentions
  useEffect(() => {
    const loadUsers = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllUsers(users);
    };
    loadUsers();
  }, []);

  return (
    <div className="spreadsheet-view">
      {/* Toolbar */}
      <div className="toolbar">
        <OnlineUsers currentUser={currentUser} />
        
        <button 
          className="toolbar-btn"
          onClick={() => setShowActivityFeed(true)}
        >
          📋 الأنشطة
        </button>
        
        <button 
          className="toolbar-btn"
          onClick={() => setShowComments(true)}
          disabled={!selectedSite}
        >
          💬 التعليقات
        </button>
      </div>

      {/* AG Grid */}
      <AgGridReact
        onRowClicked={(e) => setSelectedSite(e.data)}
        // ... other props
      />

      {/* Activity Feed */}
      <ActivityFeed 
        isOpen={showActivityFeed}
        onClose={() => setShowActivityFeed(false)}
      />

      {/* Comments Panel */}
      {showComments && selectedSite && (
        <div className="side-panel">
          <CommentsPanel 
            siteId={selectedSite.site_id}
            siteName={selectedSite.final_site_name}
            currentUser={currentUser}
            allUsers={allUsers}
          />
          <button 
            className="close-panel"
            onClick={() => setShowComments(false)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## ✅ **Testing Checklist**

### **Activity Feed:**
- [ ] يظهر الـ feed عند الضغط على زر "الأنشطة"
- [ ] التحديثات real-time (افتح 2 tabs)
- [ ] الأنشطة مرتبة من الأحدث للأقدم
- [ ] الأيقونات صحيحة لكل نوع نشاط
- [ ] الوقت يظهر بالعربي (منذ 5 دقائق)

### **Multi-User Presence:**
- [ ] المستخدم يظهر online عند الدخول
- [ ] العدد يتحدث real-time
- [ ] Avatars تظهر بألوان مختلفة
- [ ] الـ tooltip يظهر اسم المستخدم
- [ ] المستخدم يختفي عند الخروج

### **Comments:**
- [ ] التعليقات تُحفظ في Firebase
- [ ] Real-time updates (tab ثاني)
- [ ] @mentions تشتغل (اكتب @ ثم اسم)
- [ ] التعليقات مرتبطة بالموقع الصحيح
- [ ] الـ textarea يدعم Enter (سطر جديد) و Ctrl+Enter (إرسال)

---

## 🎯 **Claude Code Prompt**

```
أنشئ ميزات Collaboration للـ SpreadsheetView:

1. Activity Feed - سجل الأنشطة مع real-time updates
2. Multi-User Presence - عرض المستخدمين المتصلين
3. Comments & Mentions - نظام تعليقات مع @mentions

استخدم:
- Firebase Firestore للـ comments & activities
- Firebase Realtime Database للـ presence
- react-mentions للـ @username

المكونات المطلوبة:
- ActivityFeed.jsx + ActivityItem.jsx
- OnlineUsers.jsx + UserAvatar.jsx
- CommentsPanel.jsx + CommentItem.jsx + MentionInput.jsx
- CSS files for each

المواصفات:
- YAS colors (#8FD9D9, #FF8566)
- Arabic UI
- Real-time sync
- Mobile responsive
- Smooth animations

راجع الملف PHASE_5_Collaboration.md للتفاصيل الكاملة.
```

---

**Next:** `PHASE_6_Data_Management.md` 📊
