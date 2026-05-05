# Setup

## Entrez authentication

1. Go to your NCBI settings page (https://account.ncbi.nlm.nih.gov/settings/).
1. "Create API Key".
1. _(For running the pipeline locally)_ In `/.env`, add an `AUTH_ENTREZ` key with the value of the created key.
1. _(For running the pipeline on GitHub Actions)_ Create an actions repository secret in this repo with the name `AUTH_ENTREZ` and value of the created key.

## GitHub authentication

1. Generate a fine-grained personal access token with the name `cdfe-icc-eval-core` and read-only access to public repos only.
1. _(For running the pipeline locally)_ In `/.env`, add a `AUTH_GITHUB` key with the value of the generated token.
1. _(For running the pipeline on GitHub Actions)_ Create an actions repository secret in this repo with the name `AUTH_GITHUB` and value of the generated token.

## Google Analytics authentication

1. Go to the Google Console welcome page (console.cloud.google.com).
1. Create a new project titled "cfde-icc-eval-core".
1. Go to "IAM & Admin".
1. Create a service account with name "API Access" and id "api-access".
1. Create a JSON key for the service account.
1. _(For running the pipeline locally)_ Download the JSON key, move it to the root of this repo, rename it to "ga-credentials.json", and ensure it is being ignored by .gitignore.
1. Go back to the Google Console welcome page, then to "API & Services".
1. Disable any apis (one-by-one) that were enabled by default.
1. Enable "Google Analytics Data API" and "Google Analytics Admin API".
1. Find the service account email in the Google Console dashboard or in the JSON key.
1. In the Google Analytics instructions of this repo's readme, update the email account that submitters need to grant access to.
1. _(For running the pipeline on GitHub Actions)_ Create an actions repository secret in this repo with the name `AUTH_GOOGLE` and value of the JSON key file contents.
