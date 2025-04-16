// Initialize the document when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeBookingSystem);

function initializeBookingSystem() {
    console.log('Initializing booking system...');
    
    // Load station information from localStorage
    const stationAddress = localStorage.getItem('selectedStationAddress');
    const stationName = localStorage.getItem('selectedStationName') || 'Green EV Charging Hub';
    const stationId = localStorage.getItem('selectedStationId') || '';
    const stationLat = localStorage.getItem('selectedStationLat');
    const stationLng = localStorage.getItem('selectedStationLng');
    
    // Show "No station selected" if there's no address
    if (!stationAddress) {
        // Show placeholder or alert
        console.log('No station selected');
        document.querySelector('.station-card').classList.add('no-station-selected');
        
        // Add a "Find Station" button if it doesn't exist
        const stationCard = document.querySelector('.station-card');
        if (stationCard && !document.querySelector('.find-station-btn')) {
            const findStationBtn = document.createElement('button');
            findStationBtn.className = 'btn btn-primary find-station-btn';
            findStationBtn.textContent = 'Find a Station';
            findStationBtn.addEventListener('click', () => {
                window.location.href = 'ev_search.html';
            });
            stationCard.appendChild(findStationBtn);
        }
        
        // Hide the my-location section if there's no station
        const myLocationSection = document.querySelector('.my-location-section');
        if (myLocationSection) {
            myLocationSection.style.display = 'none';
        }
    } else {
        // Update station information in the UI
        document.querySelector('.station-card')?.classList.remove('no-station-selected');
        updateStationInformation(stationName, stationAddress, stationId);
        
        // Automatically detect user location if we have station coordinates
        if (stationLat && stationLng && navigator.geolocation) {
            // Delay to ensure DOM is ready
            setTimeout(() => {
                detectMyLocation();
            }, 1000);
        }
    }
    
    // Initialize date and time selection
    initializeDateTimeSelection();
    
    // Initialize libraries
    loadSweetAlert();
    loadJsPDF();
    
    // Set up booking form event listeners
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showPaymentModal();
        });
    }
    
    // Add event listeners for payment modal
    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) {
        const closeButtons = paymentModal.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', closePaymentModal);
        });
    }
    
    // Add event listeners for receipt modal
    const receiptModal = document.getElementById('receipt-modal');
    if (receiptModal) {
        const closeButtons = receiptModal.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', closeReceiptModal);
        });
    }
    
    // Set barcode placeholder data
    const barcodeEl = document.querySelector('.barcode-placeholder');
    if (barcodeEl) {
        barcodeEl.setAttribute('data-id', 'EV-' + Math.floor(10000 + Math.random() * 90000));
    }
    
    // Initialize payment options
    initializePaymentOptions();
    
    // Set up payment button explicitly
    setupPaymentButtons();
    
    // Set up port type selection
    setupPortTypeSelection();
}

// Initialize date and time selection
function initializeDateTimeSelection() {
    const datePicker = document.getElementById('booking-date');
    
    if (!datePicker) return;
    
    // Initialize flatpickr for date selection
    if (typeof flatpickr !== 'undefined') {
        const today = new Date();
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 14); // Allow booking up to 14 days in advance
        
        flatpickr('#booking-date', {
            minDate: 'today',
            maxDate: maxDate,
            dateFormat: 'Y-m-d',
            disableMobile: true,
            onChange: function(selectedDates) {
                generateTimeSlotAvailability(selectedDates[0]);
                updateDateQuickButtons(selectedDates[0]);
            }
        });
    }
    
    // Set up quick date buttons
    setupQuickDateButtons();
    
    // Set up time slots
    setupTimeSlots();
    
    // Initialize with today's date
    const today = new Date();
    generateTimeSlotAvailability(today);
    
    // Pre-select Today button
    const todayBtn = document.querySelector('.date-quick-btn[data-date="today"]');
    if (todayBtn) {
        todayBtn.classList.add('active');
    }
}

// Set up quick date buttons
function setupQuickDateButtons() {
    const quickButtons = document.querySelectorAll('.date-quick-btn');
    const datePicker = document.getElementById('booking-date');
    
    if (!quickButtons.length || !datePicker || !datePicker._flatpickr) return;
    
    quickButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const dateType = this.getAttribute('data-date');
            const today = new Date();
            let targetDate;
            
            switch(dateType) {
                case 'today':
                    targetDate = today;
                    break;
                case 'tomorrow':
                    targetDate = new Date(today);
                    targetDate.setDate(today.getDate() + 1);
                    break;
                default:
                    targetDate = today;
            }
            
            // Set date in flatpickr
            datePicker._flatpickr.setDate(targetDate);
            
            // Update UI
            quickButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Update date quick buttons based on selected date
function updateDateQuickButtons(selectedDate) {
    const quickButtons = document.querySelectorAll('.date-quick-btn');
    if (!quickButtons.length) return;
    
    // Reset active state
    quickButtons.forEach(btn => btn.classList.remove('active'));
    
    // Get selected date string
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    // Get today and tomorrow strings
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Activate appropriate button
    if (selectedDateStr === todayStr) {
        document.querySelector('.date-quick-btn[data-date="today"]')?.classList.add('active');
    } else if (selectedDateStr === tomorrowStr) {
        document.querySelector('.date-quick-btn[data-date="tomorrow"]')?.classList.add('active');
    }
}

// Set up time slots
function setupTimeSlots() {
    const timeSlots = document.querySelectorAll('.time-slot-btn');
    if (!timeSlots.length) return;
    
    timeSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            if (this.classList.contains('unavailable')) return;
            
            // Remove selected class from all slots
            timeSlots.forEach(s => s.classList.remove('selected'));
            
            // Add selected class to clicked slot
            this.classList.add('selected');
            
            // Update hidden input field
            const timeValue = this.getAttribute('data-time');
            const timeInput = document.getElementById('booking-time');
            if (timeInput) {
                timeInput.value = timeValue;
            }
            
            // Update display
            updateSelectedTimeDisplay(this);
        });
    });
}

