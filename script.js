// Global Variables
let currentUser = null
let isLoggedIn = false
let currentTestimonial = 0
let carData = []

// DOM Elements
const navToggle = document.getElementById("nav-toggle")
const navMenu = document.getElementById("nav-menu")
const userMenu = document.getElementById("userMenu")
const carGrid = document.getElementById("carGrid")
const carSearch = document.getElementById("carSearch")
const priceFilter = document.getElementById("priceFilter")

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  setupEventListeners()
  loadCarData()
  startTestimonialSlider()
  setDefaultDates()
})

// Initialize Application
function initializeApp() {
  // Check if user is logged in
  const savedUser = localStorage.getItem("currentUser")
  if (savedUser) {
    currentUser = JSON.parse(savedUser)
    isLoggedIn = true
    updateUIForLoggedInUser()
  }

  // Initialize animations
  initializeAnimations()
}

// Setup Event Listeners
function setupEventListeners() {
  // Navigation toggle
  if (navToggle) {
    navToggle.addEventListener("click", toggleMobileMenu)
  }

  // Filter tabs
  const filterTabs = document.querySelectorAll(".filter-tab")
  filterTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      filterCars(this.dataset.category)
      setActiveTab(this)
    })
  })

  // Search functionality
  if (carSearch) {
    carSearch.addEventListener("input", debounce(searchCars, 300))
  }

  // Price filter
  if (priceFilter) {
    priceFilter.addEventListener("change", filterByPrice)
  }

  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute("href"))
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })

  // Form submissions
  const quickBookingForm = document.querySelector(".quick-booking")
  if (quickBookingForm) {
    quickBookingForm.addEventListener("submit", handleQuickBooking)
  }

  // Modal close on outside click
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      closeModal(e.target.id)
    }
  })

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals()
    }
  })
}

// Mobile Menu Toggle
function toggleMobileMenu() {
  navMenu.classList.toggle("active")
  navToggle.classList.toggle("active")
}

// Modal Functions
function openModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.add("active")
    document.body.style.overflow = "hidden"
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.remove("active")
    document.body.style.overflow = ""
  }
}

function closeAllModals() {
  const modals = document.querySelectorAll(".modal")
  modals.forEach((modal) => {
    modal.classList.remove("active")
  })
  document.body.style.overflow = ""
}

function switchModal(currentModalId, targetModalId) {
  closeModal(currentModalId)
  setTimeout(() => openModal(targetModalId), 200)
}

