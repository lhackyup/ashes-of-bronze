import { ScenarioData } from '../data/types.ts';
import scenario01 from '../../public/campaigns/act1/scenario_01_horned_sails.json';
import scenario02 from '../../public/campaigns/act1/scenario_02_last_cargo_alashiya.json';
import scenario03 from '../../public/campaigns/act1/scenario_03_gate_of_cedars.json';
import scenario04 from '../../public/campaigns/act1/scenario_04_siege_kadesh_sea.json';

const FALLBACK_SCENARIOS: Record<string, any> = {
  scenario_01_horned_sails: scenario01,
  scenario_02_last_cargo_alashiya: scenario02,
  scenario_03_gate_of_cedars: scenario03,
  scenario_04_siege_kadesh_sea: scenario04
};

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
    if (FALLBACK_SCENARIOS[scenarioId]) {
      return FALLBACK_SCENARIOS[scenarioId] as unknown as ScenarioData;
    }
    return scenario01 as unknown as ScenarioData;
  }
}
