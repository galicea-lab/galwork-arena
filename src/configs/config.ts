type Config = {
  keycloak : string,
  keycloak_client : string,
  api_url : string,
};

// wartości nadpisywalne zawartością .env w czasie `next build`
// 2026-11-15: edytory BPMN/formularzy korzystają z `api_url` (API plików obiegów huba).

let CONFIG: Config =
{
  keycloak : process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'https://login.e-talar.com/realms/transmem',
  keycloak_client : process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT || 'transmem',
  api_url : process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8086/v1/wf/',
};

export default CONFIG
