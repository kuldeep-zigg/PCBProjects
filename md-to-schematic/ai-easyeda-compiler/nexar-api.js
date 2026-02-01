#!/usr/bin/env node

/**
 * Nexar API client for Octopart/Supply product search.
 * Docs: https://support.nexar.com/support/solutions/101000253221/
 * Token: https://identity.nexar.com/connect/token (client_credentials)
 * GraphQL: https://api.nexar.com/graphql
 */

const https = require('https');
const path = require('path');
const fs = require('fs');

const NEXAR_IDENTITY = 'identity.nexar.com';
const NEXAR_GRAPHQL = 'api.nexar.com';
const SCOPE = 'supply.domain';

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const m = line.match(/^\s*([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    });
  }
}

function getCredentials() {
  loadEnv();
  return {
    clientId: process.env.NEXAR_CLIENT_ID || '',
    clientSecret: process.env.NEXAR_CLIENT_SECRET || '',
    accessToken: process.env.NEXAR_ACCESS_TOKEN || ''
  };
}

/**
 * Get OAuth2 access token (client_credentials). Token valid 24h.
 */
function getToken(clientId, clientSecret) {
  return new Promise((resolve, reject) => {
    const body = `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&scope=${encodeURIComponent(SCOPE)}`;
    const req = https.request({
      hostname: NEXAR_IDENTITY,
      path: '/connect/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.access_token) resolve(json.access_token);
          else reject(new Error(json.error_description || json.error || data));
        } catch (e) {
          reject(new Error(data || res.statusCode));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Call Nexar GraphQL API (POST https://api.nexar.com/graphql).
 */
function graphql(accessToken, query, variables = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query, variables });
    const req = https.request({
      hostname: NEXAR_GRAPHQL,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.errors && json.errors.length) reject(new Error(json.errors[0].message || JSON.stringify(json.errors)));
          else resolve(json.data);
        } catch (e) {
          reject(new Error(data || res.statusCode));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Search parts by query (MPN, part number, or keyword).
 * Returns { supSearch: { results: [{ part: { ... } }] } }.
 */
const SEARCH_PARTS_QUERY = `query SearchParts($q: String!, $limit: Int) {
  supSearch(q: $q, limit: $limit) {
    results {
      part {
        id
        mpn
        name
        shortDescription
        manufacturer {
          name
          homepageUrl
        }
        totalAvail
        category {
          id
          name
        }
      }
    }
  }
}`;

async function searchParts(query, limit = 15) {
  const { clientId, clientSecret, accessToken } = getCredentials();
  let token = accessToken;
  if (!token && clientId && clientSecret) {
    token = await getToken(clientId, clientSecret);
    console.log('✅ Nexar token obtained.');
  }
  if (!token) throw new Error('Set NEXAR_ACCESS_TOKEN or NEXAR_CLIENT_ID + NEXAR_CLIENT_SECRET in .env');
  const data = await graphql(token, SEARCH_PARTS_QUERY, { q: query, limit });
  return data;
}

module.exports = {
  getCredentials,
  getToken,
  graphql,
  searchParts,
  loadEnv
};