// Car Data and Filtering
function loadCarData() {
  carData = [
    {
      id: "bmw-7-series",
      name: "BMW 7 Series",
      category: "luxury",
      price: 24999,
      rating: 4.9,
      seats: 5,
      transmission: "Automatic",
      fuel: "Hybrid",
      image: "image/cars/bmw-7-series-sedan-full-front-view-158295.jpg.avif",
      badge: "Premium",
      features: ["Leather Seats", "Sunroof", "Navigation", "Premium Audio"],
    },
    {
      id: "ferrari-488",
      name: "Ferrari 488 GTB",
      category: "sports",
      price: 49999,
      rating: 5.0,
      seats: 2,
      transmission: "Manual",
      fuel: "Petrol",
      image: "image/cars/ferrari-488-gtb-front-side-look.jpg",
      badge: "Exotic",
      features: ["Carbon Fiber", "Racing Seats", "Track Mode", "Launch Control"],
    },
    {
      id: "range-rover",
      name: "Range Rover",
      category: "suv",
      price: 16999,
      rating: 4.7,
      seats: 7,
      transmission: "Automatic",
      fuel: "Diesel",
      image: "image/cars/Range-Rover-SVO-Design-Pack-1.jpg",
      badge: "Popular",
      features: ["4WD", "Terrain Response", "Panoramic Roof", "7 Seats"],
    },
    {
      id: "tesla-model-s",
      name: "Tesla Model S",
      category: "electric",
      price: 20999,
      rating: 4.8,
      seats: 5,
      transmission: "Automatic",
      fuel: "Electric",
      image: "image/cars/tesla-model-s-plaid-3.jpg",
      badge: "Eco",
      features: ["Autopilot", "Supercharging", "Premium Interior", "Over-the-air Updates"],
    },
    {
      id: "mercedes-s-class",
      name: "Mercedes S-Class",
      category: "luxury",
      price: 22999,
      rating: 4.9,
      seats: 5,
      transmission: "Automatic",
      fuel: "Petrol",
      image: "image/cars/Mercedes S-Clas.jpg",
      badge: "Premium",
      features: ["Massage Seats", "Air Suspension", "Burmester Audio", "Night Vision"],
    },
    {
      id: "audi-a8",
      name: "Audi A8",
      category: "luxury",
      price: 21999,
      rating: 4.8,
      seats: 5,
      transmission: "Automatic",
      fuel: "Hybrid",
      image: "image/cars/audi-a8-l-full-front-view-164382.jpg",
      badge: "Premium",
      features: ["Matrix LED", "Virtual Cockpit", "Bang & Olufsen", "AI Suspension"],
    },
    {
      id: "lamborghini-huracan",
      name: "Lamborghini Huracan",
      category: "sports",
      price: 59999,
      rating: 5.0,
      seats: 2,
      transmission: "Automatic",
      fuel: "Petrol",
      image: "image/cars/Lamborghini Huracan.jpg",
      badge: "Exotic",
      features: ["V10 Engine", "All-Wheel Drive", "Carbon Ceramic Brakes", "Launch Control"],
    },
    {
      id: "porsche-911",
      name: "Porsche 911",
      category: "sports",
      price: 45999,
      rating: 4.9,
      seats: 4,
      transmission: "Automatic",
      fuel: "Petrol",
      image: "image/cars/Porsche 911 .jpg",
      badge: "Performance",
      features: ["Turbo Engine", "Sport Chrono", "PASM", "PDK Transmission"],
    },
    {
      id: "mclaren-720s",
      name: "McLaren 720S",
      category: "sports",
      price: 69999,
      rating: 5.0,
      seats: 2,
      transmission: "Automatic",
      fuel: "Petrol",
      image: "image/cars/McLaren720S.jpg",
      badge: "Supercar",
      features: ["Carbon Fiber Monocoque", "Active Aerodynamics", "Proactive Chassis", "Dihedral Doors"],
    },
    {
      id: "bentley-continental",
      name: "Bentley Continental GT",
      category: "luxury",
      price: 35999,
      rating: 4.9,
      seats: 4,
      transmission: "Automatic",
      fuel: "Petrol",
      image: "image/cars/bentley continental.jpg",
      badge: "Ultra Luxury",
      features: ["Handcrafted Interior", "Naim Audio", "Diamond Quilted Leather", "W12 Engine"],
    },
    {
      id: "rolls-royce-ghost",
      name: "Rolls-Royce Ghost",
      category: "luxury",
      price: 89999,
      rating: 5.0,
      seats: 5,
      transmission: "Automatic",
      fuel: "Petrol",
      image: "image/cars/Rolls-Royce Ghost.jpg",
      badge: "Ultra Luxury",
      features: ["Starlight Headliner", "Spirit of Ecstasy", "Bespoke Audio", "Magic Carpet Ride"],
    },
    {
      id: "land-rover-defender",
      name: "Land Rover Defender",
      category: "suv",
      price: 18999,
      rating: 4.6,
      seats: 7,
      transmission: "Automatic",
      fuel: "Diesel",
      image: "image/cars/Land Rover Defende.jpg",
      badge: "Adventure",
      features: ["Terrain Response 2", "Wade Sensing", "ClearSight", "Configurable Terrain Response"],
    },
    {
      id: "tata-harrier",
      name: "Tata Harrier",
      category: "suv",
      price: 12999,
      rating: 4.5,
      seats: 5,
      transmission: "Automatic",
      fuel: "Diesel",
      image: "image/cars/Tata Harrier.jpg",
      badge: "SUV",
      features: ["Panoramic Sunroof", "Terrain Response Mode", "JBL Audio", "ADAS Safety"]

    },
    {
      id: "mercedes-gls",
      name: "Mercedes GLS",
      category: "suv",
      price: 21999,
      rating: 4.8,
      seats: 7,
      transmission: "Automatic",
      fuel: "Petrol",
      image: "image/cars/mercede gls.jpg",
      badge: "S-Class of SUVs",
      features: ["AIRMATIC Suspension", "MBUX", "Burmester 3D", "E-ACTIVE BODY CONTROL"],
    },
    {
      id: "audi-e-tron",
      name: "Audi e-tron GT",
      category: "electric",
      price: 28999,
      rating: 4.8,
      seats: 4,
      transmission: "Automatic",
      fuel: "Electric",
      image: "image/cars/Audi e tron.jpg",
      badge: "Electric",
      features: ["800V Architecture", "Air Suspension", "Virtual Cockpit Plus", "Matrix LED"],
    },
    {
      id: "mahindra-be-6",
      name: "Mahindra BE 6",
      category: "electric",
      price: 9999,
      rating: 4.6,
      seats: 5,
      transmission: "Automatic",
      fuel: "Electric",
      image: "image/cars/Mahindra BE 6.jpg",
      badge: "Electric suv",
      features: ["Futuristic Design", "ADAS Safety Suite", "Large Touchscreen", "Fast Charging"]

    },
    {
      id: "porsche-taycan",
      name: "Porsche Taycan",
      category: "electric",
      price: 32999,
      rating: 4.9,
      seats: 4,
      transmission: "Automatic",
      fuel: "Electric",
      image: "image/cars/Porsche Taycan.jpg",
      badge: "Electric Sports",
      features: ["800V Fast Charging", "Air Suspension", "Sport Chrono", "Porsche Communication Management"],
    },
    {
      id: "byd-seal",
      name: "BYD Seal",
      category: "electric",
      price: 24999,
      rating: 4.7,
      seats: 5,
      transmission: "Automatic",
      fuel: "Electric",
      image: "image/cars/BYD SEAL.jpg",
      badge: "Electric Sedan",
      features: ["Long Range Battery", "Panoramic Glass Roof", "Advanced Driver Assistance", "Fast Charging"]

    },
    {
      id: "toyota-gr-supra",
      name: "Toyota GR Supra",
      category: "sports",
      price: 34999,
      rating: 4.8,
      seats: 2,
      transmission: "Automatic",
      fuel: "Petrol",
      image: "image/cars/Toyota GR Supra.jpg",
      badge: "Sports Car",
      features: ["Turbocharged Engine", "Adaptive Suspension", "Sport Seats", "Premium Audio System"]

    },
    {
      id: "maserati-quattroporte",
      name: "Maserati Quattroporte",
      category: "luxury",
      price: 26999,
      rating: 4.6,
      seats: 5,
      transmission: "Automatic",
      fuel: "Petrol",
      image: "image/cars/maserati quattroporte.jpg",
      badge: "Italian Luxury",
      features: ["Ferrari Engine", "Harman Kardon", "Skyhook Suspension", "Sport Mode"],
    },
    {
      id: "cadillac-escalade",
      name: "Cadillac Escalade",
      category: "suv",
      price: 23999,
      rating: 4.5,
      seats: 8,
      transmission: "Automatic",
      fuel: "Petrol",
      image: "image/cars/Cadillac Escalade.jpg",
      badge: "American Luxury",
      features: ["38-inch Curved OLED", "Super Cruise", "Magnetic Ride Control", "AKG Studio Reference"],
    },
    {
      id: "lexus-lx",
      name: "Lexus LX 600",
      category: "suv",
      price: 24999,
      rating: 4.6,
      seats: 7,
      transmission: "Automatic",
      fuel: "Petrol",
      image: "image/cars/Lexus LX 600.jpg",
      badge: "Off-Road Luxury",
      features: ["Multi-Terrain Select", "Crawl Control", "Mark Levinson", "Torsen Limited-Slip"],
    },
    {
      id: "genesis-g90",
      name: "Genesis G90",
      category: "luxury",
      price: 19999,
      rating: 4.7,
      seats: 5,
      transmission: "Automatic",
      fuel: "Petrol",
      image: "image/cars/genesis g90.jpg",
      badge: "Korean Luxury",
      features: ["Lexicon Audio", "Nappa Leather", "Smart Posture Care", "Highway Driving Assist"],
    },
    {
      id: "infiniti-qx80",
      name: "Infiniti QX80",
      category: "suv",
      price: 17999,
      rating: 4.4,
      seats: 8,
      transmission: "Automatic",
      fuel: "Petrol",
      image: "image/cars/infiniti qx80.jpg",
      badge: "Full-Size SUV",
      features: ["Around View Monitor", "Hydraulic Body Motion Control", "Bose Audio", "Intelligent 4WD"],
    },
  ]

  renderCars(carData)
}

