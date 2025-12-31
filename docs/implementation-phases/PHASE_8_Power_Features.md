# ⚡ **PHASE 8 - Power Features**

## 📋 **نظرة عامة**

**الهدف:** إضافة ميزات متقدمة للمستخدمين المحترفين  
**الوقت المقدر:** 3-4 أيام (بدل 6 أيام)  
**التوفير:** 50%

---

## ✨ **الميزات (3)**

1. ✅ **Keyboard Shortcuts Hub** - مركز الاختصارات
2. ✅ **Custom Formulas** - معادلات مخصصة
3. ✅ **Macros / Automation** - أتمتة المهام

---

## 🎯 **استراتيجية التوفير**

### **المكتبات المستخدمة:**
```bash
✅ react-hotkeys-hook       # مثبتة ✅
```

### **MVP Approach:**
- Shortcuts: 10 اختصارات أساسية فقط
- Formulas: عمليات حسابية بسيطة (SUM, AVG, COUNT)
- Macros: Record/Replay بسيط

---

## 📦 **Feature 1: Keyboard Shortcuts Hub**

### **الوصف:**
نظام شامل لاختصارات لوحة المفاتيح مع مساعد تفاعلي.

### **المكونات:**

#### **1. ShortcutsHub Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/Shortcuts/ShortcutsHub.jsx`

```javascript
import React, { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import './Shortcuts.css';

const ShortcutsHub = ({ isOpen, onClose, actions }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const shortcuts = [
    {
      id: 'save',
      keys: 'Ctrl+S',
      description: 'حفظ التغييرات',
      category: 'General',
      action: actions.save
    },
    {
      id: 'search',
      keys: 'Ctrl+F',
      description: 'فتح البحث',
      category: 'Navigation',
      action: actions.search
    },
    {
      id: 'export',
      keys: 'Ctrl+E',
      description: 'تصدير البيانات',
      category: 'Data',
      action: actions.export
    },
    {
      id: 'refresh',
      keys: 'F5',
      description: 'تحديث البيانات',
      category: 'General',
      action: actions.refresh
    },
    {
      id: 'select_all',
      keys: 'Ctrl+A',
      description: 'تحديد الكل',
      category: 'Selection',
      action: actions.selectAll
    },
    {
      id: 'copy',
      keys: 'Ctrl+C',
      description: 'نسخ',
      category: 'Clipboard',
      action: actions.copy
    },
    {
      id: 'paste',
      keys: 'Ctrl+V',
      description: 'لصق',
      category: 'Clipboard',
      action: actions.paste
    },
    {
      id: 'undo',
      keys: 'Ctrl+Z',
      description: 'تراجع',
      category: 'Edit',
      action: actions.undo
    },
    {
      id: 'redo',
      keys: 'Ctrl+Y',
      description: 'إعادة',
      category: 'Edit',
      action: actions.redo
    },
    {
      id: 'help',
      keys: '?',
      description: 'عرض المساعدة',
      category: 'Help',
      action: () => {}
    }
  ];

  const categories = [...new Set(shortcuts.map(s => s.category))];

  const filteredShortcuts = searchTerm
    ? shortcuts.filter(s =>
        s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.keys.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : shortcuts;

  const groupedShortcuts = categories.reduce((acc, category) => {
    acc[category] = filteredShortcuts.filter(s => s.category === category);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-hub" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⌨️ اختصارات لوحة المفاتيح</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="shortcuts-search">
          <input
            type="text"
            placeholder="ابحث عن اختصار..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            autoFocus
          />
        </div>

        <div className="shortcuts-content">
          {Object.entries(groupedShortcuts).map(([category, items]) => {
            if (items.length === 0) return null;
            
            return (
              <div key={category} className="shortcuts-category">
                <h4 className="category-title">{category}</h4>
                <div className="shortcuts-list">
                  {items.map(shortcut => (
                    <div key={shortcut.id} className="shortcut-item">
                      <span className="shortcut-description">
                        {shortcut.description}
                      </span>
                      <kbd className="shortcut-keys">{shortcut.keys}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredShortcuts.length === 0 && (
            <div className="no-results">
              لا توجد نتائج لـ "{searchTerm}"
            </div>
          )}
        </div>

        <div className="shortcuts-footer">
          <p className="tip">
            💡 اضغط <kbd>?</kbd> في أي وقت لفتح هذه القائمة
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsHub;
```

