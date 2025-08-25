
// Import realtime setup (this will automatically enable realtime when the module is loaded)
import "./realtime-setup";

// Re-export all the functions from the specialized modules
export { fetchMateriasByBloco } from "./materias-fetch";
export { createMateria } from "./materias-create";
export { updateMateria } from "./materias-update";
export { deleteMateria } from "./materias-delete";
export { updateMateriasOrdem } from "./materias-order";
