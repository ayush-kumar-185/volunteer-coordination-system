const axios = require('axios')

const geocodeLocation = async (locationText) => {
  if (!locationText) return { lat: null, lng: null }

  try {
    const query = encodeURIComponent(`${locationText}, India`)
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`

    const response = await axios.get(url, {
      headers: {
        // Nominatim requires a User-Agent header
        'User-Agent': 'VolunteerCoordinationSystem/1.0'
      }
    })

    if (response.data && response.data.length > 0) {
      const result = response.data[0]
      console.log(`Geocoded "${locationText}" → lat: ${result.lat}, lng: ${result.lon}`)
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        display_name: result.display_name
      }
    }

    console.log(`Geocoding failed for "${locationText}" — no results`)
    return { lat: null, lng: null }

  } catch (err) {
    console.error('Geocoding error:', err.message)
    return { lat: null, lng: null }
  }
}

module.exports = { geocodeLocation }