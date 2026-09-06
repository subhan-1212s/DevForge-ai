/**
 * AI Assistant Service for DevForge AI
 * Integrates external LLM providers or falls back to an advanced developer mock generator.
 */

// Helper to detect code language
const detectLanguage = (code = '') => {
  if (code.includes('def ') || code.includes('import os')) return 'python';
  if (code.includes('import React') || code.includes('const ') || code.includes('function ')) return 'javascript';
  if (code.includes('class ') && code.includes('public static void')) return 'java';
  if (code.includes('#include <iostream>')) return 'cpp';
  return 'javascript';
};

// Helper for structured JSON completions from OpenAI
const callOpenAI = async (prompt, systemMessage = "You are an expert developer assistant. You must return valid JSON responses.") => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      })
    });

    const data = await response.json();
    if (data.choices && data.choices[0]) {
      return JSON.parse(data.choices[0].message.content);
    }
    throw new Error(data.error?.message || 'OpenAI API request failed');
  } catch (error) {
    console.error('OpenAI fetch error:', error);
    throw error;
  }
};

// Helper for unstructured text completions from OpenAI
const callOpenAIText = async (prompt, systemMessage = "You are an expert developer assistant.") => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5
      })
    });

    const data = await response.json();
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content;
    }
    throw new Error(data.error?.message || 'OpenAI API request failed');
  } catch (error) {
    console.error('OpenAI text fetch error:', error);
    throw error;
  }
};

// Generates realistic code optimization suggestions
exports.optimizeCode = async (code) => {
  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = `Optimize this code and return a JSON object with keys: 'optimizedCode', 'explanation', 'complexityBefore', 'complexityAfter'. Code:\n${code}`;
      const result = await callOpenAI(prompt, "You are a senior software engineer who refactors code for efficiency and readability.");
      return result;
    } catch (err) {
      console.warn("Falling back to mock AI compiler due to error:", err.message);
    }
  }

  const lang = detectLanguage(code);
  
  if (lang === 'javascript') {
    return {
      optimizedCode: `// Optimized using DevForge AI\n// Changes: Converted var to const/let, refactored loops to Array helpers, added error handling\n\nconst processData = (items) => {\n  if (!Array.isArray(items)) return [];\n  \n  return items\n    .filter(item => item && item.active)\n    .map(item => ({\n      id: item.id,\n      value: item.value ?? 0\n    }));\n};`,
      explanation: "1. **Safer Scope Declarations:** Replaced loose variables with block-scoped constant declarations.\n2. **Defensive Programming:** Added array type checking at the function header to avoid null runtime exceptions.\n3. **Declarative Loops:** Replaced standard index-based `for` iterations with clean, functional `.filter().map()` operations.\n4. **Nullish Coalescing:** Used the `??` operator to provide fallbacks for unassigned attributes.",
      complexityBefore: "O(N^2) due to nested property checks",
      complexityAfter: "O(N) single-pass pipeline"
    };
  }

  return {
    optimizedCode: `def process_records(records):\n    # Optimized using DevForge AI\n    # Changes: Used list comprehensions, added type validations\n    if not isinstance(records, list):\n        return []\n        \n    return [\n        {"id": r.get("id"), "score": r.get("score", 0)}\n        for r in records\n        if r and r.get("active")\n    ]`,
    explanation: "1. **List Comprehensions:** Converted loop appends into single-line Pythonic list comprehensions.\n2. **Robust Dictionary Fetching:** Replaced brackets indexing with `.get()` fallbacks to prevent key errors.\n3. **Type Assertions:** Included assertions checking that the parameter is a valid dictionary list.",
    complexityBefore: "O(N) with bracket lookups",
    complexityAfter: "O(N) safe fetch pipeline"
  };
};

// Generates realistic code reviews
exports.reviewCode = async (code) => {
  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = `Review this code and return a JSON object with keys: 'summary', 'bugs' (array of objects with 'severity' and 'description' and 'fix'), 'smells' (array of objects with 'category', 'description', 'fix'), 'improvements' (array of objects with 'category', 'description', 'fix'). Code:\n${code}`;
      const result = await callOpenAI(prompt, "You are a senior software reviewer performing a security, standards, and performance audit.");
      return result;
    } catch (err) {
      console.warn("Falling back to mock AI compiler due to error:", err.message);
    }
  }

  return {
    summary: "Code structure is clean, but lacks defensive error checks, handles async operations insecurely, and uses outdated variable scopes.",
    bugs: [
      { severity: "high", description: "Lack of null input checking can result in crash-level properties of undefined errors.", fix: "Add parameter validations at the top of the block." }
    ],
    smells: [
      { category: "outdated-standards", description: "Use of var instead of const/let overrides block-level scoping constraints.", fix: "Declare identifiers with const/let instead." }
    ],
    improvements: [
      { category: "performance", description: "Avoid nested iterations which can degrade scaling performance to quadratic O(N^2).", fix: "Flatten the lists or index lookups using HashMaps." }
    ]
  };
};

