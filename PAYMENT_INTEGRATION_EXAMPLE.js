// Example: How to integrate payment verification emails in your frontend

// ============================================
// EXAMPLE 1: After Stripe/PayPal Payment
// ============================================

async function handlePaymentSuccess(orderId, paymentReference) {
  try {
    const response = await fetch(
      "http://localhost:5000/public/verify-payment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
          status: "successful",
          paymentRef: paymentReference, // From payment gateway
        }),
      }
    );

    const data = await response.json();

    if (data.status === "success") {
      console.log("Payment verified and emails sent!");
      // Redirect to success page
      window.location.href = "/order-success";
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
  }
}

// ============================================
// EXAMPLE 2: Admin Dashboard - Manual Update
// ============================================

async function updateOrderStatus(orderId, newStatus, paymentRef, adminToken) {
  try {
    const response = await fetch(
      `http://localhost:5000/admin/orders/${orderId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: newStatus, // 'successful' will trigger emails
          paymentRef: paymentRef,
        }),
      }
    );

    const data = await response.json();

    if (data.status === "success") {
      console.log("Order updated and emails sent!");
      alert("Order status updated successfully. Customer has been notified.");
    }
  } catch (error) {
    console.error("Error updating order:", error);
  }
}

// ============================================
// EXAMPLE 3: Complete Checkout Flow
// ============================================

async function completeCheckout(cartItems, deliveryInfo, userEmail) {
  try {
    // Step 1: Create pending order
    const orderResponse = await fetch("http://localhost:5000/public/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userEmail: userEmail,
        items: cartItems,
        totalAmount: calculateTotal(cartItems),
        deliveryInfo: deliveryInfo,
      }),
    });

    const orderData = await orderResponse.json();
    const orderId = orderData.data._id;

    // Step 2: Process payment with your payment gateway
    // (This is pseudo-code - replace with actual payment gateway)
    const paymentResult = await processPaymentWithGateway({
      amount: orderData.data.totalAmount,
      orderId: orderId,
    });

    // Step 3: Verify payment and trigger emails
    if (paymentResult.success) {
      await fetch("http://localhost:5000/public/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
          status: "successful",
          paymentRef: paymentResult.transactionId,
        }),
      });

      // Emails are automatically sent to both customer and owner!
      return { success: true, orderId: orderId };
    }
  } catch (error) {
    console.error("Checkout error:", error);
    return { success: false, error: error.message };
  }
}

// Helper function
function calculateTotal(items) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

// ============================================
// EXAMPLE 4: Using with existing API service
// ============================================

// Add to your client/src/app/services/api.js

export const verifyPayment = async (orderId, paymentRef) => {
  try {
    const response = await fetch(`${API_BASE_URL}/public/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        status: "successful",
        paymentRef,
      }),
    });

    if (!response.ok) {
      throw new Error("Payment verification failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
};

// Usage in your checkout component:
// const result = await verifyPayment(orderId, paymentReference);
// if (result.status === 'success') {
//   // Show success message
//   // Emails have been sent automatically!
// }