#### **2. useShortcuts Hook:**

**File:** `src/pages/Admin/SpreadsheetView/hooks/useShortcuts.js`

```javascript
import { useHotkeys } from 'react-hotkeys-hook';

export const useShortcuts = (actions) => {
  // Save
  useHotkeys('ctrl+s', (e) => {
    e.preventDefault();
    actions.save?.();
  });

  // Search
  useHotkeys('ctrl+f', (e) => {
    e.preventDefault();
    actions.search?.();
  });

  // Export
  useHotkeys('ctrl+e', (e) => {
    e.preventDefault();
    actions.export?.();
  });

  // Refresh
  useHotkeys('f5', (e) => {
    e.preventDefault();
    actions.refresh?.();
  });

  // Select All
  useHotkeys('ctrl+a', (e) => {
    e.preventDefault();
    actions.selectAll?.();
  });

  // Copy
  useHotkeys('ctrl+c', (e) => {
    // Let browser handle if there's a selection
    if (window.getSelection().toString()) return;
    e.preventDefault();
    actions.copy?.();
  });

  // Paste
  useHotkeys('ctrl+v', (e) => {
    e.preventDefault();
    actions.paste?.();
  });

  // Undo
  useHotkeys('ctrl+z', (e) => {
    e.preventDefault();
    actions.undo?.();
  });

  // Redo
  useHotkeys('ctrl+y', (e) => {
    e.preventDefault();
    actions.redo?.();
  });

  // Help
  useHotkeys('shift+?', (e) => {
    e.preventDefault();
    actions.help?.();
  });
};
```

#### **3. Integration in SpreadsheetView:**

```javascript
// src/pages/Admin/SpreadsheetView/SpreadsheetView.jsx

import { useState } from 'react';
import ShortcutsHub from './components/Shortcuts/ShortcutsHub';
import { useShortcuts } from './hooks/useShortcuts';

const SpreadsheetView = () => {
  const [showShortcuts, setShowShortcuts] = useState(false);

  const shortcutActions = {
    save: () => {
      console.log('Saving...');
      // Implement save logic
    },
    search: () => {
      console.log('Opening search...');
      // Open search bar
    },
    export: () => {
      console.log('Exporting...');
      // Open export modal
    },
    refresh: () => {
      console.log('Refreshing...');
      // Reload data
    },
    selectAll: () => {
      console.log('Select all...');
      gridRef.current?.api?.selectAll();
    },
    copy: () => {
      console.log('Copying...');
      // Copy selected cells
    },
    paste: () => {
      console.log('Pasting...');
      // Paste clipboard data
    },
    undo: () => {
      console.log('Undo...');
      // Undo last action
    },
    redo: () => {
      console.log('Redo...');
      // Redo last undone action
    },
    help: () => {
      setShowShortcuts(true);
    }
  };

  // Register shortcuts
  useShortcuts(shortcutActions);

  return (
    <div className="spreadsheet-view">
      {/* ... other components ... */}

      <ShortcutsHub
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        actions={shortcutActions}
      />
    </div>
  );
};
```

#### **4. CSS Styling:**

**File:** `src/pages/Admin/SpreadsheetView/components/Shortcuts/Shortcuts.css`

```css
/* Shortcuts Hub */
.shortcuts-hub {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

/* Search */
.shortcuts-search {
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.search-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
}

.search-input:focus {
  outline: none;
  border-color: #8FD9D9;
  box-shadow: 0 0 0 3px rgba(143, 217, 217, 0.1);
}

/* Content */
.shortcuts-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.shortcuts-category {
  margin-bottom: 24px;
}

.category-title {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f9f9f9;
  border-radius: 6px;
  transition: all 0.2s;
}

.shortcut-item:hover {
  background: #f0f0f0;
}

.shortcut-description {
  font-size: 14px;
  color: #555;
}

.shortcut-keys {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  color: #333;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

kbd {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  color: #333;
  font-weight: 600;
  display: inline-block;
}

/* No Results */
.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

/* Footer */
.shortcuts-footer {
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: #f9f9f9;
}

.tip {
  margin: 0;
  font-size: 13px;
  color: #666;
  text-align: center;
}
```

