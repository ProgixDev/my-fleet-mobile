export interface DeliveryConfig {
  enabled: boolean;
  basePointLabel: string;
  basePointLat: number;
  basePointLng: number;
  ratePerKm: number;
  currency: string;
  minFee?: number;
  maxDistanceKm?: number;
}

export interface Agency {
  id: string;
  name: string;
  city: string;
  address: string;
  rating: number;
  reviews: number;
  vehicles: number;
  verified: boolean;
  logo: string;
  description: string;
  deliveryConfig: DeliveryConfig;
}

export interface Vehicle {
  id: string;
  name: string;
  year: number;
  transmission: string;
  fuel: string;
  power: string;
  seats: number;
  doors: number;
  trunk: string;
  price: number;
  agencyId: string;
  agencyName: string;
  category: string;
  features: string[];
  description: string;
  chauffeurAvailable: boolean;
  chauffeurPrice: number;
  conditions: {
    minAge: number;
    licenseYears: number;
    deposit: number;
    kmPerDay: number;
  };
  /** Local image require() refs. When present, prefer over `vehicleImages` Unsplash fallbacks. */
  images?: number[];
}

export const agencies: Agency[] = [
  {
    id: "1",
    name: "Prestige Auto Nice",
    city: "Nice",
    address: "42 Promenade des Anglais, Nice",
    rating: 4.8,
    reviews: 142,
    vehicles: 28,
    verified: true,
    logo: "P",
    description:
      "Leader de la location de véhicules de prestige sur la Côte d'Azur depuis 2010.",
    deliveryConfig: {
      enabled: true,
      basePointLabel: "42 Promenade des Anglais, Nice",
      basePointLat: 43.6956,
      basePointLng: 7.2651,
      ratePerKm: 200,
      currency: "€",
      minFee: 2000,
      maxDistanceKm: 60,
    },
  },
  {
    id: "2",
    name: "Riviera Luxury Cars",
    city: "Cannes",
    address: "Boulevard de la Croisette, Cannes",
    rating: 4.9,
    reviews: 89,
    vehicles: 22,
    verified: true,
    logo: "R",
    description:
      "Spécialiste de la location de voitures de luxe à Cannes et sur toute la Côte d'Azur.",
    deliveryConfig: {
      enabled: true,
      basePointLabel: "Boulevard de la Croisette, Cannes",
      basePointLat: 43.5513,
      basePointLng: 7.0175,
      ratePerKm: 250,
      currency: "€",
      minFee: 3000,
      maxDistanceKm: 80,
    },
  },
  {
    id: "3",
    name: "Monaco Premium Fleet",
    city: "Monaco",
    address: "Avenue de Monte-Carlo, Monaco",
    rating: 5.0,
    reviews: 67,
    vehicles: 35,
    verified: true,
    logo: "M",
    description:
      "La référence monégasque pour la location de véhicules d'exception.",
    deliveryConfig: {
      enabled: true,
      basePointLabel: "Avenue de Monte-Carlo, Monaco",
      basePointLat: 43.7384,
      basePointLng: 7.4246,
      ratePerKm: 300,
      currency: "€",
      minFee: 4000,
      maxDistanceKm: 50,
    },
  },
  {
    id: "4",
    name: "Côte d'Azur Motors",
    city: "Antibes",
    address: "Port Vauban, Antibes",
    rating: 4.7,
    reviews: 124,
    vehicles: 24,
    verified: true,
    logo: "C",
    description:
      "Agence familiale offrant un service personnalisé et une sélection raffinée.",
    deliveryConfig: {
      // Not offered by this agency — livraison option must be hidden
      enabled: false,
      basePointLabel: "Port Vauban, Antibes",
      basePointLat: 43.5853,
      basePointLng: 7.1255,
      ratePerKm: 0,
      currency: "€",
    },
  },
];

