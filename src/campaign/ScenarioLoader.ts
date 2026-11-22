import { ScenarioData } from '../data/types.ts';
import scenario01 from '../../public/campaigns/act1/scenario_01_horned_sails.json';

export class ScenarioLoader {
  public static async loadScenario(scenarioId: string): Promise<ScenarioData> {
    try {
      const response = await fetch(`/campaigns/act1/${scenarioId}.json`);
      if (response.ok) {
        return (await response.json()) as ScenarioData;
      }
    } catch {
      // Fallback a dati integrati
    }
    return scenario01 as unknown as ScenarioData;
  }
}
