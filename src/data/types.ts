export interface Site {
  title: string;
  description: string;
  locale: string;
  brand: string;
  mainSite: string;
  privacyUrl: string;
}

export interface WhatsApp {
  number: string;
  display: string;
  message: string;
}

export interface Price {
  /** Texto tal como se muestra, p. ej. "$1.980.000". */
  amount: string;
  /** Valor numérico para datos estructurados. */
  value: number;
  currency: string;
  period: string;
}

export interface Stat {
  value: string;
  label: string;
  /** Muestra el valor en amarillo. */
  highlight?: boolean;
}

export interface Service {
  /** Nombre de un ícono definido en `components/ui/Icon.astro`. */
  icon: string;
  title: string;
  description: string;
}

export interface TeamMember {
  name: string;
  role: string;
  area: string;
  /** Nombre del archivo en `src/assets/team/` sin extensión, o `null` para el placeholder. */
  photo: string | null;
}

export interface Faq {
  q: string;
  a: string;
}

/** Mensaje de un proveedor suelto en la escena del plan: `before` + **amount** + `after`. */
export interface Provider {
  sender: string;
  before: string;
  amount: string;
  after: string;
}

export interface Landing {
  site: Site;
  whatsapp: WhatsApp;
  price: Price;
  stats: Stat[];
  services: Service[];
  team: TeamMember[];
  faqs: Faq[];
  plan: { includes: string[] };
  providers: Provider[];
}