export const vehicles: Vehicle[] = [
  {
    id: "1",
    name: "Porsche 911 Carrera S",
    year: 2024,
    transmission: "Auto",
    fuel: "Essence",
    power: "450 ch",
    seats: 4,
    doors: 2,
    trunk: "132 L",
    price: 32000,
    agencyId: "1",
    agencyName: "Prestige Auto Nice",
    category: "Sportive",
    features: ["Climatisation", "GPS intégré", "Bluetooth", "Sièges cuir"],
    description: "Icône sportive par excellence, la Porsche 911 Carrera S allie performances exceptionnelles et confort de conduite quotidien. Moteur boxer 6 cylindres de 450 ch, 0-100 km/h en 3.7s.",
    chauffeurAvailable: true,
    chauffeurPrice: 12000,
    conditions: { minAge: 25, licenseYears: 3, deposit: 500000, kmPerDay: 300 },
  },
  {
    id: "2",
    name: "Mercedes-AMG GT",
    year: 2024,
    transmission: "Auto",
    fuel: "Essence",
    power: "585 ch",
    seats: 2,
    doors: 2,
    trunk: "285 L",
    price: 45000,
    agencyId: "1",
    agencyName: "Prestige Auto Nice",
    category: "Sportive",
    features: ["Climatisation", "GPS intégré", "Bluetooth", "Échappement sport"],
    description: "La Mercedes-AMG GT incarne la sportivité pure. Design agressif et performances de supercar pour une expérience de conduite inoubliable.",
    chauffeurAvailable: true,
    chauffeurPrice: 15000,
    conditions: { minAge: 28, licenseYears: 5, deposit: 800000, kmPerDay: 250 },
  },
  {
    id: "3",
    name: "BMW M4 Competition",
    year: 2024,
    transmission: "Auto",
    fuel: "Essence",
    power: "510 ch",
    seats: 4,
    doors: 2,
    trunk: "440 L",
    price: 38000,
    agencyId: "2",
    agencyName: "Riviera Luxury Cars",
    category: "Sportive",
    features: ["Climatisation", "GPS intégré", "Sièges cuir M", "Harman Kardon"],
    description: "La BMW M4 Competition offre un équilibre parfait entre sportivité extrême et praticité quotidienne. 510 ch de pur plaisir.",
    chauffeurAvailable: true,
    chauffeurPrice: 12000,
    conditions: { minAge: 25, licenseYears: 3, deposit: 600000, kmPerDay: 300 },
  },
  {
    id: "4",
    name: "Range Rover Velar",
    year: 2024,
    transmission: "Auto",
    fuel: "Hybride",
    power: "400 ch",
    seats: 5,
    doors: 4,
    trunk: "632 L",
    price: 28000,
    agencyId: "3",
    agencyName: "Monaco Premium Fleet",
    category: "SUV",
    features: ["Climatisation", "Caméra 360°", "Toit panoramique", "Sièges cuir"],
    description: "Le Range Rover Velar combine élégance britannique et technologie de pointe. Confort absolu et présence imposante.",
    chauffeurAvailable: true,
    chauffeurPrice: 10000,
    conditions: { minAge: 23, licenseYears: 2, deposit: 400000, kmPerDay: 350 },
  },
  {
    id: "5",
    name: "Audi RS6 Avant",
    year: 2024,
    transmission: "Auto",
    fuel: "Essence",
    power: "600 ch",
    seats: 5,
    doors: 5,
    trunk: "565 L",
    price: 42000,
    agencyId: "2",
    agencyName: "Riviera Luxury Cars",
    category: "Berline",
    features: ["Climatisation", "GPS intégré", "Sièges sport", "Bang & Olufsen"],
    description: "L'Audi RS6 Avant est le break sportif ultime. 600 ch, design agressif et praticité familiale dans un même véhicule.",
    chauffeurAvailable: true,
    chauffeurPrice: 13000,
    conditions: { minAge: 26, licenseYears: 4, deposit: 700000, kmPerDay: 300 },
  },
  {
    id: "6",
    name: "Tesla Model S Plaid",
    year: 2024,
    transmission: "Auto",
    fuel: "Électrique",
    power: "1020 ch",
    seats: 5,
    doors: 4,
    trunk: "793 L",
    price: 35000,
    agencyId: "4",
    agencyName: "Côte d'Azur Motors",
    category: "Électrique",
    features: ["Autopilot", "Écran tactile 17\"", "Climatisation", "Audio Premium"],
    description: "La Tesla Model S Plaid redéfinit la performance électrique. 0-100 km/h en 2.1s, la berline la plus rapide du monde.",
    chauffeurAvailable: true,
    chauffeurPrice: 11000,
    conditions: { minAge: 25, licenseYears: 3, deposit: 550000, kmPerDay: 400 },
  },
  {
    id: "7",
    name: "Ferrari Roma",
    year: 2024,
    transmission: "Auto",
    fuel: "Essence",
    power: "620 ch",
    seats: 4,
    doors: 2,
    trunk: "272 L",
    price: 62000,
    agencyId: "4",
    agencyName: "Côte d'Azur Motors",
    category: "Sportive",
    features: ["Climatisation", "GPS intégré", "Sièges cuir Poltrona Frau", "Échappement sport"],
    description: "La Ferrari Roma marie élégance italienne et puissance pure. V8 biturbo de 620 ch, 0-100 km/h en 3.4s, pour une conduite aussi raffinée que viscérale.",
    chauffeurAvailable: true,
    chauffeurPrice: 18000,
    conditions: { minAge: 30, licenseYears: 5, deposit: 1000000, kmPerDay: 200 },
  },
  {
    id: "8",
    name: "Lamborghini Urus",
    year: 2024,
    transmission: "Auto",
    fuel: "Essence",
    power: "650 ch",
    seats: 5,
    doors: 4,
    trunk: "616 L",
    price: 58000,
    agencyId: "4",
    agencyName: "Côte d'Azur Motors",
    category: "SUV",
    features: ["Mode Terrain", "GPS intégré", "Toit panoramique", "Sièges cuir", "Bang & Olufsen"],
    description: "Le Super-SUV par excellence. Le Lamborghini Urus combine la présence d'un SUV et la violence d'une supersportive. 0-100 km/h en 3.6s.",
    chauffeurAvailable: true,
    chauffeurPrice: 17000,
    conditions: { minAge: 28, licenseYears: 5, deposit: 900000, kmPerDay: 250 },
  },
  {
    id: "9",
    name: "Bentley Continental GT",
    year: 2024,
    transmission: "Auto",
    fuel: "Essence",
    power: "635 ch",
    seats: 4,
    doors: 2,
    trunk: "358 L",
    price: 54000,
    agencyId: "4",
    agencyName: "Côte d'Azur Motors",
    category: "Berline",
    features: ["Climatisation", "GPS intégré", "Sièges cuir massage", "Toit ouvrant", "Naim Audio"],
    description: "Le grand tourisme britannique par excellence. W12 biturbo, confort absolu et artisanat d'exception pour traverser la Côte d'Azur avec style.",
    chauffeurAvailable: true,
    chauffeurPrice: 16000,
    conditions: { minAge: 28, licenseYears: 4, deposit: 800000, kmPerDay: 300 },
  },
  {
    id: "10",
    name: "Maserati MC20",
    year: 2024,
    transmission: "Auto",
    fuel: "Essence",
    power: "630 ch",
    seats: 2,
    doors: 2,
    trunk: "100 L",
    price: 59000,
    agencyId: "4",
    agencyName: "Côte d'Azur Motors",
    category: "Sportive",
    features: ["Portes papillon", "Mode Corsa", "Carbone visible", "GPS intégré", "Sièges baquets"],
    description: "Le retour de Maserati dans la supercar. Moteur Nettuno V6 biturbo de 630 ch et architecture carbone pour une expérience de conduite radicale.",
    chauffeurAvailable: false,
    chauffeurPrice: 0,
    conditions: { minAge: 30, licenseYears: 5, deposit: 1200000, kmPerDay: 200 },
  },
  {
    id: "11",
    name: "Aston Martin DB12",
    year: 2024,
    transmission: "Auto",
    fuel: "Essence",
    power: "680 ch",
    seats: 4,
    doors: 2,
    trunk: "262 L",
    price: 56000,
    agencyId: "4",
    agencyName: "Côte d'Azur Motors",
    category: "Sportive",
    features: ["Climatisation", "Sièges cuir Bridge of Weir", "GPS intégré", "Bowers & Wilkins"],
    description: "Le nouveau Super Tourer d'Aston Martin. V8 biturbo de 680 ch, design sculptural et raffinement britannique pour l'ultime road-trip côtier.",
    chauffeurAvailable: true,
    chauffeurPrice: 17500,
    conditions: { minAge: 28, licenseYears: 5, deposit: 950000, kmPerDay: 250 },
  },
  // ── Prestige Auto Nice (agency "1") — real-photo fleet ──────────────
  {
    id: "12",
    name: "Audi Q5",
    year: 2024,
    transmission: "Auto",
    fuel: "Hybride",
    power: "265 ch",
    seats: 5,
    doors: 5,
    trunk: "520 L",
    price: 18000,
    agencyId: "1",
    agencyName: "Prestige Auto Nice",
    category: "SUV",
    features: ["Climatisation", "GPS intégré", "Bluetooth", "Sièges cuir", "Toit panoramique"],
    description: "Le SUV premium d'Audi combine confort, polyvalence et efficience hybride. Intérieur raffiné et dernières technologies de sécurité pour vos trajets sur la Côte d'Azur.",
    chauffeurAvailable: true,
    chauffeurPrice: 9000,
    conditions: { minAge: 23, licenseYears: 2, deposit: 350000, kmPerDay: 300 },
    images: [
      require("../../assets/audi-q5/audi-q5-1.jpg"),
      require("../../assets/audi-q5/audi-q5-2.jpg"),
      require("../../assets/audi-q5/audi-q5-3.jpg"),
      require("../../assets/audi-q5/audi-q5-4.jpg"),
      require("../../assets/audi-q5/audi-q5-5.jpg"),
    ],
  },
  {
    id: "13",
    name: "BMW X1",
    year: 2024,
    transmission: "Auto",
    fuel: "Essence",
    power: "204 ch",
    seats: 5,
    doors: 5,
    trunk: "500 L",
    price: 14000,
    agencyId: "1",
    agencyName: "Prestige Auto Nice",
    category: "SUV",
    features: ["Climatisation", "GPS intégré", "Bluetooth", "Caméra de recul"],
    description: "SUV compact premium, la BMW X1 offre agilité urbaine et confort pour toutes vos escapades. Parfait équilibre entre design moderne et efficacité.",
    chauffeurAvailable: true,
    chauffeurPrice: 8500,
    conditions: { minAge: 23, licenseYears: 2, deposit: 300000, kmPerDay: 300 },
    images: [
      require("../../assets/bmw-x1/bmw-x1-1.jpg"),
      require("../../assets/bmw-x1/bmw-x1-2.jpg"),
      require("../../assets/bmw-x1/bmw-x1-3.jpg"),
      require("../../assets/bmw-x1/bmw-x1-4.jpg"),
    ],
  },
  {
    id: "14",
    name: "BMW X3",
    year: 2024,
    transmission: "Auto",
    fuel: "Essence",
    power: "245 ch",
    seats: 5,
    doors: 5,
    trunk: "550 L",
    price: 20000,
    agencyId: "1",
    agencyName: "Prestige Auto Nice",
    category: "SUV",
    features: ["Climatisation", "GPS intégré", "Bluetooth", "Sièges cuir", "Harman Kardon"],
    description: "Le SUV dynamique par excellence. La BMW X3 marie plaisir de conduite BMW et polyvalence d'un SUV, avec un intérieur cossu et des performances affirmées.",
    chauffeurAvailable: true,
    chauffeurPrice: 9500,
    conditions: { minAge: 25, licenseYears: 3, deposit: 400000, kmPerDay: 300 },
    images: [
      require("../../assets/bmw-x3/bmw-x3-1.jpg"),
      require("../../assets/bmw-x3/bmw-x3-2.jpg"),
      require("../../assets/bmw-x3/bmw-x3-3.jpg"),
      require("../../assets/bmw-x3/bmw-x3-4.jpg"),
      require("../../assets/bmw-x3/bmw-x3-5.jpg"),
    ],
  },
  {
    id: "15",
    name: "Mercedes Classe A",
    year: 2024,
    transmission: "Auto",
    fuel: "Essence",
    power: "163 ch",
    seats: 5,
    doors: 5,
    trunk: "370 L",
    price: 13000,
    agencyId: "1",
    agencyName: "Prestige Auto Nice",
    category: "Berline",
    features: ["Climatisation", "GPS intégré", "Bluetooth", "MBUX", "Caméra de recul"],
    description: "Compacte élégante et connectée. La Classe A offre la signature Mercedes dans un format urbain, avec l'interface MBUX intuitive et un confort premium.",
    chauffeurAvailable: true,
    chauffeurPrice: 8000,
    conditions: { minAge: 21, licenseYears: 2, deposit: 250000, kmPerDay: 350 },
    images: [
      require("../../assets/classe-a/classe-a-1.jpg"),
      require("../../assets/classe-a/classe-a-2.jpg"),
      require("../../assets/classe-a/classe-a-3.jpg"),
      require("../../assets/classe-a/classe-a-4.jpg"),
      require("../../assets/classe-a/classe-a-5.jpg"),
      require("../../assets/classe-a/classe-a-6.jpg"),
      require("../../assets/classe-a/classe-a-7.jpg"),
      require("../../assets/classe-a/classe-a-8.jpg"),
    ],
  },
];

