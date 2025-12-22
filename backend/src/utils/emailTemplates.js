const welcomeEmail = (name) => {
    return `
    <h1>Welcome, ${name}!</h1>
    <p>Thank you for registering with Teachaide AI.</p>
  `;
};

const orderConfirmationEmail = (orderId) => {
    return `
    <h1>Order Confirmed</h1>
    <p>Your order ${orderId} has been placed successfully.</p>
  `;
};

module.exports = { welcomeEmail, orderConfirmationEmail };