function renderCars(cars) {
  if (!carGrid) return

  carGrid.innerHTML = cars
    .map(
      (car) => `
        <div class="car-card" data-category="${car.category}" data-price="${car.price}">
            <div class="car-image">
                <img src="${car.image}" alt="${car.name}">
                <div class="car-badge">${car.badge}</div>
                <div class="car-actions">
                    <button class="action-btn" title="Add to Favorites" onclick="toggleFavorite('${car.id}')">
                        <i class="far fa-heart"></i>
                    </button>
                    <button class="action-btn" title="Compare" onclick="addToCompare('${car.id}')">
                        <i class="fas fa-balance-scale"></i>
                    </button>
                </div>
            </div>
            <div class="car-info">
                <div class="car-header">
                    <h3>${car.name}</h3>
                    <div class="car-rating">
                        <div class="stars">
                            ${generateStars(car.rating)}
                        </div>
                        <span>(${car.rating})</span>
                    </div>
                </div>
                <div class="car-features">
                    <span><i class="fas fa-users"></i> ${car.seats} Seats</span>
                    <span><i class="fas fa-cog"></i> ${car.transmission}</span>
                    <span><i class="fas fa-${getFuelIcon(car.fuel)}"></i> ${car.fuel}</span>
                </div>
                <div class="car-price">
                    <span class="price">₹${formatIndianCurrency(car.price)}</span>
                    <span class="period">/day</span>
                </div>
                <button class="btn-primary btn-full" onclick="openCarDetails('${car.id}')">
                    View Details
                </button>
            </div>
        </div>
    `,
    )
    .join("")
}

