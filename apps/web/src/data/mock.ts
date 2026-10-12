export type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
  featured?: boolean;
};

export type DaySlot = {
  time: string;
  state: "busy" | "free";
};

export const shop = {
  name: "Полоса",
  city: "Ташкент",
  district: "Юнусабад",
  address: "Юнусабадский район, ул. Ахмада Дониша, 2",
  phoneDisplay: "+998 71 200 15 00",
  phoneHref: "tel:+998712001500",
  hours: "Ежедневно, 10:00–21:00",
  lat: 41.355,
  lng: 69.288,
};

export const reviews: Review[] = [
  {
    id: "rustam",
    author: "Рустам",
    rating: 5,
    featured: true,
    text: "Сел в 18:10, вышел в 18:50. Фейд ровный, шею не обожгли.",
  },
  {
    id: "behruz",
    author: "Бехруз",
    rating: 5,
    text: "Бороду подровняли по форме лица, а не одинаково для всех.",
  },
  {
    id: "malika",
    author: "Малика",
    rating: 4,
    text: "Сын впервые стригся спокойно: мастер не торопил и не включал машинку сразу.",
  },
];

export const dayExample: DaySlot[] = [
  { time: "10:00", state: "busy" },
  { time: "10:45", state: "busy" },
  { time: "11:30", state: "free" },
  { time: "12:15", state: "free" },
  { time: "13:00", state: "busy" },
  { time: "15:00", state: "free" },
  { time: "16:30", state: "busy" },
  { time: "18:00", state: "free" },
];

export const bookingSteps = [
  "Услуга",
  "Барбер",
  "Дата",
  "Время",
  "Контакты",
  "Подтверждение",
];