// Update selected time display
function updateSelectedTimeDisplay(selectedSlot) {
    const displayEl = document.getElementById('selected-slot-display');
    if (!displayEl || !selectedSlot) return;
    
    const timeValue = selectedSlot.getAttribute('data-time');
    const hours = parseInt(timeValue.split(':')[0]);
    const isPM = hours >= 12;
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    const formattedTime = `${displayHours}:00 ${isPM ? 'PM' : 'AM'}`;
    
    // Get duration
    const durationSelect = document.getElementById('duration');
    const duration = durationSelect ? parseInt(durationSelect.value) : 1;
    
    // Calculate end time
    const endHours = hours + duration;
    const endIsPM = endHours >= 12;
    const endDisplayHours = endHours > 12 ? endHours - 12 : (endHours === 0 ? 12 : endHours);
    const formattedEndTime = `${endDisplayHours}:00 ${endIsPM ? 'PM' : 'AM'}`;
    
    // Update display
    displayEl.textContent = `${formattedTime} - ${formattedEndTime} (${duration} hour${duration > 1 ? 's' : ''})`;
    displayEl.parentElement.classList.add('has-selection');
}

// Generate random availability for time slots
function generateTimeSlotAvailability(date) {
    const timeSlots = document.querySelectorAll('.time-slot-btn');
    if (!timeSlots.length) return;
    
    // First reset all slots
    timeSlots.forEach(slot => {
        slot.classList.remove('unavailable', 'selected');
        
        // Remove existing unavailable indicators
        const existingUnavailable = slot.querySelector('.unavailable-tag');
        if (existingUnavailable) {
            existingUnavailable.remove();
        }
    });
    
    // Clear the time selection display
    const displayEl = document.getElementById('selected-slot-display');
    if (displayEl) {
        displayEl.textContent = 'Select a time slot';
        displayEl.parentElement.classList.remove('has-selection');
    }
    
    // Clear hidden input
    const timeInput = document.getElementById('booking-time');
    if (timeInput) {
        timeInput.value = '';
    }
    
    // Generate date-based seed for randomization
    const dateString = date.toISOString().split('T')[0];
    const dateSeed = dateString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = new Math.seedrandom(dateSeed);
    
    // Generate 3-5 unavailable slots based on the date
    const unavailableCount = Math.floor(random() * 3) + 3;
    const unavailableSlots = [];
    
    while (unavailableSlots.length < unavailableCount) {
        const randomIndex = Math.floor(random() * timeSlots.length);
        if (!unavailableSlots.includes(randomIndex)) {
            unavailableSlots.push(randomIndex);
        }
    }
    
    // Mark unavailable slots
    unavailableSlots.forEach(index => {
        if (timeSlots[index]) {
            timeSlots[index].classList.add('unavailable');
        }
    });
}

// Set up port type selection
function setupPortTypeSelection() {
    // Add event listeners for port type selection
    document.querySelectorAll('input[name="charging-port"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.radio-card').forEach(card => {
                card.classList.remove('selected');
            });
            this.closest('.radio-card').classList.add('selected');
        });
    });
}

// Add a dedicated function to set up payment buttons
function setupPaymentButtons() {
    console.log('Setting up payment buttons');
    
    // Set up the Pay Now button in the payment modal
    const payButton = document.querySelector('.modal-footer .btn-primary');
    if (payButton) {
        console.log('Found payment button:', payButton);
        // Remove any existing event listeners
        payButton.removeEventListener('click', processPayment);
        // Add new event listener
        payButton.addEventListener('click', processPayment);
        } else {
        console.error('Pay Now button not found in modal footer');
    }
}

function initializePaymentOptions() {
    // Set up payment option buttons
        document.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', function() {
            // Get the payment type from the radio button ID
            const radioId = this.querySelector('input[type="radio"]').id;
            const paymentType = radioId.split('-')[1]; // Extract payment type from ID
            selectPaymentOption(this, radioId);
        });
    });
    
    // Set up UPI app selection
    document.querySelectorAll('.upi-app').forEach(app => {
        app.addEventListener('click', function() {
            selectUpiApp(this);
        });
    });
    
    // Set up wallet selection
    document.querySelectorAll('.wallet-option').forEach(wallet => {
        wallet.addEventListener('click', function() {
            selectWallet(this);
        });
    });
    
    // Set up bank selection
    document.querySelectorAll('.bank-icon').forEach(bank => {
        bank.addEventListener('click', function() {
            const bankCode = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            selectBank(bankCode);
        });
    });
    
    // We'll handle the payment button setup in the dedicated function
}

function selectPaymentOption(element, radioId) {
        document.querySelectorAll('.payment-option').forEach(option => {
            option.classList.remove('selected');
        });
        element.classList.add('selected');
        document.getElementById(radioId).checked = true;
    
    // Hide all payment method sections
    document.querySelectorAll('.payment-method-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the selected payment method section
    const paymentType = radioId.split('-')[1]; // Extract payment type from ID
    const sectionId = `${paymentType}-payment-section`;
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
        
        // Special handling for card section - focus on first input
        if (paymentType === 'card') {
            setTimeout(() => {
                const cardNumberInput = section.querySelector('input');
                if (cardNumberInput) {
                    cardNumberInput.focus();
                }
            }, 100);
        }
    }
}

