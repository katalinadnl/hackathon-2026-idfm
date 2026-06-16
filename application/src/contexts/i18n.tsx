import React, { createContext, useContext, useState } from 'react';

const translations = {
  fr: {
    // Navigation
    nav_journeys: 'Itinéraires',
    nav_lines: 'Lignes & horaires',
    nav_tickets: 'Titres & tarifs',
    nav_traffic: 'Infos trafic',
    nav_account: 'Mon compte',
    skip_to_content: 'Aller au contenu principal',

    // Home page
    hero_title: 'Allez partout, simplement.',
    hero_sub: 'Planifiez vos trajets en Île-de-France en temps réel — métro, RER, train, tram et bus.',
    from_label: 'Départ',
    to_label: 'Arrivée',
    from_placeholder: 'Gare, station ou adresse',
    to_placeholder: 'Gare, station ou adresse',
    swap_label: 'Inverser départ et arrivée',
    now_label: 'Maintenant',
    accessible_label: 'Itinéraires accessibles (PMR)',
    search_label: 'Rechercher un itinéraire',
    results_title: 'Itinéraires proposés',
    traffic_title: 'État du trafic en direct',
    popular_title: 'Destinations populaires',
    see_all_lines: 'Voir toutes les lignes',
    from_your_position: 'depuis votre position',
    accessibility_statement: "Déclaration d'accessibilité",

    // Footer
    footer_move: 'Se déplacer',
    footer_itineraires: 'Itinéraires',
    footer_plans: 'Plans du réseau',
    footer_horaires: 'Horaires',
    footer_accessibilite: 'Accessibilité',
    footer_tickets: 'Titres & tarifs',
    footer_navigo: 'Navigo',
    footer_ticket_simple: 'Tickets',
    footer_tarifs_reduits: 'Tarifs réduits',
    footer_remboursement: 'Remboursement',
    footer_aide: 'Aide',
    footer_contact: 'Nous contacter',
    footer_objets: 'Objets trouvés',
    footer_faq: 'FAQ',
    footer_copyright: '© 2026 Comutitres · Île-de-France Mobilités',
    footer_desc: 'Le service public de transport de la région Île-de-France.',

    // Visitors page
    visitors_kicker: "Visiter l'Île-de-France",
    visitors_title: 'Bienvenue à Paris. Se déplacer devient simple.',
    visitors_sub: 'Achetez un pass, planifiez vos trajets et rejoignez tous les sites — métro, RER, tram, bus et train.',
    visitors_where: 'Où souhaitez-vous aller ?',
    visitors_from_ph: 'Aéroport, gare ou adresse',
    visitors_to_ph: 'Site, gare ou adresse',
    visitors_go: 'Trouver mon itinéraire',
    visitors_quick: 'Départs fréquents :',
    passes_title: 'Choisissez le bon titre',
    passes_sub: "Sans parler français — dans l'appli ou à toute borne.",
    passes_select: 'Choisir',
    passes_from: 'dès',
    places_title: 'Lieux incontournables et accès',
    airports_title: "Depuis l'aéroport",
    confidence_title: 'Voyagez sereinement',
    help_button: 'Aide',
    visitors_chips_cdg: 'Depuis CDG',
    visitors_chips_orly: 'Depuis Orly',
    visitors_chips_eiffel: 'Vers la Tour Eiffel',
  },
  en: {
    nav_journeys: 'Journeys',
    nav_lines: 'Lines & times',
    nav_tickets: 'Tickets & fares',
    nav_traffic: 'Traffic info',
    nav_account: 'My account',
    skip_to_content: 'Skip to main content',

    hero_title: 'Go anywhere, simply.',
    hero_sub: 'Plan your trips across Île-de-France in real time — metro, RER, train, tram and bus.',
    from_label: 'From',
    to_label: 'To',
    from_placeholder: 'Station, stop or address',
    to_placeholder: 'Station, stop or address',
    swap_label: 'Swap origin and destination',
    now_label: 'Now',
    accessible_label: 'Step-free journeys (reduced mobility)',
    search_label: 'Search journeys',
    results_title: 'Suggested journeys',
    traffic_title: 'Live network status',
    popular_title: 'Popular destinations',
    see_all_lines: 'See all lines',
    from_your_position: 'from your location',
    accessibility_statement: 'Accessibility statement',

    footer_move: 'Travel',
    footer_itineraires: 'Journey planner',
    footer_plans: 'Network maps',
    footer_horaires: 'Timetables',
    footer_accessibilite: 'Accessibility',
    footer_tickets: 'Tickets & fares',
    footer_navigo: 'Navigo',
    footer_ticket_simple: 'Single tickets',
    footer_tarifs_reduits: 'Reduced fares',
    footer_remboursement: 'Refunds',
    footer_aide: 'Help',
    footer_contact: 'Contact us',
    footer_objets: 'Lost property',
    footer_faq: 'FAQ',
    footer_copyright: '© 2026 Comutitres · Île-de-France Mobilités',
    footer_desc: 'The public transport service for the Île-de-France region.',

    visitors_kicker: 'Visiting Île-de-France',
    visitors_title: 'Welcome to Paris. Getting around is easy.',
    visitors_sub: 'Buy a pass, plan any trip and reach every landmark — across metro, RER, tram, bus and train.',
    visitors_where: 'Where would you like to go?',
    visitors_from_ph: 'Airport, station or address',
    visitors_to_ph: 'Attraction, station or address',
    visitors_go: 'Find my route',
    visitors_quick: 'Popular starts:',
    passes_title: 'Choose the right pass',
    passes_sub: 'No French required — buy in the app or at any station machine.',
    passes_select: 'Select',
    passes_from: 'from',
    places_title: 'Top places & how to get there',
    airports_title: 'Coming from the airport',
    confidence_title: 'Travel with confidence',
    help_button: 'Help in English',
    visitors_chips_cdg: 'From CDG Airport',
    visitors_chips_orly: 'From Orly',
    visitors_chips_eiffel: 'To Eiffel Tower',
  },
} as const;

type Lang = keyof typeof translations;
type TranslationKey = keyof typeof translations.fr;

type I18nContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr');

  const t = (key: TranslationKey): string => {
    const dict = translations[lang] as Record<string, string>;
    return dict[key] ?? (translations.fr as Record<string, string>)[key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang: setLang as any, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}