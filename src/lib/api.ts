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

export async function fetchVesselRelations() {
  const response = await fetch(`${BASE_URL}/vessel-relation`);
  if (!response.ok) {
    throw new Error("Failed to fetch vessel relations");
  }
  return response.json();
}

export async function fetchProducts() {
  const response = await fetch(`${BASE_URL}/product`);
  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }
  return response.json();
}

export async function fetchBerthPrices() {
  const response = await fetch(`${BASE_URL}/product-berth-price`);
  if (!response.ok) {
    throw new Error("Failed to fetch berth prices");
  }
  return response.json();
}

export async function deleteBooking(id: number | string) {
  const response = await fetch(`${BASE_URL}/booking/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete booking");
  }
  return response.json();
}

export async function fetchQuotations() {
  const response = await fetch(`${BASE_URL}/qu`);
  if (!response.ok) {
    throw new Error("Failed to fetch quotations");
  }
  return response.json();
}

export async function fetchQuotation(id: number | string) {
  const response = await fetch(`${BASE_URL}/qu/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch quotation details");
  }
  return response.json();
}

export async function createQuotation(payload: any) {
  const response = await fetch(`${BASE_URL}/qu`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create quotation");
  return response.json();
}

export async function deleteQuotation(id: string) {
  const response = await fetch(`${BASE_URL}/qu/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete quotation");
  return response.json();
}

// --- RV & Tender APIs ---
export async function fetchMasterTenders() {
  const response = await fetch(`${BASE_URL}/master-tender`);
  if (!response.ok) throw new Error("Failed to fetch tenders");
  return response.json();
}

export async function createRV(payload: any) {
  const response = await fetch(`${BASE_URL}/rv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to create Receipt Voucher");
  }
  return response.json();
}
