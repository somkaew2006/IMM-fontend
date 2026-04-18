const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function fetchBookings() {
  const response = await fetch(`${BASE_URL}/booking`);
  if (!response.ok) {
    throw new Error("Failed to fetch bookings");
  }
  return response.json();
}

export async function createBooking(data: any) {
  const response = await fetch(`${BASE_URL}/booking`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create booking");
  }
  return response.json();
}

export async function fetchBooking(id: number | string) {
  const response = await fetch(`${BASE_URL}/booking/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch booking details");
  }
  return response.json();
}