---

## 📦 **Feature 2: Custom Formulas**

### **الوصف:**
نظام لإنشاء وتنفيذ معادلات حسابية مخصصة على البيانات.

### **المكونات:**

#### **1. FormulaBar Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/Formulas/FormulaBar.jsx`

```javascript
import React, { useState } from 'react';
import FormulaEditor from './FormulaEditor';
import { FormulaEngine } from '../../utils/formulas';
import './Formulas.css';

const FormulaBar = ({ selectedCell, onApply }) => {
  const [formula, setFormula] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [result, setResult] = useState(null);

  const engine = new FormulaEngine();

  const handleCalculate = () => {
    try {
      const value = engine.evaluate(formula);
      setResult(value);
      onApply?.(value);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  return (
    <div className="formula-bar">
      <div className="formula-input-container">
        <span className="formula-label">=</span>
        <input
          type="text"
          className="formula-input"
          placeholder="أدخل معادلة (مثال: SUM(A1:A10))"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleCalculate();
          }}
        />
        <button 
          className="formula-btn"
          onClick={handleCalculate}
          title="تنفيذ"
        >
          ▶
        </button>
        <button 
          className="formula-btn"
          onClick={() => setShowEditor(!showEditor)}
          title="محرر متقدم"
        >
          🔧
        </button>
      </div>

      {result !== null && (
        <div className="formula-result">
          النتيجة: <strong>{result}</strong>
        </div>
      )}

      {showEditor && (
        <FormulaEditor
          formula={formula}
          onChange={setFormula}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
};

export default FormulaBar;
```

#### **2. FormulaEngine Utility:**

**File:** `src/pages/Admin/SpreadsheetView/utils/formulas.js`

```javascript
// Formula Engine - MVP Version
export class FormulaEngine {
  constructor() {
    this.functions = {
      SUM: this.sum,
      AVG: this.average,
      COUNT: this.count,
      MAX: this.max,
      MIN: this.min,
      IF: this.ifCondition,
      ROUND: this.round
    };
  }

  evaluate(formula) {
    // Remove leading =
    formula = formula.trim();
    if (formula.startsWith('=')) {
      formula = formula.substring(1);
    }

    // Parse and evaluate
    return this.parseExpression(formula);
  }

  parseExpression(expr) {
    // Check if it's a function call
    const funcMatch = expr.match(/^(\w+)\((.*)\)$/);
    if (funcMatch) {
      const [, funcName, argsStr] = funcMatch;
      const func = this.functions[funcName.toUpperCase()];
      
      if (!func) {
        throw new Error(`Unknown function: ${funcName}`);
      }

      // Parse arguments
      const args = this.parseArgs(argsStr);
      return func.call(this, ...args);
    }

    // Simple arithmetic expression
    try {
      // SECURITY WARNING: eval is dangerous in production!
      // This is MVP only. Use a proper expression parser in production.
      return eval(expr);
    } catch (error) {
      throw new Error(`Invalid expression: ${expr}`);
    }
  }

  parseArgs(argsStr) {
    // Split by comma but respect nested parentheses
    const args = [];
    let current = '';
    let depth = 0;

    for (const char of argsStr) {
      if (char === '(') depth++;
      if (char === ')') depth--;
      
      if (char === ',' && depth === 0) {
        args.push(this.parseValue(current.trim()));
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) {
      args.push(this.parseValue(current.trim()));
    }

    return args;
  }

  parseValue(str) {
    // Number
    if (!isNaN(str)) {
      return parseFloat(str);
    }

    // Array [1,2,3]
    if (str.startsWith('[') && str.endsWith(']')) {
      return JSON.parse(str);
    }

    // String
    if ((str.startsWith('"') && str.endsWith('"')) ||
        (str.startsWith("'") && str.endsWith("'"))) {
      return str.slice(1, -1);
    }

    // Expression
    return this.parseExpression(str);
  }

  // Built-in Functions
  sum(...args) {
    const values = this.flatten(args);
    return values.reduce((sum, val) => sum + val, 0);
  }

  average(...args) {
    const values = this.flatten(args);
    return this.sum(...values) / values.length;
  }

  count(...args) {
    const values = this.flatten(args);
    return values.length;
  }

  max(...args) {
    const values = this.flatten(args);
    return Math.max(...values);
  }

  min(...args) {
    const values = this.flatten(args);
    return Math.min(...values);
  }

  ifCondition(condition, trueValue, falseValue) {
    return condition ? trueValue : falseValue;
  }

  round(value, decimals = 0) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  flatten(arr) {
    const result = [];
    for (const item of arr) {
      if (Array.isArray(item)) {
        result.push(...this.flatten(item));
      } else if (typeof item === 'number') {
        result.push(item);
      }
    }
    return result;
  }
}
```

