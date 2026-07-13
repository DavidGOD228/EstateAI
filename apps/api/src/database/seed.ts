import 'reflect-metadata';
import { Property, PropertyType } from '../properties/property.entity';
import { AppDataSource } from './data-source';

interface SeedProperty {
  externalRef: string;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  country: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  propertyType: PropertyType;
  features: string[];
}

const SEED_PROPERTIES: SeedProperty[] = [
  {
    externalRef: 'tallinn-kesklinn-2br-01',
    title: 'Bright two-bedroom flat in Kesklinn',
    description:
      'A well-kept two-bedroom apartment on the third floor of a renovated pre-war building in Kesklinn. Large windows fill the living room with natural light, and the kitchen was updated in 2021. Walking distance to the Old Town and Rotermann Quarter.',
    price: 189000,
    address: 'Pärnu mnt 22, Kesklinn',
    city: 'Tallinn',
    country: 'Estonia',
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 62,
    propertyType: 'apartment',
    features: ['Renovated kitchen', 'Balcony', 'Close to Old Town', 'Elevator'],
  },
  {
    externalRef: 'tallinn-kadriorg-3br-01',
    title: 'Family apartment near Kadriorg Park',
    description:
      'Spacious three-bedroom apartment two streets from Kadriorg Park and the Kadriorg Art Museum. The building has a secured entrance and a shared courtyard. Good access to public transport into the city centre.',
    price: 245000,
    address: 'Weizenbergi 18, Kadriorg',
    city: 'Tallinn',
    country: 'Estonia',
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 88,
    propertyType: 'apartment',
    features: ['Near park', 'Secured entrance', 'Storage room', 'Close to tram stop'],
  },
  {
    externalRef: 'tallinn-kalamaja-studio-01',
    title: 'Compact studio in creative Kalamaja',
    description:
      'A cosy studio in a wooden Kalamaja house, fully renovated in 2020. The neighbourhood is known for its cafes, galleries, and the Balti jaam Market. Ideal as a first home or rental investment.',
    price: 99000,
    address: 'Kalju 9, Kalamaja',
    city: 'Tallinn',
    country: 'Estonia',
    bedrooms: 0,
    bathrooms: 1,
    areaSqm: 28,
    propertyType: 'studio',
    features: ['Renovated', 'Wooden house', 'Close to Balti Station Market'],
  },
  {
    externalRef: 'tallinn-mustamae-1br-01',
    title: 'Affordable one-bedroom in Mustamäe',
    description:
      'A practical one-bedroom apartment in a 1970s panel building in Mustamäe. Recently repainted common areas and a functioning lift. Nearby schools, a supermarket, and direct bus routes to the centre.',
    price: 89000,
    address: 'Sütiste tee 14, Mustamäe',
    city: 'Tallinn',
    country: 'Estonia',
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 38,
    propertyType: 'apartment',
    features: ['Lift', 'Close to schools', 'Supermarket nearby'],
  },
  {
    externalRef: 'tallinn-pirita-house-01',
    title: 'Detached house near Pirita beach',
    description:
      'A four-bedroom detached house with a private garden, a ten-minute walk from Pirita beach and the marina. Two floors, a garage, and a terrace facing south. Quiet residential street with easy access to the city centre.',
    price: 590000,
    address: 'Rummu tee 6, Pirita',
    city: 'Tallinn',
    country: 'Estonia',
    bedrooms: 4,
    bathrooms: 3,
    areaSqm: 176,
    propertyType: 'house',
    features: ['Private garden', 'Garage', 'Terrace', 'Close to beach'],
  },
  {
    externalRef: 'tallinn-kesklinn-studio-02',
    title: 'Modern studio steps from the Old Town wall',
    description:
      'A newly built studio in a small boutique building just outside the Old Town wall. Underfloor heating and a fitted kitchenette. Popular with professionals who want to walk to work in the city centre.',
    price: 112000,
    address: 'Väike-Karja 4, Kesklinn',
    city: 'Tallinn',
    country: 'Estonia',
    bedrooms: 0,
    bathrooms: 1,
    areaSqm: 31,
    propertyType: 'studio',
    features: ['Underfloor heating', 'New building', 'Walking distance to Old Town'],
  },
  {
    externalRef: 'tallinn-kadriorg-house-01',
    title: 'Five-bedroom villa in Kadriorg',
    description:
      'A generous five-bedroom villa on a tree-lined street in Kadriorg, one of Tallinn\'s most established districts. Two reception rooms, a home office, and a landscaped garden. Sold with an attached garage for two cars.',
    price: 750000,
    address: 'Poska 12, Kadriorg',
    city: 'Tallinn',
    country: 'Estonia',
    bedrooms: 5,
    bathrooms: 3,
    areaSqm: 240,
    propertyType: 'house',
    features: ['Landscaped garden', 'Two-car garage', 'Home office', 'Quiet street'],
  },
  {
    externalRef: 'tallinn-kalamaja-townhouse-01',
    title: 'Restored townhouse in Kalamaja',
    description:
      'A three-bedroom townhouse behind a restored wooden facade in Kalamaja, combining period character with a full interior renovation completed in 2019. Small private yard at the rear. Close to Telliskivi Creative City.',
    price: 320000,
    address: 'Kotzebue 11, Kalamaja',
    city: 'Tallinn',
    country: 'Estonia',
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 118,
    propertyType: 'townhouse',
    features: ['Restored facade', 'Private yard', 'Close to Telliskivi'],
  },
  {
    externalRef: 'tallinn-mustamae-2br-02',
    title: 'Two-bedroom apartment with balcony in Mustamäe',
    description:
      'A tidy two-bedroom apartment on a high floor with an unobstructed balcony view. The building underwent facade renovation in 2018, improving insulation. A short walk to the Tallinn University of Technology campus.',
    price: 118000,
    address: 'Ehitajate tee 79, Mustamäe',
    city: 'Tallinn',
    country: 'Estonia',
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 54,
    propertyType: 'apartment',
    features: ['Balcony', 'Renovated facade', 'Close to university'],
  },
  {
    externalRef: 'tartu-2br-01',
    title: 'Central Tartu apartment near the river',
    description:
      'A two-bedroom apartment a few minutes\' walk from the Emajõgi river and central Tartu. The building has a secure bike storage room in the basement. Good rental demand from students and university staff.',
    price: 108000,
    address: 'Riia 45',
    city: 'Tartu',
    country: 'Estonia',
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 58,
    propertyType: 'apartment',
    features: ['Bike storage', 'Close to river', 'Close to university'],
  },
  {
    externalRef: 'tartu-house-01',
    title: 'Detached house in a quiet Tartu suburb',
    description:
      'A four-bedroom house on a fenced plot in a quiet residential area of Tartu. Wood-burning stove alongside central heating, and a carport for one vehicle. Close to a primary school and local shops.',
    price: 265000,
    address: 'Ilmatari 8',
    city: 'Tartu',
    country: 'Estonia',
    bedrooms: 4,
    bathrooms: 2,
    areaSqm: 152,
    propertyType: 'house',
    features: ['Fenced plot', 'Wood-burning stove', 'Carport', 'Close to school'],
  },
  {
    externalRef: 'parnu-2br-01',
    title: 'Seaside-area apartment in Pärnu',
    description:
      'A two-bedroom apartment a short walk from Pärnu\'s beach promenade, well suited as a summer home or year-round residence. The complex includes a shared sauna. Recently serviced heating system.',
    price: 142000,
    address: 'Ranna puiestee 15',
    city: 'Pärnu',
    country: 'Estonia',
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 64,
    propertyType: 'apartment',
    features: ['Close to beach', 'Shared sauna', 'Serviced heating system'],
  },
];

async function run(): Promise<void> {
  await AppDataSource.initialize();
  try {
    await AppDataSource.createQueryBuilder()
      .insert()
      .into(Property)
      .values(SEED_PROPERTIES)
      .onConflict('("externalRef") DO NOTHING')
      .execute();
    console.log(
      `[seed] Processed ${SEED_PROPERTIES.length} listings (rows with an existing externalRef were left untouched).`,
    );
  } finally {
    await AppDataSource.destroy();
  }
}

run()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('[seed] Seeding failed:', error);
    process.exit(1);
  });
