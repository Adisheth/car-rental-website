// Expose bookingData (if present) from localStorage to the global scope
(function () {
  try {
    var raw = null
    if (typeof localStorage !== 'undefined') {
      raw = localStorage.getItem('bookingData')
    }
    window.bookingData = raw
  } catch (err) {
    window.bookingData = null
    console.warn('cars.js: unable to access localStorage', err)
  }
})();

// Provide a robust bookNow that opens the booking modal when present
// and falls back to redirecting to /booking (server-side page).
// Non-conflicting fallback: redirect to booking page and store selectedCarId
window.carsRedirectBookNow = function (carId) {
  const idToFind = String(carId)
  try { if (typeof localStorage !== 'undefined') localStorage.setItem('selectedCarId', idToFind) } catch (e) {}
  window.location.href = '/booking'
}

// Also expose openBookingModalFor to support handlers that call it
window.openBookingModalFor = function (carId) {
  const hidden = document.getElementById('carId')
  const modal = document.getElementById('bookingModal')
  if (hidden) hidden.value = String(carId)
  if (modal) {
    modal.style.display = 'block'
    modal.classList.add('active')
  }
}

// User-requested bookNow implementation (visible globally)
window.bookNow = async function (carId) {
  const id = String(carId)

  // Try to find car in injected carData
  let car = null
  try {
    if (typeof window.carData !== 'undefined' && Array.isArray(window.carData)) {
      car = window.carData.find((c) => String(c.id) === id)
    }
  } catch (err) {
    console.warn('cars.js: error accessing window.carData', err)
  }

  // If not found, attempt to fetch from API
  if (!car) {
    try {
      const res = await fetch(`/api/cars/${encodeURIComponent(id)}`)
      if (res.ok) car = await res.json()
    } catch (err) {
      console.warn('cars.js: failed to fetch car from API', err)
    }
  }

  // If booking modal exists on the page, prefill and open it
  const modal = document.getElementById('bookingModal')
  const hidden = document.getElementById('carId')
  if (modal) {
    if (hidden) hidden.value = id
    // Optionally prefill other fields if you want (e.g., selected car name)
    modal.style.display = 'block'
    return
  }

  // Otherwise, persist selected car (at least id) and redirect to booking page
  try {
    if (car && typeof localStorage !== 'undefined') {
      localStorage.setItem('selectedCar', JSON.stringify(car))
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem('selectedCarId', id)
    }
  } catch (err) {
    console.warn('cars.js: unable to save selected car to localStorage', err)
  }

  window.location.href = '/booking'
}