#### **3. FormulaEditor Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/Formulas/FormulaEditor.jsx`

```javascript
import React from 'react';

const FormulaEditor = ({ formula, onChange, onClose }) => {
  const functions = [
    { name: 'SUM', syntax: 'SUM(numbers)', desc: 'مجموع الأرقام' },
    { name: 'AVG', syntax: 'AVG(numbers)', desc: 'متوسط الأرقام' },
    { name: 'COUNT', syntax: 'COUNT(values)', desc: 'عدد القيم' },
    { name: 'MAX', syntax: 'MAX(numbers)', desc: 'أكبر قيمة' },
    { name: 'MIN', syntax: 'MIN(numbers)', desc: 'أصغر قيمة' },
    { name: 'IF', syntax: 'IF(condition, true, false)', desc: 'شرط' },
    { name: 'ROUND', syntax: 'ROUND(number, decimals)', desc: 'تقريب' }
  ];

  const insertFunction = (funcSyntax) => {
    onChange(formula + funcSyntax);
  };

  return (
    <div className="formula-editor">
      <div className="editor-header">
        <h4>محرر المعادلات</h4>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="editor-body">
        <div className="functions-list">
          <h5>الدوال المتاحة:</h5>
          {functions.map(func => (
            <div 
              key={func.name}
              className="function-item"
              onClick={() => insertFunction(func.syntax)}
            >
              <code className="function-syntax">{func.syntax}</code>
              <span className="function-desc">{func.desc}</span>
            </div>
          ))}
        </div>

        <div className="examples">
          <h5>أمثلة:</h5>
          <div className="example-item">
            <code>=SUM([10, 20, 30])</code>
            <span>→ 60</span>
          </div>
          <div className="example-item">
            <code>=AVG([10, 20, 30])</code>
            <span>→ 20</span>
          </div>
          <div className="example-item">
            <code>=IF(10 > 5, "نعم", "لا")</code>
            <span>→ نعم</span>
          </div>
          <div className="example-item">
            <code>=ROUND(3.14159, 2)</code>
            <span>→ 3.14</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormulaEditor;
```

#### **4. CSS Styling:**

**File:** `src/pages/Admin/SpreadsheetView/components/Formulas/Formulas.css`

```css
/* Formula Bar */
.formula-bar {
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
  padding: 8px 16px;
}

.formula-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 4px 8px;
}

.formula-label {
  font-weight: 600;
  color: #8FD9D9;
  font-size: 16px;
}

.formula-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  padding: 6px;
}

.formula-btn {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.formula-btn:hover {
  background: #e0e0e0;
}

.formula-result {
  margin-top: 8px;
  padding: 8px 12px;
  background: #E8F5E9;
  border-radius: 6px;
  font-size: 13px;
  color: #2E7D32;
}

.formula-result strong {
  color: #1B5E20;
  font-weight: 600;
}

/* Formula Editor */
.formula-editor {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 8px;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.editor-header h4 {
  margin: 0;
  font-size: 15px;
  color: #333;
}

.editor-body {
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.functions-list {
  margin-bottom: 20px;
}

.functions-list h5 {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #666;
  font-weight: 600;
}

.function-item {
  padding: 8px 12px;
  background: #f9f9f9;
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
}

.function-item:hover {
  background: #E3F2FD;
  transform: translateX(-4px);
}

.function-syntax {
  font-family: 'Courier New', monospace;
  color: #8FD9D9;
  font-weight: 600;
  font-size: 13px;
}

.function-desc {
  font-size: 12px;
  color: #999;
}

/* Examples */
.examples h5 {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #666;
  font-weight: 600;
}

.example-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #FFF9E6;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 13px;
}

.example-item code {
  font-family: 'Courier New', monospace;
  color: #333;
}

.example-item span {
  color: #666;
}
```