/**
 * Resolve the image source for a vehicle.
 *
 * Returns local `require()` results when the vehicle has its own photo set,
 * otherwise falls back to the Unsplash URIs shared across mock vehicles.
 */
export function getVehicleImages(vehicle: Vehicle): Array<number | { uri: string }> {
  if (vehicle.images && vehicle.images.length > 0) return vehicle.images;
  // Stable fallback: derive index from the vehicle id so the same vehicle
  // always gets the same photo on every render.
  const idx = Math.max(0, Number(vehicle.id) - 1) % vehicleImages.length;
  return [{ uri: vehicleImages[idx]! }];
}

export function getVehicleCover(vehicle: Vehicle): number | { uri: string } {
  return getVehicleImages(vehicle)[0]!;
}

export type VehicleFinalState = "ok" | "minor-damage" | "major-damage";

export interface Booking {
  id: string;
  vehicleId: string;
  vehicleName: string;
  agencyName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: "active" | "confirmed" | "completed";
  total: number;
  reference: string;
  pickupMethod: string;
  deliveryAddress?: string;
  withChauffeur: boolean;

  // Post-rental summary (populated for completed bookings only)
  startMileage?: number;
  returnMileage?: number;
  includedKm?: number;
  /** Cost per km above includedKm (in €). */
  extraKmRate?: number;
  kmDriven?: number;
  kmOverage?: number;
  overageCost?: number;
  vehicleFinalState?: VehicleFinalState;
  postRentalPhotos?: string[];
}

