export type Service = {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  price: number;
};

export type Barber = {
  id: string;
  name: string;
  photo: string;
  experienceYears: number;
  bio: string;
  services: string[];
};

export type Catalog = {
  services: Service[];
  barbers: Barber[];
};

const apiUrl = process.env.API_URL ?? "http://localhost:3001";

function isService(value: unknown): value is Service {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Service;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.description === "string" &&
    typeof item.durationMin === "number" &&
    typeof item.price === "number"
  );
}

function isBarber(value: unknown): value is Barber & { photoUrl: string } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Barber & { photoUrl?: string };
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.photoUrl === "string" &&
    typeof item.bio === "string" &&
    typeof item.experienceYears === "number" &&
    Array.isArray(item.services) &&
    item.services.every((service) => typeof service === "string")
  );
}

async function readJson(path: string): Promise<unknown> {
  const response = await fetch(`${apiUrl}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`catalog ${response.status}`);
  }
  return response.json();
}

export async function getCatalog(): Promise<Catalog | null> {
  try {
    const [servicesPayload, barbersPayload] = await Promise.all([
      readJson("/api/v1/services"),
      readJson("/api/v1/barbers"),
    ]);
    if (!servicesPayload || typeof servicesPayload !== "object" || !barbersPayload || typeof barbersPayload !== "object") {
      return null;
    }
    const services = (servicesPayload as { services?: unknown }).services;
    const barbers = (barbersPayload as { barbers?: unknown }).barbers;
    if (!Array.isArray(services) || !Array.isArray(barbers) || !services.every(isService) || !barbers.every(isBarber)) {
      return null;
    }
    return {
      services,
      barbers: barbers.map((barber) => ({
        id: barber.id,
        name: barber.name,
        photo: barber.photoUrl,
        experienceYears: barber.experienceYears,
        bio: barber.bio,
        services: barber.services,
      })),
    };
  } catch {
    return null;
  }
}