function processPayment() {
        console.log("Process payment called");
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
        
        if (!paymentMethod) {
            console.log("No payment method selected");
            Swal.fire({
                title: 'Payment Method Required',
                text: 'Please select a payment method to proceed.',
                icon: 'warning',
                confirmButtonText: 'OK',
                confirmButtonColor: '#3498db'
            });
            return;
        }
        
        console.log("Payment method selected:", paymentMethod.value);
        
    // For demo purposes, we'll just proceed to payment processing regardless of payment method
    // In a real app, we would handle different payment methods differently
    showPaymentProcessing();
}

function showPaymentProcessing() {
        Swal.fire({
        title: 'Processing Payment',
        html: 'Please wait while we process your payment...',
        timerProgressBar: true,
        didOpen: () => {
            Swal.showLoading();
            setTimeout(() => {
                processPaymentTransaction();
            }, 2000);
        },
        allowOutsideClick: false
    });
}

function processPaymentTransaction() {
    // Close payment modal
    closePaymentModal();
    
    // Show loading animation
    Swal.fire({
        title: 'Processing Payment',
        html: 'Please wait while we process your payment...',
        timerProgressBar: true,
        didOpen: () => {
            Swal.showLoading();
        setTimeout(() => {
                    Swal.close();
                showSuccessModal();
                createConfetti();
                updateReceiptDetails();
                showReceiptModal();
            }, 2000);
        },
        allowOutsideClick: false
    });
}

function showSuccessModal() {
    const modal = document.getElementById('success-modal');
    const receiptModal = document.getElementById('receipt-modal');
    
    // Generate random booking ID
    const randomId = Math.floor(Math.random() * 90000) + 10000;
    document.getElementById('random-id').textContent = randomId;
    
    // Update booking summary in the success modal
    updateBookingSummary(document.querySelector('#success-modal .booking-summary'));
    
    // Show success modal
    modal.style.display = 'flex';
    modal.classList.add('show');
    
    // Add button to show receipt
    const footerEl = document.querySelector('#success-modal .modal-footer');
    if (footerEl && !document.getElementById('view-receipt-btn')) {
        const receiptBtn = document.createElement('button');
        receiptBtn.id = 'view-receipt-btn';
        receiptBtn.className = 'btn btn-outline';
        receiptBtn.innerHTML = '<i class="fas fa-receipt"></i> View Receipt';
        receiptBtn.onclick = function() {
            modal.style.display = 'none';
            modal.classList.remove('show');
            showReceiptModal();
        };
        footerEl.prepend(receiptBtn);
    }
}

function showReceiptModal() {
    const modal = document.getElementById('receipt-modal');
    
    // Update receipt information
    updateReceiptDetails();
    
    // Show receipt modal
    modal.style.display = 'flex';
    modal.classList.add('show');
}

function showPaymentModal() {
    console.log("showPaymentModal called");
    if (validateBookingForm()) {
        console.log("Form validation passed");
        updateBookingSummary();
        console.log("Attempting to show payment modal");
        const paymentModal = document.getElementById('payment-modal');
        paymentModal.style.display = 'flex';
        paymentModal.classList.add('show'); // Add show class for animation
        console.log("Payment modal display style set to flex and show class added");
        
        // Make sure the payment button has the event listener
        const payButton = paymentModal.querySelector('.modal-footer .btn-primary');
        if (payButton) {
            console.log("Adding click event listener to Pay Now button");
            // Remove any existing event listeners
            payButton.removeEventListener('click', processPayment);
            // Add new event listener
            payButton.addEventListener('click', processPayment);
            // Log to confirm the listener was added
            console.log("Pay Now button is now clickable");
        }
    } else {
        console.log("Form validation failed");
        // Form validation failed, show error
        const invalidFields = document.querySelectorAll('.form-control.error');
        if (invalidFields.length > 0) {
            invalidFields[0].focus();
            invalidFields[0].classList.add('shake');
            setTimeout(() => {
                invalidFields[0].classList.remove('shake');
            }, 600);
        }
    }
}

function closePaymentModal() {
    const paymentModal = document.getElementById('payment-modal');
    paymentModal.classList.remove('show');
    setTimeout(() => {
        paymentModal.style.display = 'none';
    }, 300); // Wait for animation to complete
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('selected');
    });
}

function closeReceiptModal() {
    const modal = document.getElementById('receipt-modal');
    modal.classList.remove('show');
        setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function validateBookingForm() {
    let isValid = true;
    const requiredFields = [
        'station-address',
        'vehicle-type',
        'vehicle-model',
        'vehicle-number',
        'booking-date',
        'booking-time'
    ];
    
    // Check required fields
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field) return; // Skip if field doesn't exist
        
        const errorElement = field.nextElementSibling?.classList.contains('error-message') 
            ? field.nextElementSibling 
            : null;
        
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
            
            if (!errorElement) {
                const error = document.createElement('div');
                error.className = 'error-message';
                error.innerHTML = `<i class="fas fa-exclamation-circle"></i> This field is required`;
                field.parentNode.insertBefore(error, field.nextSibling);
            }
            
            // Special message for station address
            if (fieldId === 'station-address') {
                    Swal.fire({
                    title: 'No Station Selected',
                    text: 'Please select a charging station from the Find Stations page',
                    icon: 'warning',
                    confirmButtonText: 'Go to Find Stations',
                    showCancelButton: true,
                    cancelButtonText: 'Cancel'
                    }).then((result) => {
                        if (result.isConfirmed) {
                        window.location.href = 'ev_search.html';
                    }
                });
            }
        } else {
            field.classList.remove('error');
            if (errorElement) errorElement.remove();
        }
    });
    
    // Check if charging port is selected
    const chargingPort = document.querySelector('input[name="charging-port"]:checked');
    const portErrorElement = document.querySelector('.radio-group + .error-message');
    
    if (!chargingPort) {
        isValid = false;
        if (!portErrorElement) {
            const error = document.createElement('div');
            error.className = 'error-message';
            error.innerHTML = `<i class="fas fa-exclamation-circle"></i> Please select a charging port type`;
            document.querySelector('.radio-group').after(error);
        }
    } else if (portErrorElement) {
        portErrorElement.remove();
    }
    
    return isValid;
}