export const bookings: Booking[] = [
  {
    id: "1",
    vehicleId: "1",
    vehicleName: "Porsche 911 Carrera S",
    agencyName: "Prestige Auto Nice",
    startDate: "2026-06-12",
    endDate: "2026-06-15",
    startTime: "10:00",
    endTime: "18:00",
    status: "active",
    total: 1370,
    reference: "MF-2026-0847",
    pickupMethod: "delivery",
    deliveryAddress: "14 Rue de France, Nice",
    withChauffeur: true,
  },
  {
    id: "2",
    vehicleId: "4",
    vehicleName: "Range Rover Velar",
    agencyName: "Monaco Premium Fleet",
    startDate: "2026-04-08",
    endDate: "2026-04-11",
    startTime: "09:00",
    endTime: "19:00",
    status: "confirmed",
    total: 980,
    reference: "MF-2026-0832",
    pickupMethod: "agency",
    withChauffeur: false,
  },
  {
    id: "3",
    vehicleId: "2",
    vehicleName: "Mercedes-AMG GT",
    agencyName: "Prestige Auto Nice",
    startDate: "2026-03-15",
    endDate: "2026-03-17",
    startTime: "14:00",
    endTime: "14:00",
    status: "completed",
    total: 1200,
    reference: "MF-2026-0789",
    pickupMethod: "agency",
    withChauffeur: false,
    startMileage: 18420,
    returnMileage: 19078,
    includedKm: 500,
    extraKmRate: 120,
    kmDriven: 658,
    kmOverage: 158,
    overageCost: 189.6,
    vehicleFinalState: "minor-damage",
    postRentalPhotos: [
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1000",
      "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1000",
      "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1000",
      "https://images.unsplash.com/photo-1605515589824-0a7d1d5a50cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1000",
    ],
  },
];

