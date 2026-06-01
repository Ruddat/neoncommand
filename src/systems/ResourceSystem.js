export function updateResources(state, dt) {
  const generators = state.buildings.filter((building) => building.type === 'generator').length;
  state.income = 7 + generators * 4;
  state.energy += state.income * dt;
  state.data += (1 + generators * 0.4) * dt;
}