function updateBookingSummary(summaryEl) {
        const stationAddress = document.getElementById('station-address').value;
        const vehicleType = document.getElementById('vehicle-type').value;
        const vehicleModel = document.getElementById('vehicle-model').value;
        const vehicleNumber = document.getElementById('vehicle-number').value;

    // Check if charging port is selected
    const chargingPort = document.querySelector('input[name="charging-port"]:checked')?.value || 'Type 2';
    
        const bookingDate = document.getElementById('booking-date').value;
        const bookingTime = document.getElementById('booking-time').value;
        const duration = document.getElementById('duration').value;
        
        // Format date and time
    const dateObj = new Date(bookingDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
            day: 'numeric' 
        });
        
    // If summary element is not specified, use the one in payment modal
    const summaryContainer = summaryEl || document.querySelector('#payment-modal .booking-summary');
    
    if (!summaryContainer) return;
    
    // Clear existing content
    summaryContainer.innerHTML = '';
    
    // Add summary items
    const summaryItems = [
        { label: 'Station', value: stationAddress },
        { label: 'Vehicle', value: `${vehicleModel} (${vehicleType})` },
        { label: 'Reg Number', value: vehicleNumber },
        { label: 'Date', value: formattedDate },
        { label: 'Time', value: bookingTime },
        { label: 'Duration', value: `${duration} hour${duration > 1 ? 's' : ''}` },
        { label: 'Port Type', value: chargingPort }
    ];
    
    summaryItems.forEach(item => {
        const summaryItem = document.createElement('div');
        summaryItem.className = 'summary-item';
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'summary-item-label';
        labelSpan.textContent = item.label;
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'summary-item-value';
        valueSpan.textContent = item.value;
        
        summaryItem.appendChild(labelSpan);
        summaryItem.appendChild(valueSpan);
        
        summaryContainer.appendChild(summaryItem);
    });
    }
    
    function createConfetti() {
        const confettiContainer = document.getElementById('confetti-container');
    if (!confettiContainer) return;
    
        confettiContainer.innerHTML = '';
        
    const colors = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c'];
    
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.backgroundColor = getRandomColor();
        
            confettiContainer.appendChild(confetti);
        }
        
        // Remove confetti after animation
        setTimeout(() => {
            confettiContainer.innerHTML = '';
        }, 5000);
    }
    