export const categories: string[] = [
  "Toutes",
  "Berline",
  "SUV",
  "Sportive",
  "Cabriolet",
  "Électrique",
  "Avec chauffeur",
];

export interface LoyaltyTier {
  id: string;
  name: string;
  points: number;
  color: string;
  benefits: string[];
}

export interface LoyaltyHistoryItem {
  id: string;
  type: "earned" | "spent";
  amount: number;
  description: string;
  date: string;
}

export const loyaltyTiers: LoyaltyTier[] = [
  {
    id: "bronze",
    name: "Bronze",
    points: 0,
    color: "#2E1C2B",
    benefits: [
      "2% de réduction sur toutes les locations",
      "Support par email",
      "Points sur chaque location",
    ],
  },
  {
    id: "silver",
    name: "Argent",
    points: 1000,
    color: "#2E1C2B",
    benefits: [
      "5% de réduction sur toutes les locations",
      "Livraison gratuite",
      "Accès prioritaire aux nouveautés",
      "Support dédié",
    ],
  },
  {
    id: "gold",
    name: "Or",
    points: 3000,
    color: "#4A1942",
    benefits: [
      "10% de réduction sur toutes les locations",
      "Livraison et retour gratuits",
      "Surclassement gratuit selon disponibilité",
      "Accès VIP aux nouveautés",
      "Support prioritaire 24/7",
    ],
  },
  {
    id: "platinum",
    name: "Platine",
    points: 7000,
    color: "#4A1942",
    benefits: [
      "15% de réduction sur toutes les locations",
      "Tous les services gratuits",
      "Surclassement garanti",
      "Accès exclusif aux véhicules de collection",
      "Concierge dédié 24/7",
      "Champagne de bienvenue",
    ],
  },
];

