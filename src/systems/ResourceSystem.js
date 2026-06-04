export function updateResources(state, dt) {
  const generators = state.buildings.filter((b) => b.type === 'generator').length;
  state.income = 8 + generators * (5 + state.upgGen);

  // Overcharge: 2x income when active
  const overchargeMult = state.overchargeActive ? 2 : 1;
  state.energy += state.income * state.upgIncome * overchargeMult * dt;
  state.data += (1.5 + generators * 0.6) * dt;
}