function getRandomColor() {
    const colors = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function showCardPaymentForm() {
    // Instead of showing SweetAlert, use our embedded form and simulate submission
    const cardSection = document.getElementById('card-payment-section');
    
    if (cardSection) {
        // Focus on card number field
        const cardNumberInput = cardSection.querySelector('input');
        if (cardNumberInput) {
            cardNumberInput.focus();
        }
        
        // Change button text
        const payButton = document.querySelector('.modal-footer .btn-primary');
        if (payButton) {
            payButton.textContent = 'Pay ₹149';
        }
    }
}

function showUPIPaymentForm() {
    // UPI section should already be visible, no need to show a SweetAlert
    // But we could add additional functionality here if needed
    const upiSection = document.getElementById('upi-payment-section');
    if (upiSection && upiSection.style.display === 'block') {
        // It's already visible, just highlight the QR code
        const qrCode = upiSection.querySelector('.qr-code-placeholder');
        if (qrCode) {
            qrCode.classList.add('highlight');
            setTimeout(() => {
                qrCode.classList.remove('highlight');
            }, 1000);
        }
    }
}

function showNetbankingForm() {
    // Netbanking section should already be visible, no need to show a SweetAlert
    // But we could add additional functionality here if needed
    const netbankingSection = document.getElementById('netbanking-payment-section');
    if (netbankingSection) {
        const bankSelect = netbankingSection.querySelector('select');
        if (bankSelect) {
            bankSelect.focus();
        }
    }
}

function showWalletForm() {
    // Wallet section should already be visible, no need to show a SweetAlert
    // But we could add additional functionality here if needed
    const walletSection = document.getElementById('wallet-payment-section');
    if (walletSection) {
        // Highlight wallet options
        const walletOptions = walletSection.querySelectorAll('.wallet-option');
        walletOptions.forEach(option => {
            option.classList.add('highlight');
            setTimeout(() => {
                option.classList.remove('highlight');
            }, 1000);
        });
    }
}

function resetForm() {
        document.getElementById('booking-form').reset();
        
        // Clear selected states
        document.querySelectorAll('.radio-card').forEach(card => {
            card.classList.remove('selected');
        });
        
    document.querySelectorAll('.time-slot-btn').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        // Reset flatpickr instances if they exist
        const dateInput = document.getElementById('booking-date');
        if (dateInput && dateInput._flatpickr) {
            dateInput._flatpickr.clear();
        }
        
        const timeInput = document.getElementById('booking-time');
        if (timeInput && timeInput._flatpickr) {
            timeInput._flatpickr.clear();
        }

    // Remove any error messages
    document.querySelectorAll('.error-message').forEach(error => {
        error.remove();
    });
    
    // Remove error class from inputs
    document.querySelectorAll('.form-control.error').forEach(input => {
        input.classList.remove('error');
    });
}

function updateReceiptDetails() {
    // Get form values
    const stationAddress = document.getElementById('station-address').value;
    const vehicleType = document.getElementById('vehicle-type').value;
    const vehicleModel = document.getElementById('vehicle-model').value;
    const vehicleNumber = document.getElementById('vehicle-number')?.value;
    const bookingDate = document.getElementById('booking-date').value;
    const bookingTime = document.getElementById('booking-time').value;
    const duration = document.getElementById('duration').value;
    const chargingPort = document.querySelector('input[name="charging-port"]:checked')?.value || 'Type 2';
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'UPI';
    
    // Format date and time
    const dateObj = new Date(bookingDate + 'T' + bookingTime);
    const formattedDateTime = dateObj.toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
    
    // Random booking ID
    const randomId = Math.floor(Math.random() * 90000) + 10000;
    
    // Generate transaction ID
    const transactionId = 'TXN' + Date.now().toString().substring(5) + Math.floor(Math.random() * 1000);
    
    // Current date for payment date
    const now = new Date();
    const paymentDate = now.toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
    
    // Update receipt fields
    document.getElementById('receipt-booking-id').textContent = 'EV-2023-' + randomId;
    document.getElementById('receipt-datetime').textContent = formattedDateTime;
    document.getElementById('receipt-duration').textContent = duration + ' hour' + (duration > 1 ? 's' : '');
    document.getElementById('receipt-station-name').textContent = 'Green EV Charging Hub';
    document.getElementById('receipt-station-address').textContent = stationAddress;
    document.getElementById('receipt-vehicle').textContent = vehicleModel + ' (' + vehicleType + ')';
    document.getElementById('receipt-reg-number').textContent = vehicleNumber;
    document.getElementById('receipt-payment-method').textContent = paymentMethod.toUpperCase();
    document.getElementById('receipt-transaction-id').textContent = transactionId;
    document.getElementById('receipt-payment-date').textContent = paymentDate;
    document.getElementById('receipt-charging-port').textContent = chargingPort;
    
    // Set barcode data-id
    const barcodeEl = document.querySelector('.barcode-placeholder');
    if (barcodeEl) {
        barcodeEl.setAttribute('data-id', transactionId);
    }
    
    // Calculate payment details
    const baseRate = 15; // Base rate per hour
    const hours = parseFloat(duration);
    const chargingFee = baseRate * hours;
    const serviceFee = chargingFee * 0.05; // 5% service fee
    const taxAmount = (chargingFee + serviceFee) * 0.18; // 18% tax
    const totalAmount = chargingFee + serviceFee + taxAmount;
    
    // Update payment details in receipt
    const paymentRows = document.querySelectorAll('.receipt-payment .receipt-row');
    if (paymentRows.length >= 6) {
        paymentRows[0].querySelector(':nth-child(2)').textContent = '₹' + chargingFee.toFixed(2);
        paymentRows[1].querySelector(':nth-child(2)').textContent = '₹' + serviceFee.toFixed(2);
        paymentRows[2].querySelector(':nth-child(2)').textContent = '₹' + taxAmount.toFixed(2);
        paymentRows[3].querySelector(':nth-child(2)').textContent = '₹' + totalAmount.toFixed(2);
    }
}

function downloadReceipt() {
    // Check if jsPDF is loaded
    if (typeof jspdf === 'undefined') {
        Swal.fire({
            title: 'Error',
            text: 'PDF generation library is not loaded. Please try again later.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    // Create new PDF document
    const { jsPDF } = jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    // Set title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('EV Charging Receipt', 105, 20, { align: 'center' });
    
    // Add logo/circle
    doc.setFillColor(25, 118, 210);
    doc.circle(105, 35, 8, 'F');
    
    // Add lightning symbol
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('⚡', 105, 38, { align: 'center' });
    
    // Status section
    doc.setFontSize(14);
    doc.setTextColor(46, 125, 50);
    doc.text('PAYMENT SUCCESSFUL', 105, 55, { align: 'center' });
    
    // Booking Information section
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Booking Information', 20, 70);
    doc.setDrawColor(220, 220, 220);
    doc.line(20, 72, 190, 72);
    
    doc.setFontSize(10);
    doc.text('Booking ID:', 20, 78);
    doc.text(document.getElementById('receipt-booking-id').textContent, 70, 78);
    
    doc.text('Date & Time:', 20, 85);
    doc.text(document.getElementById('receipt-datetime').textContent, 70, 85);
    
    doc.text('Duration:', 20, 92);
    doc.text(document.getElementById('receipt-duration').textContent, 70, 92);
    
    doc.text('Payment Date:', 20, 99);
    doc.text(document.getElementById('receipt-payment-date').textContent, 70, 99);
    
    // Station Details section
    doc.setFontSize(12);
    doc.text('Station Details', 20, 120);
    doc.line(20, 122, 190, 122);
    
    doc.setFontSize(10);
    doc.text('Station:', 20, 128);
    doc.text(document.getElementById('receipt-station-name').textContent, 70, 128);
    
    doc.text('Address:', 20, 135);
    doc.text(document.getElementById('receipt-station-address').textContent, 70, 135);
    
    doc.text('Charging Port:', 20, 142);
    doc.text(document.getElementById('receipt-charging-port').textContent, 70, 142);
    
    // Vehicle Details section
    doc.setFontSize(12);
    doc.text('Vehicle Details', 20, 160);
    doc.line(20, 162, 190, 162);
    
    doc.setFontSize(10);
    doc.text('Vehicle:', 20, 168);
    doc.text(document.getElementById('receipt-vehicle').textContent, 70, 168);
    
    doc.text('Reg. Number:', 20, 175);
    doc.text(document.getElementById('receipt-reg-number').textContent, 70, 175);
    
    // Payment Details
    doc.setFontSize(12);
    doc.text('Payment Details', 20, 190);
    doc.line(20, 192, 190, 192);
    
    doc.setFontSize(10);
    doc.text('Charging Fee:', 20, 199);
    doc.text('₹120.00', 70, 199);
    
    doc.text('Service Fee:', 20, 206);
    doc.text('₹20.00', 70, 206);
    
    doc.text('Tax:', 20, 213);
    doc.text('₹9.00', 70, 213);
    
    doc.setFontSize(12);
    doc.text('Total Amount:', 20, 223);
    doc.text('₹149.00', 70, 223);
    
    doc.setFontSize(10);
    doc.text('Payment Method:', 20, 230);
    doc.text(document.getElementById('receipt-payment-method').textContent, 70, 230);
    
    doc.text('Transaction ID:', 20, 237);
    doc.text(document.getElementById('receipt-transaction-id').textContent, 70, 237);
    
    doc.text('Status:', 20, 244);
    doc.setTextColor(46, 125, 50);
    doc.text('Paid ✓', 70, 244);
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for choosing our EV charging service!', 105, 260, { align: 'center' });
    doc.text('For support: support@evcharging.com | Customer Care: +91 123-456-7890', 105, 265, { align: 'center' });
    
    // Save the PDF
    doc.save('ev-charging-receipt.pdf');
}

function printReceipt() {
    const printWindow = window.open('', '_blank', 'height=700,width=650,left=100,top=100');
    
    printWindow.document.write(`
        <html>
        <head>
            <title>EV Charging Receipt</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            <style>
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                    }
                    .print-wrapper {
                        max-width: 100%;
                        padding: 15px;
                    }
                    .print-controls {
                        display: none !important;
                    }
                }
                
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    background-color: #f8f9fa;
                }
                
                .print-wrapper {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 0 15px rgba(0,0,0,0.1);
                }
                
                .receipt-header {
                    text-align: center;
                    padding-bottom: 20px;
                    border-bottom: 2px dashed #eee;
                    margin-bottom: 20px;
                }
                
                .receipt-logo {
                    width: 60px;
                    height: 60px;
                    background-color: #1976d2;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 15px;
                    color: white;
                    font-size: 24px;
                }
                
                .receipt-header h2 {
                    margin: 10px 0;
                    color: #333;
                }
                
                .receipt-status {
                    display: inline-block;
                    padding: 5px 15px;
                    background-color: #e8f5e9;
                    color:rgb(0, 0, 0);
                    border-radius: 20px;
                    font-weight: 600;
                    margin-top: 10px;
                }
                
                .receipt-info, .receipt-station, .receipt-vehicle, .receipt-payment {
                    margin-bottom: 25px;
                }
                
                .receipt-info-title {
                    font-weight: 600;
                    color: #1976d2;
                    padding-bottom: 8px;
                    margin-bottom: 12px;
                    border-bottom: 1px solid #eee;
                }
                
                .receipt-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    padding: 4px 0;
                }
                
                .receipt-row.total {
                    font-weight: bold;
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid #eee;
                }
                
                .receipt-footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px dashed #eee;
                }
                
                .receipt-contact {
                    margin-top: 15px;
                    font-size: 12px;
                    color: #666;
                }
                
                .print-controls {
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 15px;
                    border-top: 1px solid #eee;
                }
                
                .print-btn {
                    background-color: #1976d2;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                }
                
                .print-btn:hover {
                    background-color: #1565c0;
                }
            </style>
        </head>
        <body>
            <div class="print-wrapper">
                ${document.getElementById('receipt-content').innerHTML}
            </div>
            <div class="print-controls">
                <button class="print-btn" onclick="window.print();setTimeout(function() { window.close(); }, 500);">Print Receipt</button>
            </div>
            <script>
                setTimeout(function() {
                    document.querySelector('.print-btn').innerHTML = 'Print Receipt Again';
                }, 2000);
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

function selectTimeSlot(element) {
    if (element.classList.contains('unavailable')) {
        return;
    }
    
    document.querySelectorAll('.time-slot-btn').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    element.classList.add('selected');
    
    // Update time input
    const timeText = element.querySelector('.time-slot-time')?.textContent || element.textContent.trim();
    const timeInput = document.getElementById('booking-time');
    if (timeInput && timeInput._flatpickr) {
        timeInput._flatpickr.setDate(convertTimeFormat(timeText));
    } else if (timeInput) {
        timeInput.value = convertTimeFormat(timeText);
    }
    
    // Add visual feedback for selection
    element.classList.remove('pulse-selection');
    void element.offsetWidth; // Trigger reflow to restart animation
    element.classList.add('pulse-selection');
}

function convertTimeFormat(timeText) {
    // Convert from "08:00 AM" to "08:00" format
    const time = timeText.split(' ')[0];
    const period = timeText.split(' ')[1];
    
    let hours = parseInt(time.split(':')[0]);
    const minutes = time.split(':')[1];
    
    if (period === 'PM' && hours < 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

function updateStationInformation(stationName, stationAddress, stationId) {
    console.log('Updating station information:', { stationName, stationAddress, stationId });
    
    // Update station address field
    const stationAddressField = document.getElementById('station-address');
    if (stationAddressField) {
        stationAddressField.value = stationAddress;
    }
    
    // Update station card if it exists
    const stationNameEl = document.querySelector('.station-name');
    if (stationNameEl) {
        stationNameEl.textContent = stationName;
    }
    
    const stationImage = document.querySelector('.station-image-placeholder');
    if (stationImage) {
        stationImage.innerHTML = '<i class="fas fa-charging-station"></i>';
    }
    
    // Generate a random rating between 4.0 and 5.0
    const rating = (4 + Math.random()).toFixed(1);
    const ratingEl = document.querySelector('.station-rating');
    if (ratingEl) {
        ratingEl.innerHTML = `<i class="fas fa-star"></i> ${rating}`;
    }
    
    // Update station info items if they exist
    const stationInfo = document.querySelector('.station-info');
    if (stationInfo) {
        // Clear existing items
        stationInfo.innerHTML = '';
        
        // Create new info items
        const infoItems = [
            { icon: 'fas fa-bolt', text: 'Fast Charging Available' },
            { icon: 'fas fa-parking', text: 'Parking Available' },
            { icon: 'fas fa-wifi', text: 'WiFi Available' }
        ];
        
        // Add coordinates if available
        const lat = localStorage.getItem('selectedStationLat');
        const lng = localStorage.getItem('selectedStationLng');
        if (lat && lng) {
            infoItems.push({ 
                icon: 'fas fa-map-marker-alt', 
                text: `Position: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}` 
            });
        }
        
        infoItems.forEach(item => {
            const infoItem = document.createElement('div');
            infoItem.className = 'station-info-item';
            infoItem.innerHTML = `<i class="${item.icon}"></i> ${item.text}`;
            stationInfo.appendChild(infoItem);
        });
    }
    
    // Add button to change station if it doesn't exist already
   
    
    // Store station information in localStorage for future use
    localStorage.setItem('selectedStationAddress', stationAddress);
    localStorage.setItem('selectedStationName', stationName);
    if (stationId) {
        localStorage.setItem('selectedStationId', stationId);
    }
}

function setupTimeSlotSelection() {
    const timeSlots = document.querySelectorAll('.time-slot-btn');
    
    // Add event listeners to time slots
    timeSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            selectTimeSlot(this);
        });
    });
    
    // Generate random unavailable slots (in a real app, this would be fetched from an API)
    const unavailableCount = Math.floor(Math.random() * 4) + 2; // 2-5 unavailable slots
    const unavailableSlots = [];
    
    while (unavailableSlots.length < unavailableCount) {
        const randomIndex = Math.floor(Math.random() * timeSlots.length);
        if (!unavailableSlots.includes(randomIndex)) {
            unavailableSlots.push(randomIndex);
        }
    }
    
    // Mark slots as unavailable
    unavailableSlots.forEach(index => {
        if (timeSlots[index]) {
            const slot = timeSlots[index];
            slot.classList.add('unavailable');
            
            // Add unavailable tag if it doesn't exist
            if (!slot.querySelector('.unavailable-tag')) {
                const unavailableTag = document.createElement('span');
                unavailableTag.className = 'unavailable-tag';
                unavailableTag.textContent = 'Booked';
                slot.appendChild(unavailableTag);
            }
        }
    });
}

function updateAvailableTimeSlots(selectedDate) {
    // Clear existing selection
    document.querySelectorAll('.time-slot-btn').forEach(slot => {
        slot.classList.remove('selected');
        slot.classList.remove('unavailable');
        
        // Remove existing unavailable tags
        const unavailableTag = slot.querySelector('.unavailable-tag');
        if (unavailableTag) {
            unavailableTag.remove();
        }
    });
    
    // Generate random unavailable slots based on the date
    // In a real app, this would fetch availability data from a server
    const timeSlots = document.querySelectorAll('.time-slot-btn');
    
    // Different unavailable slots for different dates (just for demo)
    const dateString = selectedDate.toISOString().split('T')[0];
    const dateSeed = dateString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = new Math.seedrandom(dateSeed);
    
    const unavailableCount = Math.floor(random() * 5) + 2; // 2-6 unavailable slots
    const unavailableSlots = [];
    
    while (unavailableSlots.length < unavailableCount) {
        const randomIndex = Math.floor(random() * timeSlots.length);
        if (!unavailableSlots.includes(randomIndex)) {
            unavailableSlots.push(randomIndex);
        }
    }
    
    // Mark slots as unavailable
    unavailableSlots.forEach(index => {
        if (timeSlots[index]) {
            timeSlots[index].classList.add('unavailable');
            
            // Add unavailable tag
            const unavailableTag = document.createElement('span');
            unavailableTag.className = 'unavailable-tag';
            unavailableTag.textContent = 'Booked';
            timeSlots[index].appendChild(unavailableTag);
        }
    });
}

// Helper function for seedable random numbers (for demo only)
Math.seedrandom = function(seed) {
    function mulberry32(a) {
        return function() {
            let t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
    
    // Create a simple hash from string seed
    if (typeof seed === 'string') {
        seed = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    }
    
    return mulberry32(seed);
};

// Call initializeBookingSystem when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeBookingSystem();
    
    // Initialize all other components
    setupPaymentOptions();
    setupCloseButtons();
    setupPaymentButton();
    setupSummaryButton();
});

// Add CSS for the no-station-selected state
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .station-card.no-station-selected .station-image-placeholder {
            background-color: #f0f0f0;
            color: #aaa;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 2rem;
        }
        
        .station-card.no-station-selected .station-info,
        .station-card.no-station-selected .station-rating {
            display: none;
        }
        
        .station-card.no-station-selected .station-name {
            color: #999;
        }
        
        .find-station-btn {
            margin-top: 15px;
            width: 100%;
        }
    `;
    document.head.appendChild(style);
});

// Add function to detect user's current location
function detectMyLocation() {
    const detectBtn = document.getElementById('detect-location-btn');
    const locationDisplay = document.getElementById('my-location-display');
    const locationAddress = document.getElementById('my-location-address');
    const distanceContainer = document.getElementById('distance-to-station');
    const distanceValue = document.getElementById('distance-value');
    
    // Change button state to loading
    const originalContent = detectBtn.innerHTML;
    detectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
    detectBtn.disabled = true;
    
    // Check if geolocation is supported
    if (navigator.geolocation) {
        const geoOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                console.log("Geolocation successful:", position.coords);
                
                // Store user location in window object
                window.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Reverse geocode to get address
                reverseGeocode(position.coords.latitude, position.coords.longitude)
                    .then(address => {
                        // Display user location
                        locationAddress.textContent = address;
                        locationDisplay.classList.add('active');
                        
                        // Calculate distance to station if station coordinates exist
                        const stationLat = localStorage.getItem('selectedStationLat');
                        const stationLng = localStorage.getItem('selectedStationLng');
                        
                        if (stationLat && stationLng) {
                            const distance = calculateDistance(
                                position.coords.latitude, 
                                position.coords.longitude,
                                parseFloat(stationLat),
                                parseFloat(stationLng)
                            );
                            
                            distanceValue.textContent = `${distance.toFixed(1)} km from station`;
                            distanceContainer.classList.remove('hidden');
                        }
                        
                        // Reset button
                        detectBtn.innerHTML = originalContent;
                        detectBtn.disabled = false;
                    })
                    .catch(error => {
                        console.error("Reverse geocoding error:", error);
                        locationAddress.textContent = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
                        locationDisplay.classList.add('active');
                        
                        // Reset button
                        detectBtn.innerHTML = originalContent;
                        detectBtn.disabled = false;
                    });
            },
            function(error) {
                console.error("Geolocation error:", error);
                locationAddress.textContent = `Error: ${error.message}. Please allow location access.`;
                locationDisplay.classList.add('active');
                
                // Reset button
                detectBtn.innerHTML = originalContent;
                detectBtn.disabled = false;
            },
            geoOptions
        );
        } else {
        locationAddress.textContent = "Geolocation is not supported by this browser.";
        locationDisplay.classList.add('error');
        
        // Reset button
        detectBtn.innerHTML = originalContent;
        detectBtn.disabled = false;
    }
}

// Function to reverse geocode coordinates to address using TomTom API
function reverseGeocode(lat, lng) {
    return new Promise((resolve, reject) => {
        // Check if TomTom services are available
        if (!tt || !tt.services || !tt.services.reverseGeocode) {
            console.error("TomTom services not available");
            reject("Geocoding service unavailable");
            return;
        }
        
        tt.services.reverseGeocode({
            key: 'btVdXlLhF1rgfMqkkAZv8aWClICR4ruk', // TomTom API key from application
            position: [lng, lat]
        })
        .go()
        .then(function(response) {
            if (response.addresses && response.addresses.length > 0) {
                const address = response.addresses[0].address;
                const formattedAddress = address.freeformAddress || 
                    `${address.streetName || ''} ${address.municipality || ''}`;
                resolve(formattedAddress);
            } else {
                resolve(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            }
        })
        .catch(function(error) {
            console.error("TomTom reverse geocoding error:", error);
            reject(error);
        });
    });
}

// Function to calculate distance between two coordinates using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
}

// Helper function to convert degrees to radians
function deg2rad(deg) {
    return deg * (Math.PI/180);
} 



// backend begains 
function getSelectedChargingPort() {
    const selected = document.querySelector('input[name="charging-port"]:checked');
    if (selected) {
      return selected.value;
    } else {
      return null; // No option selected
    }
  }
  function getSelectedPaymentMethod() {
    const selected = document.querySelector('input[name="payment-method"]:checked');
    if (selected) {
        const label = selected.closest('.payment-option').querySelector('.payment-option-label');
        return label.textContent.trim(); // Will return: "Card", "UPI", "Wallet", or "Net Banking"
    }
    return null; // Nothing selected
}

  
async function pay(event) {     
    const stationAddress = document.getElementById('station-address').value;
    const vehicleType = document.getElementById('vehicle-type').value;
    const vehicleModel = document.getElementById('vehicle-model').value;
    const vehicleNumber = document.getElementById('vehicle-number').value;
    const bookingDate = document.getElementById('booking-date').value;
    const bookingTime = document.getElementById('booking-time').value;
    const duration = document.getElementById('duration').value;
    const chargingPort = getSelectedChargingPort();
    const paymentMethod = getSelectedPaymentMethod();

    const userId = JSON.parse(localStorage.getItem("userData"));
    const book = {
        stationAddress,
        vehicleType,
        vehicleModel,
        vehicleNumber,
        bookingDate,
        bookingTime,
        duration,
        chargingPort,
        paymentMethod,
        userId
    }

    console.log("Booking data:", book);
    
    try{
        const response = await fetch('http://localhost:3000/api/v1/user/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(book)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log("Booking successful:", data);
        } else {
            console.error("Booking error:", data);
            alert("Booking failed: " + data.message);
            window.location.href = 'http://127.0.0.1:5500/book_slot.html'; // Redirect to dashboard or another page
        }
        
    }catch(err){
        console.log(err);
    }
}