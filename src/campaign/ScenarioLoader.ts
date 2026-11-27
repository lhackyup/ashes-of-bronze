import { ScenarioData } from '../data/types.ts';
import scenario01 from '../../public/campaigns/act1/scenario_01_horned_sails.json';
import scenario02 from '../../public/campaigns/act1/scenario_02_last_cargo_alashiya.json';
import scenario03 from '../../public/campaigns/act1/scenario_03_gate_of_cedars.json';
import scenario04 from '../../public/campaigns/act1/scenario_04_siege_kadesh_sea.json';
import scenario05 from '../../public/campaigns/act1/scenario_05_silence_great_kings.json';
import scenario06 from '../../public/campaigns/act2/scenario_06_war_of_rags.json';
import scenario07 from '../../public/campaigns/act2/scenario_07_into_stone_gorges.json';

const FALLBACK_SCENARIOS: Record<string, any> = {
  scenario_01_horned_sails: scenario01,
  scenario_02_last_cargo_alashiya: scenario02,
  scenario_03_gate_of_cedars: scenario03,
  scenario_04_siege_kadesh_sea: scenario04,
  scenario_05_silence_great_kings: scenario05,
  scenario_06_war_of_rags: scenario06,
  scenario_07_into_stone_gorges: scenario07
};

export class ScenarioLoader {
  public static async loadScenario(scenarioId: string): Promise<ScenarioData> {
    const actFolder = scenarioId.startsWith('scenario_09') || scenarioId.startsWith('scenario_10') ? 'act3' :
      (scenarioId.startsWith('scenario_06') || scenarioId.startsWith('scenario_07') || scenarioId.startsWith('scenario_08') ? 'act2' : 'act1');
    try {
      const response = await fetch(`/campaigns/${actFolder}/${scenarioId}.json`);
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
