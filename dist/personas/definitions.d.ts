/**
 * Hanwudi Persona Definitions
 * 8 specialized AI personas for different tasks
 */
import { PersonaConfig } from '../types';
export declare const PERSONA_DEFINITIONS: Record<string, PersonaConfig>;
export declare const LAYER_DEFINITIONS: {
    zhongchao: {
        name: string;
        english: string;
        personas: string[];
        description: string;
    };
    waichao: {
        name: string;
        english: string;
        personas: string[];
        description: string;
    };
    cishi: {
        name: string;
        english: string;
        personas: string[];
        description: string;
    };
};
export declare function getPersona(name: string): PersonaConfig | undefined;
export declare function getPersonasByTrigger(trigger: string): PersonaConfig[];
export declare function getAllPersonas(): PersonaConfig[];
//# sourceMappingURL=definitions.d.ts.map