---

## 📦 **Feature 3: Macros / Automation**

### **الوصف:**
تسجيل وتشغيل سلاسل من الأوامر (Record/Replay).

### **المكونات:**

#### **1. MacroRecorder Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/Macros/MacroRecorder.jsx`

```javascript
import React, { useState } from 'react';
import './Macros.css';

const MacroRecorder = ({ onRecord, onPlay, savedMacros }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedActions, setRecordedActions] = useState([]);
  const [macroName, setMacroName] = useState('');

  const startRecording = () => {
    setIsRecording(true);
    setRecordedActions([]);
    console.log('🔴 بدأ التسجيل...');
  };

  const stopRecording = () => {
    setIsRecording(false);
    console.log('⏹️ توقف التسجيل');
    
    if (recordedActions.length === 0) {
      alert('لم يتم تسجيل أي أوامر');
      return;
    }

    const name = prompt('اسم الماكرو:', `Macro ${Date.now()}`);
    if (name) {
      onRecord?.({ name, actions: recordedActions });
      setMacroName('');
      setRecordedActions([]);
    }
  };

  const recordAction = (action) => {
    if (!isRecording) return;
    
    setRecordedActions(prev => [...prev, {
      type: action.type,
      data: action.data,
      timestamp: Date.now()
    }]);
  };

  const playMacro = (macro) => {
    console.log(`▶️ تشغيل: ${macro.name}`);
    onPlay?.(macro);
  };

  // Expose recordAction to parent
  React.useEffect(() => {
    window.__recordMacroAction = recordAction;
  }, [isRecording]);

  return (
    <div className="macro-recorder">
      <div className="recorder-controls">
        {!isRecording ? (
          <button 
            className="record-btn"
            onClick={startRecording}
            title="بدء التسجيل"
          >
            🔴 تسجيل
          </button>
        ) : (
          <>
            <button 
              className="stop-btn"
              onClick={stopRecording}
              title="إيقاف التسجيل"
            >
              ⏹️ إيقاف
            </button>
            <span className="recording-indicator">
              <span className="pulse"></span>
              جاري التسجيل... ({recordedActions.length} أمر)
            </span>
          </>
        )}
      </div>

      {savedMacros && savedMacros.length > 0 && (
        <div className="saved-macros">
          <h5>الماكروهات المحفوظة:</h5>
          <div className="macros-list">
            {savedMacros.map((macro, i) => (
              <div key={i} className="macro-item">
                <div className="macro-info">
                  <strong>{macro.name}</strong>
                  <span>{macro.actions.length} أمر</span>
                </div>
                <button 
                  className="play-btn"
                  onClick={() => playMacro(macro)}
                >
                  ▶️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MacroRecorder;
```

#### **2. Macro Player Utility:**

**File:** `src/pages/Admin/SpreadsheetView/utils/macroPlayer.js`

```javascript
export class MacroPlayer {
  constructor(gridApi) {
    this.gridApi = gridApi;
  }

  async play(macro) {
    console.log(`Playing macro: ${macro.name}`);

    for (const action of macro.actions) {
      await this.executeAction(action);
      // Small delay between actions
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('Macro completed');
  }

  async executeAction(action) {
    switch (action.type) {
      case 'cell_edit':
        this.editCell(action.data);
        break;
      case 'filter':
        this.applyFilter(action.data);
        break;
      case 'sort':
        this.applySort(action.data);
        break;
      case 'select':
        this.selectRows(action.data);
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  editCell(data) {
    const { rowIndex, field, value } = data;
    const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
    if (rowNode) {
      rowNode.setDataValue(field, value);
    }
  }

  applyFilter(data) {
    this.gridApi.setFilterModel(data.filterModel);
  }

  applySort(data) {
    this.gridApi.setSortModel(data.sortModel);
  }

  selectRows(data) {
    const { rowIndices } = data;
    this.gridApi.forEachNode(node => {
      if (rowIndices.includes(node.rowIndex)) {
        node.setSelected(true);
      }
    });
  }
}
```

#### **3. Integration in SpreadsheetView:**

