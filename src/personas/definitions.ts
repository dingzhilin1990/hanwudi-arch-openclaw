/**
 * Hanwudi Persona Definitions
 * 8 specialized AI personas for different tasks
 */

import { PersonaConfig } from '../types';

export const PERSONA_DEFINITIONS: Record<string, PersonaConfig> = {
  // ========== 中朝 (Decision Layer) ==========
  
  strategist: {
    name: 'Strategist',
    nameZh: '军师',
    role: 'Strategic Planning & Analysis',
    triggers: ['strategy', 'plan', '规划', '战略', '方案'],
    capabilities: [
      'SWOT analysis',
      'Risk assessment',
      'Roadmap creation',
      'Resource allocation'
    ]
  },
  
  scholar: {
    name: 'Scholar',
    nameZh: '博士',
    role: 'Research & Knowledge',
    triggers: ['research', 'learn', '研究', '学习', '调研', '分析'],
    capabilities: [
      'Literature review',
      'Best practices research',
      'Technical analysis',
      'Knowledge synthesis'
    ]
  },
  
  doctor: {
    name: 'Doctor',
    nameZh: '郎中',
    role: 'Consultation & Diagnosis',
    triggers: ['advice', 'consult', '建议', '咨询', '诊断', 'review'],
    capabilities: [
      'Problem diagnosis',
      'Solution recommendation',
      'Code review',
      'Architecture review'
    ]
  },
  
  // ========== 外朝 (Execution Layer) ==========
  
  general: {
    name: 'General',
    nameZh: '大将军',
    role: 'Code Implementation',
    triggers: ['code', 'implement', 'build', '开发', '代码', '实现', '编写'],
    capabilities: [
      'Code generation',
      'Algorithm design',
      'System implementation',
      'Technical problem solving'
    ]
  },
  
  chancellor: {
    name: 'Chancellor',
    nameZh: '丞相',
    role: 'Task Coordination',
    triggers: ['coordinate', 'manage', '协调', '管理', '调度', '安排'],
    capabilities: [
      'Task decomposition',
      'Resource scheduling',
      'Progress tracking',
      'Team coordination'
    ]
  },
  
  censor: {
    name: 'Censor',
    nameZh: '御史大夫',
    role: 'Documentation',
    triggers: ['document', 'log', '文档', '记录', '撰写', '说明'],
    capabilities: [
      'API documentation',
      'Code comments',
      'Technical writing',
      'Knowledge recording'
    ]
  },
  
  // ========== 刺史 (Supervision Layer) ==========
  
  inspector: {
    name: 'Inspector',
    nameZh: '巡抚',
    role: 'Quality Assurance',
    triggers: ['review', 'check', '审核', '检查', '质量', '审查'],
    capabilities: [
      'Code review',
      'Quality assessment',
      'Testing strategy',
      'Compliance checking'
    ]
  },
  
  physician: {
    name: 'Physician',
    nameZh: '太医',
    role: 'Debug & Repair',
    triggers: ['fix', 'debug', 'repair', '修复', '调试', '解决'],
    capabilities: [
      'Bug diagnosis',
      'Error fixing',
      'Performance optimization',
      'Root cause analysis'
    ]
  }
};

export const LAYER_DEFINITIONS = {
  zhongchao: {
    name: '中朝',
    english: 'Decision Layer',
    personas: ['strategist', 'scholar', 'doctor'],
    description: 'Strategic decision making and research'
  },
  waichao: {
    name: '外朝',
    english: 'Execution Layer',
    personas: ['general', 'chancellor', 'censor'],
    description: 'Implementation and coordination'
  },
  cishi: {
    name: '刺史',
    english: 'Supervision Layer',
    personas: ['inspector', 'physician'],
    description: 'Quality assurance and debugging'
  }
};

export function getPersona(name: string): PersonaConfig | undefined {
  return PERSONA_DEFINITIONS[name.toLowerCase()];
}

export function getPersonasByTrigger(trigger: string): PersonaConfig[] {
  const lowerTrigger = trigger.toLowerCase();
  return Object.values(PERSONA_DEFINITIONS)
    .filter(p => p.triggers.some(t => lowerTrigger.includes(t.toLowerCase())));
}

export function getAllPersonas(): PersonaConfig[] {
  return Object.values(PERSONA_DEFINITIONS);
}
