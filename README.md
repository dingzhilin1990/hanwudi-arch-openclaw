# Hanwudi Team 🏛️

[![GitHub stars](https://img.shields.io/github/stars/dingzhilin1990/hanwudi-arch-openclaw?style=social)](https://github.com/dingzhilin1990/hanwudi-arch-openclaw)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[English](#english) | [中文](#中文)

---

## English

AI Agent Team Architecture with 8 specialized personas, inspired by MetaGPT SOP methodology.

### 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Hanwudi Team Architecture                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  中朝 · Inner Court  (Strategic Layer)              │   │
│  │  Strategist · Scholar · Doctor                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  外朝 · Outer Court  (Execution Layer)              │   │
│  │  General · Chancellor · Censor                       │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  刺史 · Provincial  (Supervision Layer)              │   │
│  │  Inspector · Physician                              │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                        LLM Adapter                          │
└─────────────────────────────────────────────────────────────┘
```

### Features

- **8 Specialized AI Personas** - Each with unique responsibilities
- **Three-Layer Architecture** - Decision → Execution → Supervision
- **Trigger-based Activation** - Automatic persona selection
- **LLM-Powered** - Works with OpenAI, Claude, MiniMax, etc.
- **TypeScript Support** - Full type definitions included

### Installation

```bash
npm install hanwudi-arch-openclaw
```

### Quick Start

```javascript
const { HanwudiTeam } = require('hanwudi-arch-openclaw');

// Create team
const team = new HanwudiTeam({ verbose: true });

// Activate personas by keywords
team.activate('strategy, code, review');

// Process request
const results = await team.process('Build a user authentication system');
console.log(results);
```

### The 8 Personas

| Layer | Persona | Role | Triggers |
|-------|---------|------|----------|
| 中朝 | Strategist (军师) | Strategic Planning | strategy, plan |
| 中朝 | Scholar (博士) | Research | research, learn |
| 中朝 | Doctor (郎中) | Consultation | advice, review |
| 外朝 | General (大将军) | Implementation | code, build |
| 外朝 | Chancellor (丞相) | Coordination | coordinate, manage |
| 外朝 | Censor (御史大夫) | Documentation | document, log |
| 刺史 | Inspector (巡抚) | Quality Assurance | review, check |
| 刺史 | Physician (太医) | Debugging | fix, debug |

### Using with LLM

```javascript
const { HanwudiTeam } = require('hanwudi-arch-openclaw');

// Create LLM adapter
const llm = {
  chat: async (messages) => {
    // Call your LLM API here
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4',
        messages
      })
    });
    const data = await response.json();
    return data.choices[0].message.content;
  }
};

// Set LLM and process
const team = new HanwudiTeam({ llm, verbose: true });
const results = await team.process('Write a REST API for user management');
```

### Run Workflow

```javascript
// Run structured workflow
const results = await team.runWorkflow('Create a blog system');
// Executes: Scholar → Strategist → General → Censor → Inspector → Physician
```

### API Reference

#### `new HanwudiTeam(options)`

- `options.llm` - LLM adapter (optional)
- `options.verbose` - Enable logging (default: false)
- `options.maxIterations` - Max workflow iterations (default: 10)

#### `team.activate(triggers)`

Activate personas by trigger keywords.

#### `team.process(input)`

Process input with all active personas.

#### `team.runWorkflow(input, steps?)`

Run structured workflow with specified personas.

---

## 中文

汉武帝团队 - 8人AI智能体架构，灵感来自MetaGPT SOP方法论。

### 安装

```bash
npm install hanwudi-arch-openclaw
```

### 快速开始

```javascript
const { HanwudiTeam } = require('hanwudi-arch-openclaw');

const team = new HanwudiTeam({ verbose: true });
team.activate('strategy, code, review');

const results = await team.process('Build a user authentication system');
```

### 工作流

```javascript
// 按顺序执行: 博士 → 军师 → 大将军 → 御史大夫 → 巡抚 → 太医
const results = await team.runWorkflow('创建一个博客系统');
```

### TypeScript 支持

```typescript
import { HanwudiTeam, PersonaResponse } from 'hanwudi-arch-openclaw';

const team = new HanwudiTeam();
const results: PersonaResponse[] = await team.process('Hello');
```

### License

MIT License