```javascript
// src/pages/Admin/SpreadsheetView/SpreadsheetView.jsx

import MacroRecorder from './components/Macros/MacroRecorder';
import { MacroPlayer } from './utils/macroPlayer';
import { useState } from 'react';

const SpreadsheetView = () => {
  const [savedMacros, setSavedMacros] = useState([]);
  const gridRef = useRef();

  const handleRecordMacro = (macro) => {
    setSavedMacros(prev => [...prev, macro]);
    console.log('Macro saved:', macro);
  };

  const handlePlayMacro = (macro) => {
    const player = new MacroPlayer(gridRef.current.api);
    player.play(macro);
  };

  // Record actions on cell edit
  const handleCellValueChanged = (params) => {
    // Record this action if recording
    if (window.__recordMacroAction) {
      window.__recordMacroAction({
        type: 'cell_edit',
        data: {
          rowIndex: params.node.rowIndex,
          field: params.colDef.field,
          value: params.newValue
        }
      });
    }
  };

  return (
    <div className="spreadsheet-view">
      <MacroRecorder
        onRecord={handleRecordMacro}
        onPlay={handlePlayMacro}
        savedMacros={savedMacros}
      />

      <AgGridReact
        ref={gridRef}
        onCellValueChanged={handleCellValueChanged}
        // ... other props
      />
    </div>
  );
};
```

#### **4. CSS Styling:**

**File:** `src/pages/Admin/SpreadsheetView/components/Macros/Macros.css`

```css
/* Macro Recorder */
.macro-recorder {
  background: #f9f9f9;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.recorder-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.record-btn,
.stop-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.record-btn {
  background: #f44336;
  color: white;
}

.record-btn:hover {
  background: #d32f2f;
  transform: scale(1.05);
}

.stop-btn {
  background: #666;
  color: white;
}

.stop-btn:hover {
  background: #444;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f44336;
  font-size: 13px;
  font-weight: 500;
}

.pulse {
  width: 10px;
  height: 10px;
  background: #f44336;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

/* Saved Macros */
.saved-macros {
  margin-top: 16px;
}

.saved-macros h5 {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #666;
  font-weight: 600;
}

.macros-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.macro-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  transition: all 0.2s;
}

.macro-item:hover {
  border-color: #8FD9D9;
  box-shadow: 0 2px 8px rgba(143, 217, 217, 0.1);
}

.macro-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.macro-info strong {
  font-size: 14px;
  color: #333;
}

.macro-info span {
  font-size: 12px;
  color: #999;
}

.play-btn {
  background: #8FD9D9;
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.play-btn:hover {
  background: #7CCACA;
  transform: scale(1.1);
}
```

---

## ✅ **Testing Checklist**

### **Keyboard Shortcuts:**
- [ ] Ctrl+S saves data
- [ ] Ctrl+F opens search
- [ ] Ctrl+E exports data
- [ ] F5 refreshes
- [ ] Ctrl+A selects all
- [ ] ? opens shortcuts hub
- [ ] Search filters shortcuts
- [ ] All shortcuts listed correctly

### **Custom Formulas:**
- [ ] Formula bar accepts input
- [ ] SUM calculates correctly
- [ ] AVG calculates correctly
- [ ] IF condition works
- [ ] Formula editor opens
- [ ] Insert function works
- [ ] Error handling displays
- [ ] Result shows in UI

### **Macros:**
- [ ] Record button starts recording
- [ ] Actions captured during recording
- [ ] Stop button saves macro
- [ ] Macro name prompt works
- [ ] Play button executes macro
- [ ] Actions replay correctly
- [ ] Multiple macros supported
- [ ] Macro count displays

---

## 🎯 **Claude Code Prompt**

```
أنشئ ميزات Power Features للـ SpreadsheetView:

1. Keyboard Shortcuts Hub - مركز الاختصارات
2. Custom Formulas - معادلات (SUM, AVG, COUNT, etc)
3. Macros / Automation - تسجيل/تشغيل

استخدم:
- react-hotkeys-hook
- Custom formula engine
- Macro recorder/player

المكونات:
- ShortcutsHub.jsx + useShortcuts hook
- FormulaBar.jsx + FormulaEditor.jsx + formulas.js
- MacroRecorder.jsx + macroPlayer.js

YAS colors, Arabic UI, responsive.
راجع PHASE_8_Power_Features.md للتفاصيل.
```

---

**Next:** `PHASE_9_Mobile.md` 📱
