import { rawPuzzles } from '../backend/lambda/puzzle-data.mjs';
import { rewardConfig, validateRewardConfig } from '../backend/lambda/reward-config.mjs';

const errors = validateRewardConfig(rewardConfig, rawPuzzles.map(([id]) => id));
if (errors.length) {
  console.error('Configuración de recompensas inválida:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Configuración válida: ${rewardConfig.rewards.length} recompensas y ${rewardConfig.pieces?.enabled ? 'meta-recompensa activada' : 'meta-recompensa desactivada'}.`);
}
