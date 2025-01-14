import axios from 'axios';
import { showAlert } from './alert'; 
const stripe = Stripe(
  'pk_test_51Qf6c4A2H3dLqtP9EruEf48qA2YvklsKMMRTYhJXffcM80oc7e7HDc4ktZ5i77acmRkGaWUqNKwSx2bF9NQtL3Dc00eBKg1G55'
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);

  //   // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