// Add function to format Indian currency
function formatIndianCurrency(amount) {
  return amount.toLocaleString("en-IN")
}

function generateStars(rating) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0
  let stars = ""

  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star"></i>'
  }

  if (hasHalfStar) {
    stars += '<i class="fas fa-star-half-alt"></i>'
  }

  const emptyStars = 5 - Math.ceil(rating)
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star"></i>'
  }

  return stars
}

function getFuelIcon(fuel) {
  switch (fuel.toLowerCase()) {
    case "electric":
      return "bolt"
    case "hybrid":
      return "leaf"
    default:
      return "gas-pump"
  }
}

function filterCars(category) {
  let filteredCars = carData

  if (category !== "all") {
    filteredCars = carData.filter((car) => car.category === category)
  }

  renderCars(filteredCars)
}

function setActiveTab(activeTab) {
  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.classList.remove("active")
  })
  activeTab.classList.add("active")
}

function searchCars() {
  const searchTerm = carSearch.value.toLowerCase()
  const filteredCars = carData.filter(
    (car) => car.name.toLowerCase().includes(searchTerm) || car.category.toLowerCase().includes(searchTerm),
  )
  renderCars(filteredCars)
}

function filterByPrice() {
  const priceRange = priceFilter.value
  if (!priceRange) {
    renderCars(carData)
    return
  }

  let filteredCars = []

  if (priceRange === "500+") {
    filteredCars = carData.filter((car) => car.price >= 50000) // ₹50,000+
  } else {
    // Convert USD ranges to INR ranges
    const ranges = {
      "0-100": [0, 10000], // ₹0 - ₹10,000
      "100-200": [10000, 20000], // ₹10,000 - ₹20,000
      "200-500": [20000, 50000], // ₹20,000 - ₹50,000
    }

    if (ranges[priceRange]) {
      const [min, max] = ranges[priceRange]
      filteredCars = carData.filter((car) => car.price >= min && car.price <= max)
    }
  }

  renderCars(filteredCars)
}

// Car Actions
function toggleFavorite(carId) {
  if (!isLoggedIn) {
    openModal("loginModal")
    return
  }

  // Toggle favorite logic here
  console.log("Toggling favorite for car:", carId)
  showNotification("Added to favorites!", "success")
}

function addToCompare(carId) {
  // Add to compare logic here
  console.log("Adding to compare:", carId)
  showNotification("Added to comparison!", "info")
}

function openCarDetails(carId) {
  // Redirect to car details page
  window.location.href = `car-details.html?id=${carId}`
}

// Booking Functions
function handleQuickBooking(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const bookingData = {
    pickupLocation: formData.get("pickupLocation"),
    dropoffLocation: formData.get("dropoffLocation"),
    pickupDate: formData.get("pickupDate"),
    returnDate: formData.get("returnDate"),
  }

  // Validate dates
  if (new Date(bookingData.pickupDate) >= new Date(bookingData.returnDate)) {
    showNotification("Return date must be after pickup date", "error")
    return
  }

  // Store booking data and redirect
  localStorage.setItem("bookingData", JSON.stringify(bookingData))
  window.location.href = "cars.html"
}