export const loyaltyHistory: LoyaltyHistoryItem[] = [
  {
    id: "1",
    type: "earned",
    amount: 320,
    description: "Location Porsche 911",
    date: "15 Juin",
  },
  {
    id: "2",
    type: "earned",
    amount: 80,
    description: "Avis laissé",
    date: "16 Juin",
  },
  {
    id: "3",
    type: "spent",
    amount: -500,
    description: "Réduction utilisée",
    date: "20 Juin",
  },
  {
    id: "4",
    type: "earned",
    amount: 280,
    description: "Location Range Rover",
    date: "8 Avril",
  },
];

export interface Review {
  id: string;
  agencyId: string;
  userName: string;
  rating: number;
  date: string;
  comment: string;
  agencyResponse: string | null;
}

export const reviews: Review[] = [
  {
    id: "1",
    agencyId: "1",
    userName: "Sophie Martin",
    rating: 5,
    date: "15 Mars 2026",
    comment:
      "Service impeccable ! La Porsche était dans un état parfait et l'équipe très professionnelle. Je recommande vivement.",
    agencyResponse:
      "Merci Sophie pour votre confiance ! Au plaisir de vous revoir bientôt.",
  },
  {
    id: "2",
    agencyId: "1",
    userName: "Ahmed Benali",
    rating: 4,
    date: "10 Mars 2026",
    comment:
      "Très belle expérience. Petit bémol sur le délai de livraison mais le véhicule était exceptionnel.",
    agencyResponse: null,
  },
  {
    id: "3",
    agencyId: "1",
    userName: "Jean-Pierre Dupont",
    rating: 5,
    date: "5 Mars 2026",
    comment:
      "Une agence au top ! Personnel accueillant, véhicules de qualité et tarifs compétitifs.",
    agencyResponse:
      "Merci beaucoup Jean-Pierre ! C'est toujours un plaisir.",
  },
];

