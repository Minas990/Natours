/* eslint-disable */




const locations = JSON.parse(document.getElementById('map').dataset.locations);

const map = L.map('map', { zoomControl: false });


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);
 


var greenIcon = L.icon({
  iconUrl: '/img/pin.png',
  iconSize: [32, 40], 
  iconAnchor: [16, 45], 
  popupAnchor: [0, -50],
});
 

 
const points = [];
locations.forEach(loc => {

  points.push([loc.coordinates[1], loc.coordinates[0]]);
 
  L.marker([loc.coordinates[1], loc.coordinates[0]], { icon: greenIcon })
  .addTo(map)
  .bindPopup(`<p style='font-size:10px'>Day ${loc.day}: ${loc.description}</p> `, {
    autoClose: false,
  })
  .openPopup();
});


const bounds = L.latLngBounds(points).pad(0.5);
map.fitBounds(bounds);

map.scrollWheelZoom.disable();





////// payment
const booking = document.getElementById('book-tour');
booking.addEventListener('click',async function(e) 
{
  try
  {
    const tourId = booking.dataset.tourId;
    booking.textContent= 'processing.....'
    const res = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    booking.textContent='Book now'
    // Redirect to Stripe Checkout
    window.location.href = res.data.url;
  }
  catch(err)
  {
    booking.textContent='Book now'
    console.log(err);
  }
});