type Config = {
  keycloak : string,
  keycloak_client : string,
  api_url : string,
  bpmn_files_url : string,
};

// wartości nadpisywalne zawartością .env w czasie `next build`
// `bpmn_files_url` - adres serwera plików dla edytorów BPMN/formularzy (server/bpmn-files.mjs), w produkcji '/bpmn-files' 
// ustawienia nginx zapewniają ochronę hasłem. 
// Pusta wartość  NIE wyłącza edytorów - wywołania idą wtedy na względne /api/bpmn/... areny i kończą się 404.
// TODO: rozważyć rezygnację z serwerów na rzecz wymiany przez API z galwork-hub

let CONFIG: Config =
{
  keycloak : process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'https://login.e-talar.com/realms/transmem',
  keycloak_client : process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT || 'transmem',
  api_url : process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8086/v1/wf/',
  bpmn_files_url : process.env.NEXT_PUBLIC_BPMN_FILES_URL ?? 'http://localhost:8090',
};

export default CONFIG