function setDefaultDates() {
  const pickupDate = document.getElementById("pickupDate")
  const returnDate = document.getElementById("returnDate")

  if (pickupDate && returnDate) {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    pickupDate.value = today.toISOString().split("T")[0]
    returnDate.value = tomorrow.toISOString().split("T")[0]

    pickupDate.min = today.toISOString().split("T")[0]
    returnDate.min = tomorrow.toISOString().split("T")[0]

    pickupDate.addEventListener("change", function () {
      const selectedDate = new Date(this.value)
      const nextDay = new Date(selectedDate)
      nextDay.setDate(nextDay.getDate() + 1)
      returnDate.min = nextDay.toISOString().split("T")[0]

      if (new Date(returnDate.value) <= selectedDate) {
        returnDate.value = nextDay.toISOString().split("T")[0]
      }
    })
  }
}

// Authentication Functions
function updateUIForLoggedInUser() {
  const authButtons = document.querySelector(".nav-actions .btn-secondary, .nav-actions .btn-primary")
  if (authButtons) {
    authButtons.style.display = "none"
  }

  if (userMenu) {
    userMenu.classList.remove("hidden")
  }
}

function logout() {
  currentUser = null
  isLoggedIn = false
  localStorage.removeItem("currentUser")

  // Reset UI
  const authButtons = document.querySelectorAll(".nav-actions .btn-secondary, .nav-actions .btn-primary")
  authButtons.forEach((btn) => (btn.style.display = "inline-flex"))

  if (userMenu) {
    userMenu.classList.add("hidden")
  }

  showNotification("Logged out successfully", "success")
}

// Testimonial Slider
function startTestimonialSlider() {
  const testimonials = document.querySelectorAll(".testimonial-card")
  if (testimonials.length === 0) return

  setInterval(() => {
    testimonials[currentTestimonial].classList.remove("active")
    currentTestimonial = (currentTestimonial + 1) % testimonials.length
    testimonials[currentTestimonial].classList.add("active")
  }, 5000)
}

// Animations
function initializeAnimations() {
  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1"
        entry.target.style.transform = "translateY(0)"
      }
    })
  }, observerOptions)

  // Observe elements for animation
  const animatedElements = document.querySelectorAll(".car-card, .service-card, .testimonial-card")
  animatedElements.forEach((el) => {
    el.style.opacity = "0"
    el.style.transform = "translateY(30px)"
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease"
    observer.observe(el)
  })
}

// Utility Functions
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `

  // Add styles
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        z-index: 3000;
        min-width: 300px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        border-left: 4px solid ${getNotificationColor(type)};
    `

  document.body.appendChild(notification)

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)"
  }, 100)

  // Auto remove
  setTimeout(() => {
    notification.style.transform = "translateX(100%)"
    setTimeout(() => notification.remove(), 300)
  }, 4000)
}

function getNotificationIcon(type) {
  switch (type) {
    case "success":
      return "check-circle"
    case "error":
      return "exclamation-circle"
    case "warning":
      return "exclamation-triangle"
    default:
      return "info-circle"
  }
}

function getNotificationColor(type) {
  switch (type) {
    case "success":
      return "#34C759"
    case "error":
      return "#FF3B30"
    case "warning":
      return "#FF9500"
    default:
      return "#007AFF"
  }
}

// Form Validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

function validatePhone(phone) {
  const re = /^[+]?[1-9][\d]{0,15}$/
  return re.test(phone.replace(/\s/g, ""))
}

// Local Storage Helpers
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    console.error("Error saving to localStorage:", error)
    return false
  }
}

function getFromLocalStorage(key) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("Error reading from localStorage:", error)
    return null
  }
}

// Performance Optimization
function lazyLoadImages() {
  const images = document.querySelectorAll("img[data-src]")
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target
        img.src = img.dataset.src
        img.removeAttribute("data-src")
        imageObserver.unobserve(img)
      }
    })
  })

  images.forEach((img) => imageObserver.observe(img))
}



// Initialize lazy loading when DOM is ready
document.addEventListener("DOMContentLoaded", lazyLoadImages)

// Export functions for use in other files
window.CarRentalApp = {
  openModal,
  closeModal,
  switchModal,
  toggleFavorite,
  addToCompare,
  openCarDetails,
  logout,
  showNotification,
}