export type NotificationType =
  | "booking"
  | "delivery"
  | "loyalty"
  | "kyc"
  | "review"
  | "return_summary_ready";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  time: string;
  read: boolean;
  /** Deep-link route for notifications that open a specific screen. */
  route?: string;
}

export const notifications: Notification[] = [
  {
    id: "0",
    type: "return_summary_ready",
    title: "Votre résumé de retour MF-2026-0789 est disponible",
    time: "1h",
    read: false,
    route: "/booking-summary/3",
  },
  {
    id: "1",
    type: "booking",
    title: "Votre réservation #MF-2026-0847 est confirmée",
    time: "2h",
    read: false,
  },
  {
    id: "2",
    type: "delivery",
    title: "Votre véhicule est en route — arrivée estimée à 10:15",
    time: "3h",
    read: false,
  },
  {
    id: "3",
    type: "loyalty",
    title: "Vous avez gagné 320 points de fidélité",
    time: "1j",
    read: true,
  },
  {
    id: "4",
    type: "kyc",
    title: "Votre identité a été vérifiée avec succès",
    time: "2j",
    read: true,
  },
  {
    id: "5",
    type: "review",
    title: "N'oubliez pas de laisser un avis pour votre dernière location",
    time: "3j",
    read: true,
  },
];

export const cities: string[] = [
  "Nice",
  "Cannes",
  "Monaco",
  "Antibes",
  "Marseille",
  "Paris",
];

export const dateRanges: string[] = [
  "12 — 15 Juin",
  "18 — 21 Juin",
  "25 — 28 Juin",
  "1 — 4 Juil",
  "8 — 11 Juil",
  "15 — 18 Juil",
];

export const vehicleImages: string[] = [
  "https://images.unsplash.com/photo-1654159866733-09f0614c3b79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "https://images.unsplash.com/photo-1629086314381-8f4c852a3c03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "https://images.unsplash.com/photo-1771670305417-41ab8254689e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "https://images.unsplash.com/photo-1506616995931-556bc0c90c16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "https://images.unsplash.com/photo-1648482845536-8882f465df95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "https://images.unsplash.com/photo-1648571902986-fd8cd71256b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "https://images.unsplash.com/photo-1629086314381-8f4c852a3c03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "https://images.unsplash.com/photo-1506616995931-556bc0c90c16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "https://images.unsplash.com/photo-1654159866733-09f0614c3b79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "https://images.unsplash.com/photo-1648482845536-8882f465df95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "https://images.unsplash.com/photo-1771670305417-41ab8254689e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
];
