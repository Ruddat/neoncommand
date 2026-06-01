export function updateResources(state, dt) {
  const generators = state.buildings.filter((b) => b.type === 'generator').length;
  state.income = 8 + generators * (5 + state.upgGen);
  state.energy += state.income * state.upgIncome * dt;
  state.data += (1.5 + generators * 0.6) * dt;
}
