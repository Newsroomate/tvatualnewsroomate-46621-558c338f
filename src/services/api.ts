
// Main API exports - centralized exports for all services
export { 
  fetchTelejornais, 
  createTelejornal, 
  updateTelejornal, 
  deleteTelejornal,
  fetchTelejornal 
} from "./telejornais-api";

export { 
  fetchBlocosByTelejornal, 
  createBloco, 
  updateBloco, 
  deleteBloco,
  deleteAllBlocos 
} from "./blocos-api";

export { 
  fetchMateriasByBloco, 
  createMateria, 
  updateMateria, 
  deleteMateria,
  updateMateriasOrdem 
} from "./materias-core-api";

// Export the pautas-api functions 
export { 
  fetchPautas, 
  createPauta, 
  updatePauta, 
  deletePauta 
} from "./pautas-api";

// Export the espelhos-api functions
export { fetchClosedRundowns } from "./espelhos-api";

// Export the snapshots-api functions
export { 
  fetchClosedRundowns as fetchClosedRundownSnapshots,
  ClosedRundownSnapshot
} from "./snapshots-api";
