const { ClientSecretCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const { CertificateClient } = require('@azure/keyvault-certificates');


const credential = new ClientSecretCredential(
    process.env.AZURE_TENANT_ID,
    process.env.AZURE_CLIENT_ID,
    process.env.AZURE_CLIENT_SECRET
);

const client = new CertificateClient(process.env.AZURE_KEY_VAULT_URL, credential);

const getSecret = async () => {
    try {
        const retrievedSecret = await client.getCertificate(process.env.AZURE_CERTIFICATE_NAME);
        return retrievedSecret.cer
    } catch (error) {
        console.error('Error fetching secret:', error);
    }
}

module.exports = { getSecret }