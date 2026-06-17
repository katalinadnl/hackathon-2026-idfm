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

    // Stat pills
    stat_languages: '6 langues',
    stat_no_account: 'Sans compte',
    stat_network: 'Tout le réseau',

    // Network status
    network_normal: 'Trafic normal',
    network_disrupted: 'Perturbations en cours',
    network_major: 'Trafic très perturbé',
    network_updated: 'Mis à jour à',

    // How to travel (senior-friendly guide)
    how_title: 'Comment voyager',
    how_sub: 'En 3 étapes simples — pour la première fois ou la centième.',
    how_step1_title: 'Achetez votre titre',
    how_step1_desc: 'Dans cette appli, à une borne en station ou directement avec votre carte bancaire sans contact.',
    how_step2_title: 'Validez à chaque montée',
    how_step2_desc: "Posez votre carte, téléphone ou billet sur le valideur à l'entrée — un bip vert confirme.",
    how_step3_title: 'Voyagez librement',
    how_step3_desc: 'Métro, RER, bus, tram, train régional — le même titre vous emmène partout en Île-de-France.',

    // FAQ
    faq_title: 'Questions fréquentes',
    faq_q1: 'Puis-je payer sans espèces ?',
    faq_a1: 'Oui. Votre carte bancaire, Apple Pay ou Google Pay sont acceptés partout — en appli, aux bornes et dans certains bus.',
    faq_q2: 'Comment valider mon titre ?',
    faq_a2: "Approchez votre carte ou téléphone du lecteur à l'entrée du métro, dans le bus ou sur le quai RER. Un bip et un flash vert confirment la validation.",
    faq_q3: "Mon pass couvre-t-il le trajet depuis l'aéroport ?",
    faq_a3: 'Pas toujours — CDG et Orly sont en zones 5. Le billet aéroport ou le RER B direct restent la solution la plus simple depuis CDG.',
    faq_q4: 'Y a-t-il un pass pour les touristes ?',
    faq_a4: 'Oui : Paris Visite offre des trajets illimités 1, 2, 3 ou 5 jours sur tout le réseau, plus des réductions musées et attractions.',
    faq_q5: "L'appli est-elle disponible en anglais ?",
    faq_a5: 'Oui — tout est disponible en français, anglais, espagnol, allemand, arabe et mandarin. Changez la langue en haut à droite.',
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

    stat_languages: '6 languages',
    stat_no_account: 'No account needed',
    stat_network: 'Full network',

    network_normal: 'Normal service',
    network_disrupted: 'Disruptions in progress',
    network_major: 'Severe disruption',
    network_updated: 'Updated at',

    how_title: 'How to travel',
    how_sub: "Three simple steps — whether it's your first time or your hundredth.",
    how_step1_title: 'Buy your ticket',
    how_step1_desc: 'In this app, at any station machine, or tap your bank card or phone directly at the gate.',
    how_step2_title: 'Tap at every boarding',
    how_step2_desc: 'Hold your card, phone or ticket near the reader at the metro gate, bus door or RER platform. A green beep means you\'re in.',
    how_step3_title: 'Travel freely',
    how_step3_desc: 'Metro, RER, bus, tram, regional rail — the same ticket takes you everywhere across Île-de-France.',

    faq_title: 'Frequently asked questions',
    faq_q1: 'Can I pay without cash?',
    faq_a1: 'Yes. Your bank card, Apple Pay or Google Pay are accepted everywhere — in the app, at machines and on most buses.',
    faq_q2: 'How do I validate my ticket?',
    faq_a2: 'Hold your card or phone near the reader at the metro gate, bus door or RER platform. A green beep and light confirm validation.',
    faq_q3: 'Does my pass cover the airport journey?',
    faq_a3: 'Not always — CDG and Orly are in zone 5. An airport ticket or the RER B direct service is the simplest option from CDG.',
    faq_q4: 'Is there a pass for tourists?',
    faq_a4: 'Yes — Paris Visite gives unlimited travel for 1, 2, 3 or 5 days across the whole network, plus discounts at museums and attractions.',
    faq_q5: 'Is the app available in English?',
    faq_a5: 'Yes — everything is available in French, English, Spanish, German, Arabic and Mandarin. Change the language at the top right.',
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