// Explains error stack traces
exports.explainBug = async (errorLog) => {
  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = `Explain this error stack trace and return a JSON object with keys: 'cause', 'fix', 'prevention'. Error:\n${errorLog}`;
      const result = await callOpenAI(prompt, "You are a debugging assistant explaining runtime errors and compiler exceptions.");
      return result;
    } catch (err) {
      console.warn("Falling back to mock AI compiler due to error:", err.message);
    }
  }

  let cause = "The execution runtime encountered an unhandled reference call on a null or uninitialized reference pointer.";
  let fix = "Verify that the variable is declared and defined prior to accessing its properties, or use the optional chaining operator `?.` to safely retrieve child keys.";
  let prevention = "1. Enable TypeScript strictNullChecks.\n2. Implement default values in object destructuring.\n3. Wrap risky JSON/API calls in standard `try {} catch {}` blocks.";

  if (errorLog.includes('Cannot read properties of undefined')) {
    cause = "An operation tried to read properties (like `.length` or `.map`) on an object path that is currently uninitialized or `undefined`.";
    fix = "Add an initial check: `if (!myObject) return;` or fetch keys safely: `myObject?.property`.";
  } else if (errorLog.includes('Network Error') || errorLog.includes('fetch')) {
    cause = "The HTTP client failed to establish connection to the remote endpoint. This is commonly caused by CORS rules or an offline target port.";
    fix = "Verify server listeners, check CORS header policies, and ensure port forwarding configs are active.";
  }

  return { cause, fix, prevention };
};

// Generates tasks from sprint prompts
exports.generateTasks = async (prompt) => {
  if (process.env.OPENAI_API_KEY) {
    try {
      const promptText = `Generate sub-tasks for this prompt: '${prompt}'. Return a JSON object with keys: 'backend' (array of objects with 'title', 'description'), 'frontend' (array of objects with 'title', 'description'), 'testing' (array of objects with 'title', 'description').`;
      const result = await callOpenAI(promptText, "You are a technical product manager scoping engineering tasks.");
      return result;
    } catch (err) {
      console.warn("Falling back to mock AI compiler due to error:", err.message);
    }
  }

  return {
    backend: [
      { title: `Setup database migrations for: ${prompt}`, description: "Configure mongoose migrations and schema fields validation index." },
      { title: `Code Express CRUD controllers for: ${prompt}`, description: "Write express routes, controllers, and tie validation middlewares." }
    ],
    frontend: [
      { title: `Design clean UI layout to support: ${prompt}`, description: "Create responsive React views styled with Tailwind CSS." },
      { title: `Integrate Axios API service for: ${prompt}`, description: "Wire hooks, Axios requests, and loaders state." }
    ],
    testing: [
      { title: "Run unit test checks", description: "Write test cases mapping controller route responses." }
    ]
  };
};

// Generates git commits
exports.generateCommitMessage = async (diff) => {
  if (process.env.OPENAI_API_KEY) {
    try {
      const promptText = `Generate a git commit message for this diff: '${diff}'. Return a JSON object with key: 'commitMessage'.`;
      const result = await callOpenAI(promptText, "You are an automated Git logger following Conventional Commit styles.");
      return result;
    } catch (err) {
      console.warn("Falling back to mock AI compiler due to error:", err.message);
    }
  }

  return {
    commitMessage: "feat(core): implement secure JWT token rotations and refresh credentials logic\n\n- Add cookie parser integration for HttpOnly token rotation\n- Refactor auth middlewares and user database schemas\n- Fix unhandled database casting errors on routing parameters"
  };
};

// Workspace assistant responder
exports.askAssistant = async (query, context = {}) => {
  if (process.env.OPENAI_API_KEY) {
    try {
      const promptText = `The user is asking: '${query}'. Answer them directly. Context: ${JSON.stringify(context)}`;
      const result = await callOpenAIText(promptText, "You are a workspace operations assistant summarizing team progress.");
      return result;
    } catch (err) {
      console.warn("Falling back to mock AI compiler due to error:", err.message);
    }
  }

  const q = query.toLowerCase();

  if (q.includes('task') || q.includes('pending')) {
    return "You currently have 2 pending tasks under verification: **Implement JWT token login** and **Setup database migrations**. You can manage them directly inside the project's Kanban Board suite.";
  }
  if (q.includes('bug') || q.includes('resolved')) {
    return "No critical bugs are currently open in the **Authentication System** project. 1 resolved ticket was archived today.";
  }
  if (q.includes('work') || q.includes('summarize')) {
    return "Today's summary:\n1. Overhauled DevForge AI workspace UI to premium Apple/Google light theme.\n2. Configured Socket.io server connection channels.\n3. Initialized project task lists and chat rooms.";
  }

  return "I am your DevForge AI workspace assistant. I can help search tasks, explain stack traces, review codebase files, or summarize sprint progress inside your workspaces.";
};
