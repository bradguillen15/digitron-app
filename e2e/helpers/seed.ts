const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:55321";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function adminHeaders(): Record<string, string> {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

export function getServiceRoleKey(): string {
  return SERVICE_ROLE_KEY;
}

async function postRow<T>(table: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`seed ${table}: ${response.status} ${await response.text()}`);
  }
  const rows = (await response.json()) as T[];
  if (!rows[0]) throw new Error(`seed ${table}: empty response — check RLS or service role key`);
  return rows[0];
}

async function deleteWhere(table: string, query: string): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  if (!response.ok) {
    throw new Error(`delete ${table}: ${response.status} ${await response.text()}`);
  }
}

function uniqueCustomerName(): string {
  return `E2E Client ${Date.now()}`;
}

/** Seeds a customer + equipment row via service role (bypasses RLS). */
export async function seedTestCustomerEquipment(): Promise<{
  clientId: string;
  equipmentId: string;
  customerName: string;
}> {
  if (!SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for seed helpers");
  }

  const customerName = uniqueCustomerName();

  const customer = await postRow<{ id: string }>("customers", {
    name: customerName,
    phone1: "555-0001",
  });

  const equipment = await postRow<{ id: string }>("equipment", {
    client_id: customer.id,
    type: "Laptop",
    brand: "E2E",
    model: "Test",
  });

  return { clientId: customer.id, equipmentId: equipment.id, customerName };
}

export async function seedTestOrder(
  clientId: string,
  equipmentId: string,
  stage: string,
  reportedFault: string,
): Promise<{ id: string }> {
  return postRow<{ id: string }>("orders", {
    client_id: clientId,
    equipment_id: equipmentId,
    reported_fault: reportedFault,
    stage,
    source: "counter",
  });
}

/** Deletes orders for the customer, then the customer (equipment cascades). */
export async function deleteTestCustomer(clientId: string): Promise<void> {
  await deleteWhere("orders", `client_id=eq.${clientId}`);
  await deleteWhere("customers", `id=eq.${clientId}`);
}
