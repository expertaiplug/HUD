// netlify/functions/shared/zip-utils.js
const fetch = require('node-fetch');

// MSA Database (same as your current one)
const MSA_DATABASE = {
  '12060': { name: 'Atlanta-Sandy Springs-Roswell, GA', state: 'GA' },
  '45300': { name: 'Tampa-St. Petersburg-Clearwater, FL', state: 'FL' },
  // ... rest of your MSA data
};

async function lookupZipCodeDirect(zipCode) {
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.places || data.places.length === 0) return null;
    
    const place = data.places[0];
    const basicInfo = {
      city: place['place name'],
      state: place['state abbreviation'],
      latitude: parseFloat(place.latitude),
      longitude: parseFloat(place.longitude),
      county: place.county || null
    };
    
    // Find MSA
    const msaInfo = findMSAForLocation(basicInfo);
    if (!msaInfo) return null;
    
    return {
      zipCode,
      city: basicInfo.city,
      state: basicInfo.state,
      county: basicInfo.county,
      msa: msaInfo.msa,
      msaName: msaInfo.name,
      hudDataAvailable: MSA_DATABASE.hasOwnProperty(msaInfo.msa)
    };
  } catch (error) {
    console.error('ZIP lookup error:', error);
    return null;
  }
}

function findMSAForLocation(locationInfo) {
  // Direct matching logic
  for (const [msaCode, msaData] of Object.entries(MSA_DATABASE)) {
    if (msaData.name.includes(locationInfo.city) && 
        msaData.state === locationInfo.state) {
      return {
        msa: msaCode,
        name: msaData.name
      };
    }
  }
  return null;
}

module.exports = { lookupZipCodeDirect, MSA_DATABASE };
