// Modern VTC Template - JavaScript

document.addEventListener('DOMContentLoaded', function() {
  
  // Calculateur de prix
  const priceForm = document.getElementById('price-calculator');
  if (priceForm) {
    priceForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const pickup = document.getElementById('pickup').value;
      const dropoff = document.getElementById('dropoff').value;
      const serviceId = document.getElementById('service').value;
      
      if (!pickup || !dropoff) {
        alert('Veuillez renseigner les adresses');
        return;
      }

      try {
        // Simuler un calcul de distance (à remplacer par Google Maps API)
        const distance = Math.random() * 50 + 10; // 10-60 km
        
        const response = await fetch('/api/bookings/estimate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service_id: serviceId,
            distance: distance,
            duration: Math.round(distance * 2), // 2 min par km en moyenne
          }),
        });

        const data = await response.json();
        
        document.getElementById('estimated-price').textContent = data.estimated_price;
        document.getElementById('price-result').classList.remove('hidden');
        
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du calcul du tarif');
      }
    });
  }

  // Formulaire de réservation
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(bookingForm);
      const data = {
        customer_name: formData.get('name'),
        customer_email: formData.get('email'),
        customer_phone: formData.get('phone'),
        pickup_address: formData.get('pickup'),
        dropoff_address: formData.get('dropoff'),
        pickup_datetime: formData.get('datetime'),
        notes: formData.get('notes'),
        estimated_price: 0, // À calculer
      };

      try {
        const response = await fetch('/api/bookings/public', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          alert('Votre demande de réservation a été envoyée ! Vous recevrez une confirmation par email.');
          bookingForm.reset();
        } else {
          throw new Error('Erreur lors de l\'envoi');
        }
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'envoi de la réservation');
      }
    });
  }

  // Smooth scroll pour les ancres
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

