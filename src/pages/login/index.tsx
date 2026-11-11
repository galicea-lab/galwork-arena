// pages/login/index.tsx

import { LoginPage, KeycloakConfig, keycloakConfig } from '@galicea-lab/nextjs-keycloak-auth';

let keycloakConfig_my: KeycloakConfig =
{
  keycloak : 'https://login.e-talar.com/realms/transmem',
  keycloak_client : 'transmem',
};


const Login = () => {
  return <LoginPage keycloakConfig = { keycloakConfig_my} />;

}

export default Login