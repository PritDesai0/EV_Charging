        const stationAddress = document.getElementById('station-address').value;
        const vehicleType = document.getElementById('vehicle-type').value;
        const vehicleModel = document.getElementById('vehicle-model').value;
        const vehicleNumber = document.getElementById('vehicle-number').value;
        const bookingDate = document.getElementById('booking-date').value;
        const bookingTime = document.getElementById('booking-time').value;
        const duration = document.getElementById('duration').value;
        
        
        function getSelectedChargingPort() {
                const selected = document.querySelector('input[name="charging-port"]:checked');
                if (selected) {
                  return selected.value;
                } else {
                  return null; // No option selected
                }
              }
              

              function getSelectedPaymentMethod() {
                const selectedRadio = document.querySelector('input[name="payment-method"]:checked');
                if (selectedRadio) {
                  const paymentDiv = selectedRadio.closest('.payment-option');
                  return paymentDiv.getAttribute('data-payment'); // returns: 'card', 'upi', 'wallet', 'netbanking'
                } else {
                  return null; // No option selected
                }
              }
              