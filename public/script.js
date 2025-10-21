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

// Nav indicator slider
function positionNavIndicator() {
  const menu = document.getElementById('nav-menu')
  const indicator = document.getElementById('nav-indicator')
  if (!menu || !indicator) return

  const active = menu.querySelector('.nav-link.active') || menu.querySelector('.nav-link')
  if (!active) return

  const rect = active.getBoundingClientRect()
  const menuRect = menu.getBoundingClientRect()
  const left = rect.left - menuRect.left
  indicator.style.width = rect.width + 'px'
  indicator.style.transform = `translateX(${left}px)`
}

// Attach nav click handlers
function setupNavIndicator() {
  const menu = document.getElementById('nav-menu')
  if (!menu) return
  menu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function (e) {
      menu.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'))
      this.classList.add('active')
      positionNavIndicator()
    })
  })

  // reposition on resize
  window.addEventListener('resize', positionNavIndicator)
  // initial position
  document.addEventListener('DOMContentLoaded', positionNavIndicator)
}

// call setupNavIndicator at the end of setupEventListeners
const originalSetup = setupEventListeners
setupEventListeners = function () {
  originalSetup()
  setupNavIndicator()
}

// --- Homepage/Cars filter helpers ---
function getAllCarCards(root = document) {
  return Array.from(root.querySelectorAll('.car-card'))
}

function filterCars(category = 'all') {
  const cards = getAllCarCards(document)
  const searchVal = (document.getElementById('carSearch') && document.getElementById('carSearch').value.toLowerCase()) || ''
  const priceFilter = (document.getElementById('priceFilter') && document.getElementById('priceFilter').value) || ''

  const [minStr, maxStr] = priceFilter.split('-')
  const min = minStr ? parseFloat(minStr) * 100 : 0
  const max = (maxStr && maxStr !== '+') ? parseFloat(maxStr) * 100 : Infinity

  cards.forEach(card => {
    const cat = (card.dataset.category || '').toLowerCase()
    const priceText = (card.dataset.price || '').replace(/[^0-9.]/g, '')
    const price = priceText ? parseFloat(priceText) : 0
    const title = (card.querySelector('.car-name') ? card.querySelector('.car-name').textContent : card.querySelector('h3')?.textContent || '').toLowerCase()

    let visible = true
    if (category && category !== 'all' && cat !== category.toLowerCase()) visible = false
    if (searchVal && !title.includes(searchVal)) visible = false
    if (!(price >= min && price <= max)) visible = false

    card.style.display = visible ? 'block' : 'none'
  })

  // update results count if present
  const resultsEl = document.getElementById('resultsCount')
  if (resultsEl) {
    const visibleCount = getAllCarCards(document).filter(c => c.style.display !== 'none').length
    resultsEl.textContent = `${visibleCount} cars found`
  }
}

function setActiveTab(tabEl) {
  const tabs = document.querySelectorAll('.filter-tab')
  tabs.forEach(t => t.classList.remove('active'))
  if (tabEl) tabEl.classList.add('active')
}

function filterByPrice() {
  filterCars(document.querySelector('.filter-tab.active')?.dataset.category || 'all')
}

function searchCars() {
  filterCars(document.querySelector('.filter-tab.active')?.dataset.category || 'all')
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.remove("active")
    document.body.style.overflow = ""
  }
}

// ... rest of script.js functions ...

// To keep this duplicate lightweight, complex page-specific functions are left in views or public/js
