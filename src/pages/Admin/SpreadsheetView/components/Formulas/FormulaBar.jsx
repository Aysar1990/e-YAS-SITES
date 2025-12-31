/**
 * FormulaBar - Excel-like formula input bar
 * Phase 8: Power Features
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { FormulaEngine, AVAILABLE_FUNCTIONS } from './formulas'
import './Formulas.css'

const FormulaBar = ({
  data = [],
  selectedCell,
  onApplyFormula,
  onClose
}) => {
  const [formula, setFormula] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)
  const engineRef = useRef(new FormulaEngine())

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Update engine data
  useEffect(() => {
    engineRef.current.setData(data)
  }, [data])

  // Evaluate formula on change
  const evaluateFormula = useCallback((formulaStr) => {
    if (!formulaStr || !formulaStr.startsWith('=')) {
      setResult(null)
      setError(null)
      return
    }

    try {
      const evalResult = engineRef.current.evaluate(formulaStr)
      setResult(evalResult)
      setError(null)
    } catch (err) {
      setResult(null)
      setError(err.message)
    }
  }, [])

  // Handle formula input change
  const handleFormulaChange = (e) => {
    const value = e.target.value
    setFormula(value)

    // Show suggestions if typing function name
    if (value.startsWith('=') && value.length > 1) {
      setShowSuggestions(true)
      evaluateFormula(value)
    } else {
      setShowSuggestions(false)
      setResult(null)
      setError(null)
    }
  }

  // Apply formula
  const handleApply = () => {
    if (!formula.startsWith('=')) {
      setError('يجب أن تبدأ المعادلة بـ =')
      return
    }

    if (error) {
      return
    }

    if (result !== null && onApplyFormula) {
      onApplyFormula({
        formula,
        result,
        cell: selectedCell
      })
      setFormula('')
      setResult(null)
    }
  }

  // Insert function
  const insertFunction = (funcName) => {
    const newFormula = `=${funcName}(`
    setFormula(newFormula)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  // Handle key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleApply()
    } else if (e.key === 'Escape') {
      onClose?.()
    }
  }

  // Filter suggestions based on input
  const filteredFunctions = formula.startsWith('=')
    ? AVAILABLE_FUNCTIONS.filter(fn =>
        fn.name.toLowerCase().includes(formula.slice(1).toLowerCase().split('(')[0])
      )
    : []

  return (
    <div className="formula-bar">
      {/* Formula Icon */}
      <div className="formula-icon">
        <span>ƒx</span>
      </div>

      {/* Cell Reference */}
      {selectedCell && (
        <div className="cell-reference">
          {selectedCell.field}
        </div>
      )}

      {/* Formula Input */}
      <div className="formula-input-container">
        <input
          ref={inputRef}
          type="text"
          className={`formula-input ${error ? 'has-error' : ''}`}
          value={formula}
          onChange={handleFormulaChange}
          onKeyDown={handleKeyDown}
          placeholder="=SUM(field) أو =AVG(field)"
          dir="ltr"
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredFunctions.length > 0 && (
          <div className="formula-suggestions">
            {filteredFunctions.map((fn, idx) => (
              <button
                key={idx}
                className="suggestion-item"
                onClick={() => insertFunction(fn.name)}
              >
                <span className="fn-name">{fn.name}</span>
                <span className="fn-syntax">{fn.syntax}</span>
                <span className="fn-desc">{fn.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result/Error Display */}
      {(result !== null || error) && (
        <div className={`formula-result ${error ? 'error' : ''}`}>
          {error ? (
            <span className="error-text">⚠️ {error}</span>
          ) : (
            <span className="result-text">= {result}</span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="formula-actions">
        <button
          className="btn-apply"
          onClick={handleApply}
          disabled={!result || error}
        >
          ✓ تطبيق
        </button>
        <button
          className="btn-cancel"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Help Text */}
      <div className="formula-help">
        <span>المعادلات: SUM, AVG, COUNT, MAX, MIN, IF, ROUND</span>
      </div>
    </div>
  )
}

export default FormulaBar
