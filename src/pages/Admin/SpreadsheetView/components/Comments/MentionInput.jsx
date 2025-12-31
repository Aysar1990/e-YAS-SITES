/**
 * Mention Input Component
 * Text input with @mentions autocomplete
 * PHASE 5: Collaboration Features
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'

const MentionInput = ({
  users = [],
  onSubmit,
  disabled = false,
  placeholder = 'اكتب تعليقاً...'
}) => {
  const [text, setText] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionQuery, setSuggestionQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const inputRef = useRef(null)

  // Filter users based on query
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(suggestionQuery.toLowerCase())
  ).slice(0, 5)

  // Check for @ mention trigger
  const checkForMention = useCallback((value, position) => {
    // Find the @ symbol before cursor
    const textBeforeCursor = value.substring(0, position)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex === -1) {
      setShowSuggestions(false)
      return
    }

    // Check if there's a space after @ (completed mention)
    const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
    if (textAfterAt.includes(' ')) {
      setShowSuggestions(false)
      return
    }

    // Show suggestions
    setSuggestionQuery(textAfterAt)
    setShowSuggestions(true)
    setSelectedIndex(0)
  }, [])

  // Handle input change
  const handleChange = useCallback((e) => {
    const value = e.target.value
    const position = e.target.selectionStart
    setText(value)
    setCursorPosition(position)
    checkForMention(value, position)
  }, [checkForMention])

  // Handle key down
  const handleKeyDown = useCallback((e) => {
    if (showSuggestions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredUsers.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        selectUser(filteredUsers[selectedIndex])
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [showSuggestions, filteredUsers, selectedIndex])

  // Select a user from suggestions
  const selectUser = useCallback((user) => {
    if (!user) return

    // Find and replace the @query with @username
    const textBeforeCursor = text.substring(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    const textAfterQuery = text.substring(cursorPosition)

    const newText = text.substring(0, lastAtIndex) + `@${user.name} ` + textAfterQuery
    setText(newText)
    setShowSuggestions(false)

    // Focus back on input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        const newPosition = lastAtIndex + user.name.length + 2
        inputRef.current.setSelectionRange(newPosition, newPosition)
      }
    }, 0)
  }, [text, cursorPosition])

  // Extract mentions from text
  const extractMentions = useCallback((text) => {
    const mentionPattern = /@(\w+)/g
    const mentions = []
    let match

    while ((match = mentionPattern.exec(text)) !== null) {
      const mentionName = match[1]
      const user = users.find(u => u.name === mentionName)
      if (user) {
        mentions.push(user.id)
      }
    }

    return mentions
  }, [users])

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!text.trim() || disabled) return

    const mentions = extractMentions(text)
    onSubmit(text.trim(), mentions)
    setText('')
    setShowSuggestions(false)
  }, [text, disabled, onSubmit, extractMentions])

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="mention-input-container">
      <div className="input-wrapper">
        <textarea
          ref={inputRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="mention-textarea"
          rows={1}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          className="send-button"
          title="إرسال"
        >
          ➤
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredUsers.length > 0 && (
        <div className="mention-suggestions">
          {filteredUsers.map((user, index) => (
            <div
              key={user.id}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => selectUser(user)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="suggestion-avatar">
                {user.name?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="suggestion-name">{user.name}</span>
              {user.status === 'online' && (
                <span className="online-dot"></span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No users hint */}
      {showSuggestions && filteredUsers.length === 0 && suggestionQuery && (
        <div className="mention-suggestions">
          <div className="no-suggestions">
            لا يوجد مستخدمين بهذا الاسم
          </div>
        </div>
      )}
    </div>
  )
}

export default MentionInput
